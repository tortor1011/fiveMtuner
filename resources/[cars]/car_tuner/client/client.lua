--[[
    car_tuner/client/client.lua
    Comprehensive vehicle handling editor — client-side logic.

    Enhanced for Add-on / Custom Mod Vehicles & Base GTA V Vehicles:
    - Safe property fetching with sports-class baselines preventing 0.00 / NaN bugs.
    - Automatic SetVehicleModKit(veh, 0) cache initialization.
    - Dual-Layer Tuning Engine: Native CHandlingData + Dynamic Engine Power & Top Speed Multipliers.
    - Per-Vehicle State Bag synchronization & automatic persistence across vehicle entries.
    - Vehicle identity retrieval (Display Name, Model, Number Plate).
]]

local currentVehicle = nil

-- ── Baseline Defaults for Add-on / Custom Mod Vehicles ───────────────────────
local DEFAULT_BASELINE = {
    fMass = 1500.0,
    fInitialDragCoeff = 10.0,
    fPercentSubmerged = 85.0,
    fDriveBiasFront = 0.0,
    nInitialDriveGears = 6,
    fInitialDriveForce = 0.32,
    fDriveInertia = 1.0,
    fClutchChangeRateScaleUpShift = 2.5,
    fClutchChangeRateScaleDownShift = 2.5,
    fInitialDriveMaxFlatVel = 160.0,
    fBrakeForce = 1.2,
    fBrakeBiasFront = 0.52,
    fHandBrakeForce = 0.8,
    fSteeringLock = 40.0,
    fTractionCurveMax = 2.3,
    fTractionCurveMin = 2.1,
    fTractionCurveLateral = 22.5,
    fTractionSpringDeltaMax = 0.15,
    fLowSpeedTractionLossMult = 0.0,
    fCamberStiffnesss = 0.0,
    fTractionBiasFront = 0.485,
    fTractionLossMult = 1.0,
    fSuspensionForce = 2.4,
    fSuspensionCompDamp = 1.4,
    fSuspensionReboundDamp = 1.8,
    fSuspensionUpperLimit = 0.10,
    fSuspensionLowerLimit = -0.12,
    fSuspensionRaise = 0.0,
    fSuspensionBiasFront = 0.50,
    fAntiRollBarForce = 0.6,
    fAntiRollBarBiasFront = 0.52,
    fRollCentreHeightFront = 0.35,
    fRollCentreHeightRear = 0.35,
    fCollisionDamageMult = 0.7,
    fWeaponDamageMult = 1.0,
    fDeformationDamageMult = 0.7,
    fEngineDamageMult = 1.5,
    fPetrolTankVolume = 65.0,
    fOilVolume = 5.0,
    fSeatOffsetDistX = 0.0,
    fSeatOffsetDistY = 0.0,
    fSeatOffsetDistZ = 0.0,
    nMonetaryValue = 50000,
    ['vecCentreOfMassOffset.x'] = 0.0,
    ['vecCentreOfMassOffset.y'] = 0.0,
    ['vecCentreOfMassOffset.z'] = 0.0,
    ['vecInertiaMultiplier.x'] = 1.2,
    ['vecInertiaMultiplier.y'] = 1.2,
    ['vecInertiaMultiplier.z'] = 1.4,
    fBackEndPopUpCarImpulseMult = 0.075,
    fBackEndPopUpBuildingImpulseMult = 0.03,
    fBackEndPopUpMaxDeltaSpeed = 0.25,
    handlingName = 'CUSTOM_MOD',
    AIHandling = 'AVERAGE',
    strModelFlags = '0',
    strHandlingFlags = '0',
    strDamageFlags = '0'
}

-- Fields that can legitimately have 0 as a valid physics value
local CAN_BE_ZERO = {
    fDriveBiasFront = true,
    fSuspensionRaise = true,
    fCamberStiffnesss = true,
    fLowSpeedTractionLossMult = true,
    fAntiRollBarForce = true,
    fSeatOffsetDistX = true,
    fSeatOffsetDistY = true,
    fSeatOffsetDistZ = true,
    fRollCentreHeightFront = true,
    fRollCentreHeightRear = true,
    ['vecCentreOfMassOffset.x'] = true,
    ['vecCentreOfMassOffset.y'] = true,
    ['vecCentreOfMassOffset.z'] = true
}

