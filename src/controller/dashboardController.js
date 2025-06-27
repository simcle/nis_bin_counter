const { manager } = require('../plc/plcClient.js')
function getLines (req, res) {
    const data = manager.getLineBins()
    res.status(200).json(data)
}


module.exports = {
    getLines
}