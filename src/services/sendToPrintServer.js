const net = require('net')
const eventBus = require('../even/event.js')
const { manager } = require('../plc/plcClient.js')

const PRINT_HOST = '10.203.179.133'
const PRINT_PORT = '2345'

let printInterval = null
let dataToPrint = null

function connectToPrintServer () {
    const client = new net.Socket()
    eventBus.emit('print', {message: 'Connecting to print...'})
    client.connect(PRINT_PORT, PRINT_HOST, async () => {
        if(printInterval) clearInterval(printInterval)
            printInterval = setInterval( async() => {
            eventBus.emit('print', {message: 'Connected'})
            const orderedLines = ['Line01', 'Line02', 'Line03', 'Line04'];
            dataToPrint = manager.getLastBinIdsString(orderedLines)
            console.log(dataToPrint)
            if(dataToPrint) {
                client.write(dataToPrint)
            }
        }, 5000)
    })

    client.on('close', async () => {
        eventBus.emit('print', {message: 'Reconnecting...'})
        if(printInterval) clearInterval(printInterval)
        setTimeout(connectToPrintServer, 5000)
    })

    client.on('error', async () => {
        eventBus.emit('print', {message: 'Disconected'})
        if(printInterval) clearInterval(printInterval)
        client.destroy()
    })
}

module.exports = {
    connectToPrintServer
}
