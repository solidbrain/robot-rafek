const logger = require('winston')
const rpio = require('rpio')

const PWM_RANGE = 512
const PWM_CLOCK_DIVIDER = 2

const DIRECTIONS = {
    FORWARD: 1,
    REVERSE: -1,
    LEFT: -1,
    RIGHT: 1,
    STOP: 0
}

rpio.init({
    gpiomem: false,
    mapping: 'physical'
})
rpio.pwmSetClockDivider(PWM_CLOCK_DIVIDER)

class Motor {
    constructor (config) {
        this._maxSpeed = config.maxSpeed
        this._pins = config.pins
        rpio.open(this._pins.in1, rpio.OUTPUT, rpio.LOW)
        rpio.open(this._pins.in2, rpio.OUTPUT, rpio.LOW)
        rpio.open(this._pins.en, rpio.PWM)

        this._pwm = config.pwm

        this._speedModifier = 1.0
    }
    _directionFromSpeed (speed) {
        return speed > 0 ? DIRECTIONS.FORWARD : DIRECTIONS.REVERSE
    }
    _setMotorDirection (direction) {
        let v1 = direction === DIRECTIONS.FORWARD ? rpio.HIGH : rpio.LOW
        let v2 = direction === DIRECTIONS.FORWARD ? rpio.LOW : rpio.HIGH
        rpio.write(this._pins.in1, v1)
        rpio.write(this._pins.in2, v2)
    }
    _setSpeedPwm (speed) {
        let range = PWM_RANGE - this._pwm.base
        let pwm = 0
        if (speed !== 0) {
            pwm = (speed / 100 * (range - this._pwm.base)) + this._pwm.offset + this._pwm.base
        }
        rpio.pwmSetData(this._pins.en, pwm)
    }
    setSpeed (speed) {
        logger.debug('setting speed ' + speed)
        if (speed !== this._currentSpeed) {
            let direction = this._directionFromSpeed(speed)
            if (speed !== 0) this._setMotorDirection(direction)
            speed = Math.min(Math.abs(speed), this._maxSpeed)
            this._currentSpeed = speed
            this._setSpeedPwm(speed)
        }
    }
    getSpeed () {
        return this._currentSpeed
    }
    brake () {
        this.setSpeed(-Math.sign(this._currentSpeed))
        setTimeout(() => {
            this.setSpeed(0)
        }, 100)
    }
}

module.exports.Motor = Motor
module.exports.DIRECTIONS = DIRECTIONS