-- ── Field Definitions ────────────────────────────────────────────────────────

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

--- Checks if a number is NaN.
--- @param val number
--- @return boolean
local function IsNaN(val)
    return type(val) == 'number' and val ~= val
end

--- Safe handling float getter with custom fallback resolution.
--- Prevents mod vehicles returning 0.0 or nil from corrupting tuner inputs.
--- @param veh number
--- @param className string
--- @param field string
--- @param fallbackVal number
--- @return number
local function GetSafeHandlingFloat(veh, className, field, fallbackVal)
    local ok, val = pcall(GetVehicleHandlingFloat, veh, className, field)
    if not ok or val == nil or IsNaN(val) then
        return fallbackVal
    end
    -- If native returned 0.0 for a field that should never realistically be 0
    if val == 0.0 and not CAN_BE_ZERO[field] then
        return fallbackVal
    end
    return val
end

--- Retrieves human-readable vehicle name, model, and license plate.
--- @param veh number
--- @return string, string, string
local function GetVehicleIdentity(veh)
    if not veh or not DoesEntityExist(veh) then
        return 'Unknown Vehicle', 'UNKNOWN', ''
    end

    local model = GetEntityModel(veh)
    local displayName = GetDisplayNameFromVehicleModel(model) or 'VEHICLE'
    local labelName = GetLabelText(displayName)

    if labelName == 'NULL' or not labelName or labelName == '' then
        labelName = displayName
    end

    local plate = GetVehicleNumberPlateText(veh) or ''
    plate = string.gsub(plate, '^%s*(.-)%s*$', '%1') -- trim whitespace

    return labelName, displayName, plate
end

--- Builds a flat key/value map of every readable handling attribute.
--- Vectors are flattened to dot-notation keys (e.g. "vecCentreOfMassOffset.x").
--- @param veh number  Vehicle entity handle.
--- @return table
local function GetHandlingSnapshot(veh)
    local snap = {}

    -- CHandlingData floats
    for _, f in ipairs(FLOAT_FIELDS) do
        local fallback = DEFAULT_BASELINE[f] or 1.0
        snap[f] = GetSafeHandlingFloat(veh, 'CHandlingData', f, fallback)
    end

    -- CHandlingData integers
    for _, f in ipairs(INT_FIELDS) do
        local fallback = DEFAULT_BASELINE[f] or 1
        local ok, val = pcall(GetVehicleHandlingInt, veh, 'CHandlingData', f)
        if ok and val ~= nil and val > 0 then
            snap[f] = val
        else
            snap[f] = fallback
        end
    end

    -- CHandlingData vectors → flatten to x/y/z component keys
    for _, f in ipairs(VECTOR_FIELDS) do
        local ok, v = pcall(GetVehicleHandlingVector, veh, 'CHandlingData', f)
        if ok and v ~= nil then
            snap[f .. '.x'] = IsNaN(v.x) and (DEFAULT_BASELINE[f .. '.x'] or 0.0) or v.x
            snap[f .. '.y'] = IsNaN(v.y) and (DEFAULT_BASELINE[f .. '.y'] or 0.0) or v.y
            snap[f .. '.z'] = IsNaN(v.z) and (DEFAULT_BASELINE[f .. '.z'] or 0.0) or v.z
        else
            snap[f .. '.x'] = DEFAULT_BASELINE[f .. '.x'] or 0.0
            snap[f .. '.y'] = DEFAULT_BASELINE[f .. '.y'] or 0.0
            snap[f .. '.z'] = DEFAULT_BASELINE[f .. '.z'] or 0.0
        end
    end

    -- CCarHandlingData floats (sub-handler)
    for _, f in ipairs(SUB_FLOAT_FIELDS) do
        local fallback = DEFAULT_BASELINE[f] or 0.05
        snap[f] = GetSafeHandlingFloat(veh, 'CCarHandlingData', f, fallback)
    end

    return snap
