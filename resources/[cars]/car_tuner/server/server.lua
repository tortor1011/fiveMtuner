--[[
    car_tuner/server/server.lua
    Server-side state persistence and network synchronization for custom handling tuning.
]]

RegisterNetEvent('car_tuner:saveTuning', function(netId, tuningData)
    local src = source
    if not netId or not tuningData then return end

    local entity = NetworkGetEntityFromNetworkId(netId)
    if entity and DoesEntityExist(entity) then
        -- Set replicated state bag on the server
        Entity(entity).state:set('customTuning', tuningData, true)

        -- Broadcast to all clients to ensure handling physics are applied across network
        TriggerClientEvent('car_tuner:clientApplyTuning', -1, netId, tuningData)
    end
end)
