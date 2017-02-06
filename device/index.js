const fs = require('fs')
const path = require('path')
const restify = require('restify')
const logger = require('winston')
logger.level = 'debug'

const Driver = require('./driver.js').Driver

var driverConfiguration = require('./driver-config.json')
var driver = new Driver(driverConfiguration)

var Client = require('azure-iot-device').Client
var ConnectionString = require('azure-iot-device').ConnectionString
var Protocol = require('azure-iot-device-mqtt').Mqtt

var config = require('../config.json')
var connectionString = ConnectionString.parse(config.device_connection_string)
var deviceId = connectionString.DeviceId

var client = Client.fromConnectionString(config.device_connection_string, Protocol)
if (connectionString.x509) {
    var x509Path = path.join(__dirname, 'device-x509')

    var options = {
        cert: fs.readFileSync(path.join(x509Path, deviceId + '-cert.pem')).toString(),
        key: fs.readFileSync(path.join(x509Path, deviceId + '-key.pem')).toString()
    }

    client.setOptions(options)

    console.log('[Device (' + deviceId + ')] Using X.509 client certificate authentication.')
}

function onCommand (request, response) {
    let data = request.payload
    logger.debug(data)
    switch (data.command) {
        case 'go':
        driver.emit('move', data.state)
        break
        case 'turn':
        driver.emit('turn', data.state)
        break
        case 'rotate':
        driver.emit('rotate', data.state)
        break
        case 'turbo':
        driver.emit('turbo', data.state)
        break
    }

    response.send(200, 'ok', error => logger.error(error))
}

function onRestCommand (req, res, next) {
    let request = {
        payload: {
            command: req.params.command,
            state: parseFloat(req.params.state)
        }
    }

    let response = {
        send: (code, msg, callback) => {
            res.send(msg)
            next()
        }
    }

    onCommand(request, response)
}

function connectCallback (err) {
    if (err) {
        console.log('[Device (' + deviceId + ')] Could not connect: ' + err)
    } else {
        console.log('[Device (' + deviceId + ')] Client connected.')
        // client.on('message', receiveMessageCallback)
        client.onDeviceMethod('command', onCommand)
    }
}

client.open(connectCallback)

let server = restify.createServer()
server.use(restify.queryParser())

server.use(
    function crossOrigin (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'X-Requested-With')
        return next()
    }
)

server.get('/:command/:state', onRestCommand)
server.get('/status', (req, res, next) => {
    res.send('functional')
    next()
})

server.listen(8080, () => {
    logger.info(`${server.name} listening at ${server.url}`)
})
