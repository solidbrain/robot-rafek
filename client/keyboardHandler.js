const EventEmitter = require('events')

const commandMapping = {
    'w': 'go',
    's': 'go',
    'a': 'turn',
    'd': 'turn',
    'q': 'rotate',
    'e': 'rotate',
    'shift': 'turbo',
}

const keys = {}

const mappingFn = () => [
    ['go', (keys['w'] & 1) - (keys['s'] & 1)],
    ['turn', (keys['d'] & 1) - (keys['a'] & 1)],
    ['rotate', (keys['e'] & 1) - (keys['q'] & 1)],
    ['turbo', keys['shift'] & 1]
]

class KeyboardHandler extends EventEmitter {
    constructor () {
        super()
    }
    init () {
        doc.addEventListener('keydown', this._onKeyStateChange.bind(this))
        doc.addEventListener('keyup', this._onKeyStateChange.bind(this))
    }
    _getKeyState(e) {
        return e.type !== 'keydown' && e.type !== 'keyup'
            ? undefined
            : e.type === 'keydown'
    }
    _onKeyStateChange (e) {
        let key = e.key.toLowerCase()
        let keyState = this._getKeyState(e)

        if (keyState === undefined) {
            return
        }

        if (keys[key] === undefined || keys[key] !== keyState) {
            keys[key] = keyState

            let mapping = mappingFn()

            for (let [command, state] of mapping) {
                if (command === commandMapping[key]) {
                    this.emit('command', { command, state })
                }
            }
        } else {
            e.preventDefault()
        }
    }
}

exports.KeyboardHandler = KeyboardHandler
