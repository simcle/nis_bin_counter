const dayjs = require('dayjs')
const db = require('../db/database.js')
const excel = require('exceljs')
const { readLines } = require('../models/lineModel.js')

function getLines (req, res) {
    const page = req.query.page || 1
    const search = req.query.search || null
    const line = req.query.line || null
    const start = req.query.startDate || null
    const end = req.query.endDate || null
    let startDate = null
    let endDate = null
    if(start && end) {
        startDate = dayjs(start).startOf('day').format('YYYY-MM-DD HH:mm:ss')
        endDate = dayjs(end).endOf('day').format('YYYY-MM-DD HH:mm:ss')
    }
    const data = readLines(page, 20, search, line, startDate, endDate)
    res.status(200).json(data)
}

async function downloadLine (req, res) {
    const search = req.query.search || null
    const line = req.query.line || null
    const start = req.query.startDate || null
    const end = req.query.endDate || null
    let startDate = null
    let endDate = null
    if(start && end) {
        startDate = dayjs(start).startOf('day').format('YYYY-MM-DD HH:mm:ss')
        endDate = dayjs(end).endOf('day').format('YYYY-MM-DD HH:mm:ss')
    }

    let query = `SELECT * FROM line_sessions`

    const whereClause = []
    const params = []

    if(search) {
        whereClause.push(`sku_id LIKE ?`)
        const keyword = `%${search}%`;
        params.push(keyword);
    }
    if (line) {
        whereClause.push(`line = ?`);
        params.push(line);
    }

    if (startDate && endDate) {
        whereClause.push(`started_at BETWEEN ? AND ?`);
        params.push(startDate, endDate);
    }

    if (whereClause.length > 0) {
        const whereSQL = ' WHERE ' + whereClause.join(' AND ');
        query += whereSQL;
    }
    query+= ` ORDER BY id ASC`
    
    const rows = db.prepare(query).all(...params)
    

    const workbook = new excel.Workbook()
    const worksheet = workbook.addWorksheet('Lines')
    worksheet.columns = [
        {key: 'line', width: 10},
        {key: 'sku_id', width: 10},
        {key: 'print_text', width: 20},
        {key: 'mat_desc', width: 35},
        {key: 'max_per_bin', width: 12},
        {key: 'total_bin', width: 12},
        {key: 'total_counter', width: 12},
        {key: 'started_at', width: 20}
    ]
    worksheet.getRow(1).values = ['line', 'sku', 'start date', 'end date']
    worksheet.getRow(2).values = [line, search, startDate, endDate]
    worksheet.getRow(4).values = ['LINE', 'SKU', 'PRINT TEXT', 'MATERIAL DESC', 'MAX PER BIN', 'TOTAL BIN', 'TOTAL COUNTER', 'STARTED AT']
    worksheet.addRows(rows)
    res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "products.xlsx"
        );
    await workbook.xlsx.write(res);
    res.status(200).end();
}

module.exports = {
    getLines,
    downloadLine
}