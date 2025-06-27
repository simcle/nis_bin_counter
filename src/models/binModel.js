const db = require('../db/database.js')

function readBins (sessionId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const rows = db.prepare(`SELECT * FROM bin_logs WHERE session_id = ? ORDER BY id ASC LIMIT ? OFFSET ?`).all(sessionId, limit, offset)
    const count = db.prepare(`SELECT COUNT(*) as count FROM bin_logs WHERE session_id = ?`).get(sessionId).count
    
    const lastPage = Math.ceil(count / limit);

    return {
        data: rows,
        pages: {
            current_page: page,
            last_page: lastPage,
            totalItems: count
        }
    };
}

module.exports = {
    readBins
}