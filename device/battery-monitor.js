const logger = require('winston')
const rpio = require('rpio')
const Mcp3008 = require('./mcp3008.js')
logger.level = 'debug'

rpio.spiBegin()

let adc = new Mcp3008(0)

class BatteryMonitor {
    constructor () {
        this._maxVoltage = 8.4
        this._minVoltage = 7.4

        this._ma = new Array(0).fill(0)
        this._level = 100
    }
    update () {
        let voltage = adc.read(0) / 4095 * 10.2
        this._ma.push(voltage)
    }
    getVoltage () {
        let sum = this._ma.reduce((a, b) => a + b)
        let avg = sum / this._ma.length
        return avg
    }
    getLevel () {
        let voltage = this.getVoltage()
        let level = (voltage - this._minVoltage) / (this._maxVoltage - this._minVoltage) * 100
        if (level < this._level) {
            this._level = level
        }
        this._level = Math.max(Math.min(this._level, 100), 0)
        return Math.round(this._level)
    }
}

module.exports = BatteryMonitor

if (require.main === module) {
    rpio.init({
        gpiomem: false,
        mapping: 'physical'
    })
    rpio.spiBegin()

    let batMon = new BatteryMonitor()
    for (let i = 0; i < 50; i++) {
        batMon.update()
        rpio.msleep(100)
    }
    console.log(`${batMon.getVoltage().toFixed(2)}V, ${batMon.getLevel()}%`)
}
