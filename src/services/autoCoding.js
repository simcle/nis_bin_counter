const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = '\\\\Didniscrc46039k\\d\\DikonekAutoCodingNutricia.db';
const skuCache = new Map();

let db = null;
let retryTimeout = null;

// Fungsi untuk mencoba koneksi database
function tryConnectDatabase() {
    if (!fs.existsSync(dbPath)) {
        console.warn('⚠️ File database tidak ditemukan:', dbPath);
        scheduleReconnect();
        return;
    }

    try {
        db = new Database(dbPath, { readonly: true });
        console.log('✅ Koneksi ke database berhasil');
        getDataAutoCoding();
    } catch (err) {
        console.error('❌ Gagal membuka database:', err.message);
        scheduleReconnect();
    }
}

// Fungsi untuk menjadwalkan ulang koneksi jika gagal
function scheduleReconnect() {
    if (retryTimeout) return; // Jangan jadwalkan ulang jika sudah ada

    retryTimeout = setTimeout(() => {
        console.log('🔁 Mencoba ulang koneksi database...');
        retryTimeout = null;
        tryConnectDatabase();
    }, 10_000); // coba ulang setiap 10 detik
}

// Fungsi untuk ambil data dan simpan ke cache memory
async function getDataAutoCoding() {
    if (!db) {
        console.warn('⚠️ Tidak bisa mengambil data: database belum siap');
        return;
    }

    try {
        const rows = db.prepare(`SELECT * FROM SKUMatrix ORDER BY Id ASC`).all();
        skuCache.clear();

        for (const row of rows) {
            skuCache.set(row.Code, {
                sku_id: row.Code,
                print_text: row.PrintText,
                mat_desc: row.MatDescription,
                max_per_bin: row.SachetPerHead
            });
        }


        // dummy test
        // const data = [
        //     {
        //         sku_id: '202722',
        //         print_text: 'BEBELOVE 1',
        //         mat_desc: 'BEBELOVE 1 GREAT+ 12X620G FB OBPPC',
        //         max_per_bin: 3
        //     },
        //     {
        //         sku_id: '171710',
        //         print_text: 'C&G BLUE 2',
        //         mat_desc: 'C&G BLUE 2 24X200G FB (PK)',
        //         max_per_bin: 2
        //     },
        //     {
        //         sku_id: '196673',
        //         print_text: 'SGM ANANDA 0-6',
        //         mat_desc: 'SGM ANANDA 0-6 10X1000G FB GRD 2.1',
        //         max_per_bin: 10
        //     }
        // ]

        // for(const row of data) {
        //     skuCache.set(row.sku_id, {
        //         sku_id: row.sku_id,
        //         print_text: row.print_text,
        //         mat_desc: row.mat_desc,
        //         max_per_bin: row.max_per_bin
        //     })
        // }


        console.log(`✅ SKU cache terupdate: ${skuCache.size} item`);
    } catch (err) {
        console.error('❌ Gagal membaca data:', err.message);
        db = null; // matikan koneksi jika bermasalah
        scheduleReconnect();
    }
}

// Sync berkala tiap 5 menit
setInterval(() => {
    getDataAutoCoding();
}, 60 * 60 * 1000); // 1 Jam

// Jalankan awal
tryConnectDatabase();

function getSkuCache () {
    return Array.from(skuCache.values())
}

function findSkuId (id) {
    return skuCache.get(`${id}`)
}

module.exports = {
    getDataAutoCoding,
    getSkuCache,
    findSkuId
};