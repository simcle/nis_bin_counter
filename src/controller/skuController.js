const { insertSKU, updateSKU, deleteSKU } = require('../models/skuModel.js')
const { getSkuCache } = require('../services/autoCoding.js')
const excel = require('exceljs')

function getAllSku (req, res) {
    const data = getSkuCache()
    res.status(200).json(data)
}
async function downloadSku (req, res) {
    const data = getSkuCache()
    const workbook = new excel.Workbook()
    const worksheet = workbook.addWorksheet('sku master')
    worksheet.columns = [
        {key: 'sku_id', width: 10},
        {key: 'print_text', width: 20},
        {key: 'mat_desc', width: 35},
        {key: 'max_per_bin', width: 15}
    ]
    worksheet.getRow(1).values = ['SKU', 'PRINT TEXT', 'MAT DESC', 'MAX PER BIN']
    worksheet.addRows(data)

    res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "products.xlsx"
        );
    await workbook.xlsx.write(res);
    res.status(200).end();

}
function createSKU (req, res) {
    const payload = req.body
    const result = insertSKU(payload)
    if(!result.success) {
        res.status(400).json(result.message)
    } else {
        res.status(200).json(result.message)
    }
}

function editSKU (req, res) {
    const payload = req.body
    const result = updateSKU(payload)
    if(!result.success) {
        res.status(400).json(result.message)
    } else {
        res.status(200).json(result.message)
    }
}

function deletedSKU(req, res)  {
    const payload = req.params.id 
    const result = deleteSKU(payload)
    if(!result.success) {
        res.status(400).json(result.message)
    } else {
        res.status(200).json(result.message)
    }
}

module.exports = {
    getAllSku,
    downloadSku,
    createSKU,
    editSKU,
    deletedSKU
}