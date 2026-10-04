--[[
    car_tuner/server/server.lua
    Server-side state persistence and network synchronization for custom handling tuning.

    Features:
    - Master in-memory table indexed by cleaned license plate (`TunedVehicles`).
    - On save: stores tuning keyed by plate + sets replicated State Bag + broadcasts to all clients.
    - Callback event `car_tuner:server:getTuningByPlate` returns saved data on demand.
    - On player join: sends the full TunedVehicles table so late-joiners can apply nearby tuned cars.
]]

-- ── Master Persistence Table ─────────────────────────────────────────────────
-- Runtime in-memory store of all tuned vehicles, keyed by trimmed plate string.
-- Survives player disconnects but resets on resource restart.
local TunedVehicles = {}

--- Trims leading/trailing whitespace from a plate string.
--- @param raw string
--- @return string
local function CleanPlate(raw)
    if not raw or raw == '' then return '' end
    return string.gsub(raw, '^%s*(.-)%s*$', '%1')
end

-- ── Save Tuning Event ────────────────────────────────────────────────────────
-- Called by the client after the player clicks "Save Tuning".
-- Persists by plate, updates the entity State Bag, and broadcasts to all clients.

RegisterNetEvent('car_tuner:saveTuning', function(netId, tuningData, plate)
    local src = source
    if not netId or not tuningData then return end

    local cleanedPlate = CleanPlate(plate or '')

    -- Resolve entity from network ID
    local entity = NetworkGetEntityFromNetworkId(netId)

    -- If we didn't receive a plate from the client, try to read from entity
    if cleanedPlate == '' and entity and DoesEntityExist(entity) then
        local rawPlate = GetVehicleNumberPlateText(entity)
        cleanedPlate = CleanPlate(rawPlate or '')
    end

    -- Store in master persistence table (keyed by plate)
    if cleanedPlate ~= '' then
        TunedVehicles[cleanedPlate] = tuningData
        print(('[CarTuner] Saved tuning for plate [%s] by player %d'):format(cleanedPlate, src))
    end

    -- Set replicated State Bag on the entity
    if entity and DoesEntityExist(entity) then
        Entity(entity).state:set('customTuning', tuningData, true)
    end

    -- Broadcast to all clients so every player applies the physics
    TriggerClientEvent('car_tuner:clientApplyTuning', -1, netId, tuningData)
end)

-- ── Get Tuning By Plate (Server Callback) ────────────────────────────────────
-- Client requests saved tuning data for a specific plate.
-- Server responds with the stored data (or nil).

RegisterNetEvent('car_tuner:server:getTuningByPlate', function(plate)
    local src = source
    local cleanedPlate = CleanPlate(plate or '')

    local savedData = nil
    if cleanedPlate ~= '' then
        savedData = TunedVehicles[cleanedPlate] or nil
    end

    TriggerClientEvent('car_tuner:client:receiveTuningByPlate', src, cleanedPlate, savedData)
end)

-- ── Player Joining: Sync All Tuned Vehicles ──────────────────────────────────
-- When a new player connects, send them the full table so they can apply
-- physics to any tuned vehicles already in their streaming range.

AddEventHandler('playerJoining', function()
    local src = source
    -- Only send if there's data to send
    if next(TunedVehicles) then
        TriggerClientEvent('car_tuner:client:syncAllTuning', src, TunedVehicles)
    end
end)

-- ── Debug: List All Tuned Vehicles (Server Console Command) ──────────────────
RegisterCommand('tuner_list', function(source)
    if source ~= 0 then return end -- server console only
    print('[CarTuner] ═══════════════════════════════════════')
    local count = 0
    for plate, data in pairs(TunedVehicles) do
        count = count + 1
        local name = data.handlingName or '???'
        print(('  [%d] Plate: %-10s | Handling: %s'):format(count, plate, name))
    end
    if count == 0 then
        print('  (No tuned vehicles in memory)')
    end
    print('[CarTuner] ═══════════════════════════════════════')
end, true)
