const rpio = require('rpio')

class Mcp3008 {
    constructor (chipSelect) {
        rpio.spiChipSelect(chipSelect)
        rpio.spiSetClockDivider(256)

        // initialize tx buffers
        this._txBuf = [...Array(8).keys()].map(channel => {
            return new Buffer([4 + (channel >> 2), (channel & 3) << 6, 0])
        })
    }
    read (channel) {
        var txBuf = this._txBuf[channel]
        var rxBuf = new Buffer(txBuf.length)
        rpio.spiTransfer(txBuf, rxBuf, txBuf.length)
        let adcout = ((rxBuf[1] & 15) << 8) + rxBuf[2]
        return adcout
    }
}

module.exports = Mcp3008
