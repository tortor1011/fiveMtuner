fx_version 'cerulean'
game 'gta5'

author 'car_tuner'
description 'Comprehensive vehicle handling editor with draft-and-commit tuning and state bag sync'
version '2.1.0'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js'
}

client_scripts {
    'client/client.lua'
}

server_scripts {
    'server/server.lua'
}
