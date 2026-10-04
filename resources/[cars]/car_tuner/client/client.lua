--[[
    car_tuner/client/client.lua
    Comprehensive vehicle handling editor — client-side logic.

    Reads all CHandlingData fields (float, int, vector) and CCarHandlingData
    sub-handler floats. Bridges NUI interactions to native handling setters
    for real-time tuning.
]]

local currentVehicle = nil

-- ── Field Definitions ────────────────────────────────────────────────────────
-- Every field that can be read/written through the handling natives is listed
-- here, grouped by type, so the snapshot builder and update dispatcher can
-- iterate over them generically.

local FLOAT_FIELDS = {
    'fMass',
    'fInitialDragCoeff',
    'fPercentSubmerged',
    'fDriveBiasFront',
    'fInitialDriveForce',
    'fDriveInertia',
    'fClutchChangeRateScaleUpShift',
    'fClutchChangeRateScaleDownShift',
    'fInitialDriveMaxFlatVel',
    'fBrakeForce',
    'fBrakeBiasFront',
    'fHandBrakeForce',
    'fSteeringLock',
    'fTractionCurveMax',
    'fTractionCurveMin',
    'fTractionCurveLateral',
    'fTractionSpringDeltaMax',
    'fLowSpeedTractionLossMult',
    'fCamberStiffnesss',
    'fTractionBiasFront',
    'fTractionLossMult',
    'fSuspensionForce',
    'fSuspensionCompDamp',
    'fSuspensionReboundDamp',
    'fSuspensionUpperLimit',
    'fSuspensionLowerLimit',
    'fSuspensionRaise',
    'fSuspensionBiasFront',
    'fAntiRollBarForce',
    'fAntiRollBarBiasFront',
    'fRollCentreHeightFront',
    'fRollCentreHeightRear',
    'fCollisionDamageMult',
    'fWeaponDamageMult',
    'fDeformationDamageMult',
    'fEngineDamageMult',
    'fPetrolTankVolume',
    'fOilVolume',
    'fSeatOffsetDistX',
    'fSeatOffsetDistY',
    'fSeatOffsetDistZ'
}

local INT_FIELDS = {
    'nInitialDriveGears',
    'nMonetaryValue'
}

local VECTOR_FIELDS = {
    'vecCentreOfMassOffset',
    'vecInertiaMultiplier'
}

--- Sub-handler floats read from CCarHandlingData.
local SUB_FLOAT_FIELDS = {
    'fBackEndPopUpCarImpulseMult',
    'fBackEndPopUpBuildingImpulseMult',
    'fBackEndPopUpMaxDeltaSpeed'
}

-- ── Helpers ──────────────────────────────────────────────────────────────────

--- Sends a notification (minimap ticker + chat).
--- @param msg string
local function Notify(msg)
    BeginTextCommandThefeedPost("STRING")
    AddTextComponentSubstringPlayerName("~b~[CarTuner]~s~ " .. msg)
    EndTextCommandThefeedPostTicker(false, true)

    TriggerEvent('chat:addMessage', {
        color     = { 56, 189, 248 },
        multiline = true,
        args      = { '[CarTuner]', msg }
    })
end

--- Builds a flat key/value map of every readable handling attribute.
--- Vectors are flattened to dot-notation keys (e.g. "vecCentreOfMassOffset.x").
--- @param veh number  Vehicle entity handle.
--- @return table
local function GetHandlingSnapshot(veh)
    local snap = {}

    -- CHandlingData floats
    for _, f in ipairs(FLOAT_FIELDS) do
        local ok, val = pcall(GetVehicleHandlingFloat, veh, 'CHandlingData', f)
        if ok and val ~= nil then
            snap[f] = val
        end
    end

    -- CHandlingData integers
    for _, f in ipairs(INT_FIELDS) do
        local ok, val = pcall(GetVehicleHandlingInt, veh, 'CHandlingData', f)
        if ok and val ~= nil then
            snap[f] = val
        end
    end

    -- CHandlingData vectors → flatten to x/y/z component keys
    for _, f in ipairs(VECTOR_FIELDS) do
        local ok, v = pcall(GetVehicleHandlingVector, veh, 'CHandlingData', f)
        if ok and v ~= nil then
            snap[f .. '.x'] = v.x
            snap[f .. '.y'] = v.y
            snap[f .. '.z'] = v.z
        end
    end

    -- CCarHandlingData floats (sub-handler)
    for _, f in ipairs(SUB_FLOAT_FIELDS) do
        local ok, val = pcall(GetVehicleHandlingFloat, veh, 'CCarHandlingData', f)
        if ok and val ~= nil then
            snap[f] = val
        end
    end

    return snap
end

-- ── Open Tuner UI ────────────────────────────────────────────────────────────

