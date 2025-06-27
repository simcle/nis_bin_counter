const db = require('../db/database.js');

function readLines(page = 1, limit = 20, sku_id = null, line = null, startDate = null, endDate = null) {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM line_sessions`;
    let countQuery = `SELECT COUNT(*) as count FROM line_sessions`;

    const whereClause = [];
    const params = [];
    const countParams = [];

    if (sku_id) {
        whereClause.push(`sku_id LIKE ?`);
        const keyword = `%${sku_id}%`;
        params.push(keyword);
        countParams.push(keyword);
    }

    if (line) {
        whereClause.push(`line = ?`);
        params.push(line);
        countParams.push(line);
    }

    if (startDate && endDate) {
        whereClause.push(`started_at BETWEEN ? AND ?`);
        params.push(startDate, endDate);
        countParams.push(startDate, endDate);
    }

    if (whereClause.length > 0) {
        const whereSQL = ' WHERE ' + whereClause.join(' AND ');
        query += whereSQL;
        countQuery += whereSQL;
    }

    query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const count = db.prepare(countQuery).get(...countParams).count;
    const rows = db.prepare(query).all(...params);
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
    readLines
};