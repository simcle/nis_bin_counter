const db = require('../db/database.js')

function saveToDatabase(line, skuId, currentBin, lastCounter, data, started_at, bins) {
    const sku_id = data.sku_id
    const print_text = data.print_text
    const mat_desc = data.mat_desc
    const max_per_bin = data.max_per_bin
    const total_bin = currentBin
    const total_counter = lastCounter

    const insertSession = db.prepare(`
            INSERT INTO line_sessions (line, sku_id, print_text, mat_desc, max_per_bin, total_bin, total_counter, started_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)

    const result = insertSession.run(line, sku_id, print_text, mat_desc, max_per_bin, total_bin, total_counter, started_at)
    const sessionId = result.lastInsertRowid

    const insertBin = db.prepare(`
            INSERT INTO bin_logs (session_id, bin, contain, start_counter, end_counter, started_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `)
    const insertMany = db.transaction((bins) => {
        for (const bin of bins) {
            insertBin.run(
                sessionId,
                bin.bin,
                bin.contain,
                bin.start_counter,
                bin.end_counter,
                bin.started_at
            )
        }
    })

    insertMany(bins)
}

module.exports = { saveToDatabase };