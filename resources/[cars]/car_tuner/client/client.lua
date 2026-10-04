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

--- Sends a chat notification to the local player.
--- @param msg string
local function Notify(msg)
    TriggerEvent('chat:addMessage', {
        color     = { 255, 180, 0 },
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
        snap[f] = GetVehicleHandlingFloat(veh, 'CHandlingData', f)
    end

    -- CHandlingData integers
    for _, f in ipairs(INT_FIELDS) do
        snap[f] = GetVehicleHandlingInt(veh, 'CHandlingData', f)
    end

    -- CHandlingData vectors → flatten to x/y/z component keys
    for _, f in ipairs(VECTOR_FIELDS) do
        local v = GetVehicleHandlingVector(veh, 'CHandlingData', f)
        snap[f .. '.x'] = v.x
        snap[f .. '.y'] = v.y
        snap[f .. '.z'] = v.z
    end

    -- CCarHandlingData floats (sub-handler)
    for _, f in ipairs(SUB_FLOAT_FIELDS) do
        snap[f] = GetVehicleHandlingFloat(veh, 'CCarHandlingData', f)
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
        action = 'openUI',
        values = snapshot
    })
end

-- ── Command Registration ─────────────────────────────────────────────────────

RegisterCommand('tune', function()
    local ped = PlayerPedId()

    if not IsPedInAnyVehicle(ped, false) then
        Notify('You must be inside a vehicle to use the tuner.')
        return
    end

    local veh = GetVehiclePedIsIn(ped, false)
    if veh == 0 then
        Notify('Could not detect your current vehicle.')
        return
    end

    OpenTunerUI(veh)
end, false)

-- ── NUI Callback: updateHandling ─────────────────────────────────────────────
-- Receives { type, field, value [, axis] } and dispatches to the correct
-- native setter based on the declared field type.

RegisterNUICallback('updateHandling', function(data, cb)
    if not currentVehicle or not DoesEntityExist(currentVehicle) then
        cb('error')
        return
    end

    local ftype = data.type
    local field = data.field
    local raw   = data.value

    if not field then
        cb('error')
        return
    end

    if ftype == 'float' then
        local val = tonumber(raw)
        if val then
            SetVehicleHandlingFloat(currentVehicle, 'CHandlingData', field, val + 0.0)
        end

    elseif ftype == 'int' then
        local val = tonumber(raw)
        if val then
            SetVehicleHandlingInt(currentVehicle, 'CHandlingData', field, math.floor(val))
        end

    elseif ftype == 'vector' then
        local axis = data.axis
        local val  = tonumber(raw)
        if val and axis then
            local cur = GetVehicleHandlingVector(currentVehicle, 'CHandlingData', field)
            local x, y, z = cur.x, cur.y, cur.z
            if     axis == 'x' then x = val + 0.0
            elseif axis == 'y' then y = val + 0.0
            elseif axis == 'z' then z = val + 0.0
            end
            SetVehicleHandlingVector(currentVehicle, 'CHandlingData', field, vector3(x, y, z))
        end

    elseif ftype == 'subfloat' then
        local val = tonumber(raw)
        if val then
            SetVehicleHandlingFloat(currentVehicle, 'CCarHandlingData', field, val + 0.0)
        end
    end
    -- 'text' type fields are UI-only for XML export — no runtime native exists.

    -- Force an immediate physics recalculation
    SetVehicleEnginePowerMultiplier(currentVehicle, 1.0)
    ModifyVehicleTopSpeed(currentVehicle, 0.0)

    cb('ok')
end)

-- ── NUI Callback: closeUI ────────────────────────────────────────────────────

RegisterNUICallback('closeUI', function(_, cb)
    SetNuiFocus(false, false)
    currentVehicle = nil
    cb('ok')
end)