--- Opens the NUI editor panel and sends the vehicle's current handling state.
--- @param veh number
local function OpenTunerUI(veh)
    currentVehicle = veh
    SetNuiFocus(true, true)

    local snapshot = GetHandlingSnapshot(veh)

    SendNUIMessage({
        action   = 'open',
        handling = snapshot,
        -- Backward-compatibility aliases
        values   = snapshot
    })
end

-- ── Command Registration ─────────────────────────────────────────────────────

RegisterCommand('tune', function()
    local ped = PlayerPedId()

    if not IsPedInAnyVehicle(ped, false) then
        Notify('คุณต้องอยู่บนยานพาหนะเพื่อใช้งานระบบจูน (You must be inside a vehicle)')
        return
    end

    local veh = GetVehiclePedIsIn(ped, false)
    if veh == 0 then
        Notify('ไม่พบยานพาหนะที่คุณกำลังขับขี่ (Vehicle not found)')
        return
    end

    OpenTunerUI(veh)
end, false)

-- ── Apply Handling Data Helper ──────────────────────────────────────────────
--- Iterates over provided tuningData and applies all float, int, vector, and subfloat values to the vehicle entity.
--- @param veh number        Vehicle entity handle
--- @param tuningData table  Key-value map of handling attributes
local function ApplyHandlingData(veh, tuningData)
    if not veh or not DoesEntityExist(veh) or not tuningData then return end

    -- Float fields
    for _, f in ipairs(FLOAT_FIELDS) do
        if tuningData[f] ~= nil then
            local val = tonumber(tuningData[f])
            if val then
                SetVehicleHandlingFloat(veh, 'CHandlingData', f, val + 0.0)
            end
        end
    end

    -- Int fields
    for _, f in ipairs(INT_FIELDS) do
        if tuningData[f] ~= nil then
            local val = tonumber(tuningData[f])
            if val then
                SetVehicleHandlingInt(veh, 'CHandlingData', f, math.floor(val))
            end
        end
    end

    -- Vector fields
    for _, f in ipairs(VECTOR_FIELDS) do
        local ok, cur = pcall(GetVehicleHandlingVector, veh, 'CHandlingData', f)
        if ok and cur then
            local x = tonumber(tuningData[f .. '.x']) or cur.x
            local y = tonumber(tuningData[f .. '.y']) or cur.y
            local z = tonumber(tuningData[f .. '.z']) or cur.z
            SetVehicleHandlingVector(veh, 'CHandlingData', f, vector3(x + 0.0, y + 0.0, z + 0.0))
        end
    end

    -- Sub-handler floats (CCarHandlingData)
    for _, f in ipairs(SUB_FLOAT_FIELDS) do
        if tuningData[f] ~= nil then
            local val = tonumber(tuningData[f])
            if val then
                SetVehicleHandlingFloat(veh, 'CCarHandlingData', f, val + 0.0)
            end
        end
    end

    -- Force immediate physics recalculation
    SetVehicleEnginePowerMultiplier(veh, 1.0)
    ModifyVehicleTopSpeed(veh, 0.0)
end

-- ── NUI Callback: saveHandling ───────────────────────────────────────────────
-- Commits the player's draft tuning to the vehicle and syncs via State Bag.

RegisterNUICallback('saveHandling', function(tuningData, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)

    if (veh == 0 or not DoesEntityExist(veh)) and currentVehicle and DoesEntityExist(currentVehicle) then
        veh = currentVehicle
    end

    if veh == 0 or not DoesEntityExist(veh) then
        Notify('ไม่พบยานพาหนะที่จะบันทึกค่า (Vehicle not found)')
        cb('error')
        return
    end

    -- Store tuning inside vehicle State Bag (replicated across network)
    Entity(veh).state:set('customTuning', tuningData, true)

    -- Trigger server event to persist and broadcast
    local netId = VehToNet(veh)
    if netId and netId ~= 0 then
        TriggerServerEvent('car_tuner:saveTuning', netId, tuningData)
    end

    -- Apply physical handling attributes immediately to local vehicle
    ApplyHandlingData(veh, tuningData)

    Notify('บันทึกค่าจูนสำเร็จ! ปรับแต่งสมรรถนะรถเรียบร้อยแล้ว')
    cb('ok')
end)


AddStateBagChangeHandler('customTuning', nil, function(bagName, key, value, _unused, replicated)
    if not value then return end
    local entity = GetEntityFromStateBagName(bagName)
    if entity and entity ~= 0 and DoesEntityExist(entity) and GetEntityType(entity) == 2 then
        ApplyHandlingData(entity, value)
    end
end)

RegisterNetEvent('car_tuner:clientApplyTuning', function(netId, tuningData)
    if NetworkDoesNetworkIdExist(netId) then
        local veh = NetToVeh(netId)
        if veh and DoesEntityExist(veh) then
            ApplyHandlingData(veh, tuningData)
        end
    end
end)

RegisterNUICallback('closeUI', function(_, cb)
    SetNuiFocus(false, false)
    currentVehicle = nil
    cb('ok')
end)
