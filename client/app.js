const EventEmitter = require('events')
const KeyboardHandler = require('./keyboardHandler').KeyboardHandler
const GamepadHandler = require('./gamepadHandler').GamepadHandler
const Client = require('azure-iothub').Client
const Message = require('azure-iot-common').Message
const request = require('request')

class App extends EventEmitter {
    constructor (config) {
        super()
        this.config = config
        this.keyboardHandler = new KeyboardHandler()
        this.gamepadHandler = new GamepadHandler()
    }
    init () {
        this.client = Client.fromConnectionString(this.config.iot_hub_connection_string)

        this.deviceId =
        this.config.device_connection_string
            .split(';')
            .map(s => s.split('='))
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {})
            .DeviceId

        this.keyboardHandler.init()
        this.gamepadHandler.init()

        request.get('http://' + this.config.device_lan_address + ':8080/status', (err, res, body) => {
            let onCommand = this._onCommand
            if (!err && res.statusCode === 200) {
                process.nextTick(() => {
                    this.emit('lan-connected')
                })

                onCommand = this._onCommandLAN
            }
            this.keyboardHandler.on('command', onCommand.bind(this))

            this.gamepadHandler
                .on('command', onCommand.bind(this))
                .on('connected', () => this.emit('gamepad-connected'))
                .on('disconnected', () => this.emit('gamepad-disconnected'))
        })
    }
    _onCommandLAN (command) {
        let path = '/' + command.command + '/' + command.state
        request
            .get('http://' + this.config.device_lan_address + ':8080' + path)
            .on('error', function (err) {
                console.log(err)
            })
    }
    _onCommand (command) {
        const params = {
            methodName: 'command',
            payload: command,
            timeoutInSeconds: 30
        }

        this.client.invokeDeviceMethod(
            this.deviceId,
            params,
            (error, result) => {
                if (error) {
                    console.error(`[IoT Hub] Something went wrong with Device Method call: ${error}`)
                }
            }
        )
    }
}

exports.App = App
