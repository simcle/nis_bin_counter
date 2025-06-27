const db = require('../db/database.js')
const excel = require('exceljs')
const { readBins } = require('../models/binModel.js')

function getBins (req, res) {
    const sessionId = req.params.sessionId

    const page = req.query.page || 1
    const data = readBins(sessionId, page)
    res.status(200).json(data)
}

async function downloadBin(req, res) {
    const sessionId = req.params.sessionId
    const lineSession = db.prepare(`SELECT * FROM line_sessions WHERE id = ?`).get(sessionId)
    const line = lineSession.line
    const sku = lineSession.sku_id
    const printText = lineSession.print_text
    const matDesc = lineSession.mat_desc
    const maxPerBin = lineSession.max_per_bin
    const startedAt = lineSession.started_at

    const bins = db.prepare(`SELECT * FROM bin_logs WHERE session_id = ? ORDER BY id ASC`).all(sessionId)

    const workbook = new excel.Workbook()
    const worksheet = workbook.addWorksheet('bin logs')

    worksheet.columns = [
        {key: 'bin', width: 10},
        {key: 'contan', width: 10},
        {key: 'start_counter', width: 10},
        {key: 'end_counter', width: 10},
        {key: 'started_at', width: 20}
    ]

    worksheet.getRow(1).values = ['LINE', 'SKU', 'PRINT TEXT', 'MAT DESC', 'MAX PER BIN', 'STARTED AT']
    worksheet.getRow(2).values = [line, sku, printText, matDesc, maxPerBin, startedAt]
    worksheet.getRow(4).values = ['bin', 'contain', 'start counter', 'end counter', 'started at']
    worksheet.addRows(bins)

    res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "products.xlsx"
        );
    await workbook.xlsx.write(res);
    res.status(200).end();
}

module.exports = {
    getBins,
    downloadBin
}