const _ = require('lodash')
const rpio = require('rpio')
const logger = require('winston')
const IPC = require('ipc-event-emitter').default

var ipc = IPC(process)

const ECHO_PIN = 29
const TRIG_PIN = 31

rpio.open(ECHO_PIN, rpio.INPUT, rpio.PULL_DOWN)
rpio.open(TRIG_PIN, rpio.OUTPUT)

rpio.write(TRIG_PIN, rpio.LOW)
rpio.msleep(100)

function getAvg (d) {
    let sum = _.reduce(d, (a, b) => a + b)
    let avg = sum / d.length
    let distances = d.map(value => Math.abs(value - avg))
    let maxDistance = _.max(distances)
    let newD = _.filter(d, value => value !== maxDistance)
    return _.reduce(newD, (a, b) => a + b) / newD.length
}

ipc.pin('ready')
var doEmit = false
ipc.on('read', () => {
    doEmit = true
})

var d = []
var main = function () {
    setTimeout(function (doEmit) {
        if (doEmit) {
            let counter = 0
            let lowCounter = 0
            rpio.write(TRIG_PIN, rpio.HIGH)
            rpio.usleep(12)
            rpio.write(TRIG_PIN, rpio.LOW)
            while (lowCounter < 20) {
                if (rpio.read(ECHO_PIN)) {
                    ++counter
                } else {
                    if (counter) {
                        break
                    } else {
                        ++lowCounter
                    }
                }
                rpio.usleep(1)
            }

            let distance = (counter * 34) / 10 / 2
            if (d.length > 2) {
                d.shift()
            }
            d.push(distance)
            ipc.emit('sonar_0', {distance: getAvg(d)})
        }
        main()
    }.bind(this, doEmit), 1)
}
main()
