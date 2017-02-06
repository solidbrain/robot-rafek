const logger = require('winston')
const BatteryMonitor = require('./battery-monitor.js')
const Motor = require('./motor.js').Motor
const EventEmitter = require('events')
const MotorSpeedCalculator = require('./motor-speed-calculator.js')
const ObstacleDetector = require('./obstacle-detector.js')

// for future uses
function directionToCoeff (direction) {
    return direction
}

class Driver extends EventEmitter {
    constructor (configuration) {
        super()
        logger.debug('driver init')
        this._batteryMonitor = new BatteryMonitor()
        this._obstacleDetector = new ObstacleDetector(40)
        this._obstacleDetector.on('obstacle', () => {
            logger.debug('obstacle ahead')
            if (this._speedLevel > 0) {
              this._move(0)
            }
        })
        configuration.leftMotor.maxSpeed = configuration.speeds.maxSpeed
        configuration.rightMotor.maxSpeed = configuration.speeds.maxSpeed
        this._leftMotor = new Motor(configuration.leftMotor)
        this._rightMotor = new Motor(configuration.rightMotor)

        this._motors = [this._leftMotor, this._rightMotor]

        let motorSpeedCalcArgs = [
            configuration.speeds.speed1,
            configuration.speeds.speed2,
            configuration.speeds.maxSpeed,
            configuration.speeds.rotateSpeed,
            configuration.speeds.turnCoefficient
        ]
        this._speedLevel = 0
        this._leftMotorSpeedCalc = new MotorSpeedCalculator(...motorSpeedCalcArgs)
        this._leftMotorSpeedCalc.on('change', speed => this._leftMotor.setSpeed(speed))
        this._rightMotorSpeedCalc = new MotorSpeedCalculator(...motorSpeedCalcArgs)
        this._rightMotorSpeedCalc.on('change', speed => this._rightMotor.setSpeed(speed))

        this.on('move', this._move)
        this.on('turbo', this._turbo)
        this.on('turn', this._turn)
        this.on('rotate', this._rotate)
    }
    _move (speedLevel) {
        if (this._obstacleDetector.detected && speedLevel > 0) {
            return
        } else if (this._obstacleDetector.detected && speedLevel !== 0) {
            this._obstacleDetector.ack()
        }
        this._speedLevel = speedLevel
        this._leftMotorSpeedCalc.move(speedLevel).update()
        this._rightMotorSpeedCalc.move(speedLevel).update()
    }
    _turbo (enable) {
        this._leftMotorSpeedCalc.turbo(enable).update()
        this._rightMotorSpeedCalc.turbo(enable).update()
    }
    _turn (direction) {
        if (Math.abs(direction) <= 0.3) {
            direction = 0
        }
        let _direction = Math.sign(direction) * Math.max(Math.abs(direction * 2), 1) // directionToCoeff(direction)
        this._leftMotorSpeedCalc.turn(_direction).update()
        this._rightMotorSpeedCalc.turn(-_direction).update()
    }
    _rotate (direction) {
        let _direction = directionToCoeff(direction)
        this._leftMotorSpeedCalc.rotate(-_direction).update()
        this._rightMotorSpeedCalc.rotate(_direction).update()
    }
}

module.exports.Driver = Driver
