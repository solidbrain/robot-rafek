(() => {
    'use strict'

    global.console = console
    global.doc = document
    global.win = window

    const fs = require('fs')

    let App = require('./app').App

    $(() => {
        $('body')
            .height(window.innerHeight)
            .width(window.innerWidth)

        const config = JSON.parse(fs.readFileSync('../config.json'))
        const win = nw.Window.get()

        let app = new App(config)

        app.init()

        app.on('iot-hub-connected', () => {
            $('.hub-connection').addClass('connected')
        })
        .on('gamepad-connected', () => {
            $('.gamepad-connection').addClass('connected')
        })
        .on('gamepad-disconnected', () => {
            $('.gamepad-connection').removeClass('connected')
        })
        .on('lan-connected', () => {
            $('.lan-connection').addClass('connected')
        })

        win.on('close', () => {
            win.hide()
            win.close(true)
        })

        win.show()
    })
})()
