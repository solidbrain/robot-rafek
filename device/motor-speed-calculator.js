const logger = require('winston')
const EventEmitter = require('events')

function limitSpeed (speed, MAX_SPEED) {
    return Math.max(Math.min(speed, MAX_SPEED), -MAX_SPEED)
}

class MotorSpeedCalcState {
    constructor () {
        this.reset()
    }
    getSpeed () {
        logger.debug(this)
        return this.speed * this.speedModifier
    }
    reset () {
        this.speed = 0
        this.speedModifier = 1
    }
}

class MotorSpeedCalculator extends EventEmitter {
    constructor (baseSpeed, turboSpeed, maxSpeed, rotateSpeed, turnRadius) {
        super()
        this._baseSpeed = baseSpeed
        this._turboSpeed = turboSpeed
        this._maxSpeed = maxSpeed
        this._rotateSpeed = rotateSpeed
        this._turnRadius = turnRadius

        this._state = new MotorSpeedCalcState()
    }
    _recalc () {
        let speed = limitSpeed(this._state.getSpeed(), this._maxSpeed)
        this.emit('change', speed)
    }
    update () {
        this._recalc()
    }
    move (speedLevel) {
        this._state.speed = this._baseSpeed * speedLevel
        return this
    }
    rotate (speedLevel) {
        this._state.speed = this._rotateSpeed * speedLevel
        return this
    }
    amplify (value) {
        this._state.speed *= value
        return this
    }
    turbo (enable) {
        if (this._state.speed > 0) {
            this._state.speed = enable ? this._turboSpeed : this._baseSpeed
        }
        return this
    }
    turn (direction) {
        let currentSpeed = Math.max(Math.abs(this._state.speed), this._baseSpeed)
        let radius = this._turnRadius * Math.pow(this._baseSpeed / currentSpeed, 1)
        // if (Math.abs(direction) > 0.2) radius *= Math.abs(direction)
        if (direction > 0) {
            this._state.speedModifier = radius
        } else if (direction < 0) {
            this._state.speedModifier = 1 / radius
        } else {
            this._state.speedModifier = 1
        }
        return this
    }
}

module.exports = MotorSpeedCalculator