end

-- ── Dual-Layer Tuning Engine: Apply Handling Data ───────────────────────────
--- Applies all handling attributes + engine torque & top-speed entity multipliers.
--- @param veh number        Vehicle entity handle
--- @param tuningData table  Key-value map of handling attributes
local function ApplyHandlingData(veh, tuningData)
    if not veh or not DoesEntityExist(veh) or not tuningData then return end

    -- Initialize mod kit to ensure handling registers on custom vehicles
    SetVehicleModKit(veh, 0)

    -- 1. Apply Float fields to CHandlingData
    for _, f in ipairs(FLOAT_FIELDS) do
        if tuningData[f] ~= nil then
            local val = tonumber(tuningData[f])
            if val then
                SetVehicleHandlingFloat(veh, 'CHandlingData', f, val + 0.0)
            end
        end
    end

    -- 2. Apply Int fields to CHandlingData
    for _, f in ipairs(INT_FIELDS) do
        if tuningData[f] ~= nil then
            local val = tonumber(tuningData[f])
            if val then
                SetVehicleHandlingInt(veh, 'CHandlingData', f, math.floor(val))
            end
        end
    end

    -- 3. Apply Vector fields to CHandlingData
    for _, f in ipairs(VECTOR_FIELDS) do
        local curOk, cur = pcall(GetVehicleHandlingVector, veh, 'CHandlingData', f)
        local curX = curOk and cur and cur.x or (DEFAULT_BASELINE[f .. '.x'] or 0.0)
        local curY = curOk and cur and cur.y or (DEFAULT_BASELINE[f .. '.y'] or 0.0)
        local curZ = curOk and cur and cur.z or (DEFAULT_BASELINE[f .. '.z'] or 0.0)

        local x = tonumber(tuningData[f .. '.x']) or curX
        local y = tonumber(tuningData[f .. '.y']) or curY
        local z = tonumber(tuningData[f .. '.z']) or curZ
        SetVehicleHandlingVector(veh, 'CHandlingData', f, vector3(x + 0.0, y + 0.0, z + 0.0))
    end

    -- 4. Apply Sub-handler floats (CCarHandlingData)
    for _, f in ipairs(SUB_FLOAT_FIELDS) do
        if tuningData[f] ~= nil then
            local val = tonumber(tuningData[f])
            if val then
                SetVehicleHandlingFloat(veh, 'CCarHandlingData', f, val + 0.0)
            end
        end
    end

    -- 5. Guarantee direct steering & lateral traction override
    if tuningData.fSteeringLock then
        local lock = tonumber(tuningData.fSteeringLock)
        if lock then
            SetVehicleHandlingFloat(veh, 'CHandlingData', 'fSteeringLock', lock + 0.0)
        end
    end
    if tuningData.fTractionCurveLateral then
        local lateral = tonumber(tuningData.fTractionCurveLateral)
        if lateral then
            SetVehicleHandlingFloat(veh, 'CHandlingData', 'fTractionCurveLateral', lateral + 0.0)
        end
    end

    -- 6. Dual-Layer Multipliers (Engine Power & Top Speed)
    local driveForce = tonumber(tuningData.fInitialDriveForce) or 0.32
    local powerMultiplier = tuningData._powerMultiplier or math.max(0.1, (driveForce / 0.30))
    SetVehicleEnginePowerMultiplier(veh, powerMultiplier + 0.0)

    local maxFlatVel = tonumber(tuningData.fInitialDriveMaxFlatVel) or 160.0
    local topSpeedMultiplier = tuningData._topSpeedMultiplier or math.max(0.1, (maxFlatVel / 150.0))
    ModifyVehicleTopSpeed(veh, topSpeedMultiplier + 0.0)
end

-- ── Open Tuner UI ────────────────────────────────────────────────────────────

