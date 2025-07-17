const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const path = require('path')
require('./src/db/migrate.js')
const { getDataAutoCoding } = require('./src/services/autoCoding.js')
const { connectToPLC } = require('./src/plc/plcClient.js') 
const { connectToPrintServer } = require('./src/services/sendToPrintServer.js')
const eventBus = require('./src/even/event.js')

const app = express()
const PORT = 8739

app.use(cors())
app.use(express.json())
const publicPath = path.join(__dirname, 'public')
app.use(express.static(publicPath))

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*'
    }
})

eventBus.on('plc', (data) => {
    console.log(data)
    io.emit('plc', data)
})
eventBus.on('print', (data) => {
    console.log('print', data)
    io.emit('print', data)
})

const { manager } = require('./src/plc/plcClient.js')

manager.on('invalid-sku', data => {
    io.emit('invalid-sku', data)
})

manager.on('new-line-start', data => {
    io.emit('new-line-start', data)
});

manager.on('line-update', data => {
    io.emit('line-update', data)
});
manager.on('bin-added', data => {
    io.emit('bin-added', data)
    // console.log(`Add new Bin ${data.line} → ${data.sku} → ${data.bin.bin}`);
});

manager.on('pro-change', data => {
    io.emit('pro-change', data)
})

manager.on('sku-change', data => {
    io.emit('sku-change', data)
    // console.log(`[${data.line}] SKU berubah dari ${data.oldSku} ke ${data.newSku}`);
});

manager.on('waiting-for-counter-reset', data => {
    io.emit('waiting-for-counter-reset', data)
    // console.log(`[${data.line}] Menunggu counter 1 untuk SKU ${data.sku}`);
});

manager.on('flushed', data => {
    io.emit('flushed', data)
    // console.log(`[${data.line}] Bins disimpan`);
});



const dashboardRouter = require('./src/router/dashboardRouter.js')
const lineRouter = require('./src/router/lineRouter.js')
const binRouter = require('./src/router/binRouter.js')
const skuRouter = require('./src/router/skuRouter.js')


app.use('/api/dashboard', dashboardRouter)
app.use('/api/lines', lineRouter)
app.use('/api/bins', binRouter)
app.use('/api/sku', skuRouter)


const startServer = async () => {
    try {
        await getDataAutoCoding()
        server.listen(PORT, () => {
            console.log('Server started on htt://localhost:'+PORT)
            connectToPLC()
            connectToPrintServer()
        })
    } catch (error) {
        
    }
}

startServer()



