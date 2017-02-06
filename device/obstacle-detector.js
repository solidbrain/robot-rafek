const EventEmitter = require('events')
const fork = require('child_process').fork
const IPC = require('ipc-event-emitter').default

var child = fork('./sonar2.js')
var ipc = IPC(child)

class ObstacleDetector extends EventEmitter {
    constructor (minDistance) {
        super()
        this.detected = false

        ipc.on('sonar_0', data => {
            if (data.distance <= minDistance) {
                if (!this.detected) {
                    this.detected = true
                    this.emit('obstacle')
                }
            }
            ipc.emit('read')
        })
        ipc.emit('read')
    }
    ack () {
        this.detected = false
    }
}

module.exports = ObstacleDetector
