const EventEmitter = require('events')

const states = {}

const mappingFn = g => [
    ['go', -g.axes[1].toFixed(1)],
    ['turn', +g.axes[0].toFixed(1)],
    ['rotate', (g.buttons[5].pressed & 1) - (g.buttons[4].pressed & 1)],
    ['turbo', g.buttons[0].pressed & 1]
]

class GamepadHandler extends EventEmitter {
    constructor () {
        super()
        this._connected = false
    }
    init () {
        win.addEventListener('gamepadconnected', this._onGamepadConnected.bind(this))
        win.addEventListener('gamepaddisconnected', this._onGamepadDisconnected.bind(this))
    }
    get connected () {
        return this._connected
    }
    set connected (value) {
        this._connected = value
        this.emit(value ? 'connected' : 'disconnected')
    }
    _checkConnectionState (gamepad) {
        if (!!gamepad && !this.connected) {
            this.connected = true
        }

        if (!gamepad && this.connected) {
            this.connected = false
        }
    }
    _onGamepadConnected (e) {
        this.connected = true

        win.requestAnimationFrame(this._gamepadLoop.bind(this))
    }
    _onGamepadDisconnected (e) {
        this.connected = false
    }
    _gamepadLoop () {
        this.gamepad = navigator.getGamepads()[0]

        this._checkConnectionState(this.gamepad)

        if (this.gamepad) {
            let mapping = mappingFn(this.gamepad)

            for (let [command, state] of mapping) {
                if (states[command] === undefined || states[command] !== state) {
                    states[command] = state

                    this.emit('command', { command, state })
                }
            }
        }

        win.requestAnimationFrame(this._gamepadLoop.bind(this))
    }
}

exports.GamepadHandler = GamepadHandler