--- Opens the NUI editor panel and sends the vehicle's current handling state.
--- @param veh number
local function OpenTunerUI(veh)
    if not veh or not DoesEntityExist(veh) then return end
    currentVehicle = veh

    -- Initialize vehicle mod kit to populate handling cache for custom cars
    SetVehicleModKit(veh, 0)

    SetNuiFocus(true, true)

    local snapshot = GetHandlingSnapshot(veh)
    local vehLabel, vehModel, vehPlate = GetVehicleIdentity(veh)

    SendNUIMessage({
        action      = 'open',
        vehicleName = vehLabel,
        modelName   = vehModel,
        plate       = vehPlate,
        handling    = snapshot,
        values      = snapshot
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
    if veh == 0 or not DoesEntityExist(veh) then
        Notify('ไม่พบยานพาหนะที่คุณกำลังขับขี่ (Vehicle not found)')
        return
    end

    OpenTunerUI(veh)
end, false)

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

    -- Pre-calculate multipliers to store inside the customTuning state
    local driveForce = tonumber(tuningData.fInitialDriveForce) or 0.32
    local powerMult = math.max(0.1, (driveForce / 0.30))
    local maxFlatVel = tonumber(tuningData.fInitialDriveMaxFlatVel) or 160.0
    local speedMult = math.max(0.1, (maxFlatVel / 150.0))

    tuningData._powerMultiplier = powerMult
    tuningData._topSpeedMultiplier = speedMult

    -- Store tuning inside vehicle State Bag (replicated across network)
    Entity(veh).state:set('customTuning', tuningData, true)

    -- Trigger server event to persist and broadcast
    local netId = VehToNet(veh)
    if netId and netId ~= 0 then
        TriggerServerEvent('car_tuner:saveTuning', netId, tuningData)
    end

    -- Apply physical handling attributes immediately to local vehicle
    ApplyHandlingData(veh, tuningData)

    local vehLabel = GetVehicleIdentity(veh)
    Notify(('บันทึกค่าจูนสำเร็จ! ปรับแต่งสมรรถนะ [%s] เรียบร้อยแล้ว'):format(vehLabel))
    cb('ok')
end)

-- ── State Bag & Network Synchronization ─────────────────────────────────────

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

-- ── Auto Re-Apply on Vehicle Entry (Persistence Across Sessions) ────────────

AddEventHandler('gameEventTriggered', function(name, args)
    if name == 'CEventNetworkPlayerEnteredVehicle' then
        local ped = args[1]
        local veh = args[2]
        if ped == PlayerPedId() and veh and DoesEntityExist(veh) then
            local state = Entity(veh).state
            if state and state.customTuning then
                ApplyHandlingData(veh, state.customTuning)
            end
        end
    end
end)

-- ── Dynamic Multiplier Maintenance Thread ────────────────────────────────────
-- Keeps engine power multiplier and top speed multiplier active during driving
CreateThread(function()
    while true do
        local sleep = 1000
        local ped = PlayerPedId()
        if IsPedInAnyVehicle(ped, false) then
            local veh = GetVehiclePedIsIn(ped, false)
            if veh ~= 0 and DoesEntityExist(veh) and GetPedInVehicleSeat(veh, -1) == ped then
                local state = Entity(veh).state
                if state and state.customTuning then
                    sleep = 500
                    local tuning = state.customTuning
                    local pMult = tuning._powerMultiplier or (tuning.fInitialDriveForce and (tonumber(tuning.fInitialDriveForce) / 0.30)) or 1.0
                    local sMult = tuning._topSpeedMultiplier or (tuning.fInitialDriveMaxFlatVel and (tonumber(tuning.fInitialDriveMaxFlatVel) / 150.0)) or 1.0
                    SetVehicleEnginePowerMultiplier(veh, pMult + 0.0)
                    ModifyVehicleTopSpeed(veh, sMult + 0.0)
                end
            end
        end
        Wait(sleep)
    end
end)

RegisterNUICallback('closeUI', function(_, cb)
    SetNuiFocus(false, false)
    currentVehicle = nil
    cb('ok')
end)
