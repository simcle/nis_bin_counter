const db = require('./database.js')

db.exec(`
        CREATE TABLE IF NOT EXISTS sku_master(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku_id INTEGER NOT NULL UNIQUE,
            print_text TEXT NOT NULL,
            material_desc TEXT,
            max_per_bin INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    `)

db.exec(`
        CREATE TABLE IF NOT EXISTS line_sessions(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            line TEXT,
            sku_id TEXT,
            pro_id TEXT,
            print_text TEXT,
            mat_desc TEXT,
            max_per_bin INTEGER,
            total_bin INTEGER,
            total_counter INTEGER,
            started_at TEXT
        )
    `)
db.exec(`
        CREATE TABLE IF NOT EXISTS bin_logs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            bin INTEGER,
            contain INTEGER,
            start_counter INTEGER,
            end_counter INTEGER,
            started_at TEXT,
            FOREIGN KEY(session_id) REFERENCES line_sessions(id)
        )
    `)
// Index untuk line_sessions
db.exec(`CREATE INDEX IF NOT EXISTS idx_line_sessions_line ON line_sessions(line)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_line_sessions_sku_id ON line_sessions(sku_id)`);


// Index untuk bin_logs
db.exec(`CREATE INDEX IF NOT EXISTS idx_bin_logs_session_id ON bin_logs(session_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_bin_logs_bin ON bin_logs(bin)`);