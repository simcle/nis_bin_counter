const db = require('../db/database.js')
const dayjs = require('dayjs')

function readSKU () {
        
}

function insertSKU(payload) {
    const { sku_id, print_text, material_desc, max_per_bin} = payload
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const stmt = db.prepare(`
            INSERT INTO sku_master (sku_id, print_text, material_desc, max_per_bin, created_at, updated_at)
            VALUES(?, ?, ?, ?, ?, ?)
        `)
    try {
        stmt.run(sku_id, print_text, material_desc, max_per_bin, now, now)
        return {success: true, message: 'Insert Successfully'}
    } catch (err) {
        if(err.code === 'SQLITE_CONSTRAINT') {
            return { success: false, message: `Duplicate SKU_ID ${sku_id} already exists.` };
        }
        return { success: false, message: err.message };
    }
}

function updateSKU(payload) {
    const updated_at = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const { id, sku_id, print_text, material_desc, max_per_bin } = payload
    const stmt = db.prepare(`
            UPDATE sku_master SET 
                sku_id = ?,
                print_text = ?,
                material_desc = ?,
                max_per_bin = ?,
                updated_at = ?
            WHERE id = ?
        `)
    try {
        stmt.run(sku_id, print_text, material_desc, max_per_bin, updated_at, id)
        return { success: true, message: 'Update Succesfully'}
    } catch (err) {
        return { success: false, message: err.message}   
    }
}

function deleteSKU(payload) {
    const id = payload
    const stmt = db.prepare(`
            DELETE FROM sku_master WHERE id = ?
        `)
    try {
        const result = stmt.run(id)
        if(result.changes === 0) {
            return { success: false, message: 'SKU not found'}
        } else {
            return { success: true, message: 'Delete Successfully'}
        }
        
    } catch (err) {
        return { success: false, message: err.message}
    }
}

module.exports = {
    insertSKU,
    updateSKU,
    deleteSKU
}