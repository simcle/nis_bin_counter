const dayjs = require('dayjs');

class BinTracker {
  constructor(skuId, maxPerBin, skuData = {}) {
    this.currentSku = skuId;
    this.maxPerBin = maxPerBin;
    this.lastCounter = 0;
    this.bins = [];
    this.currentBin = 0;       // Menyimpan nomor bin terakhir
    this.currentContain = 0;   // Menyimpan isi terakhir bin
    this.skuData = skuData
  }

  addCounter(counter) {
    const added = counter - this.lastCounter;
    if (added <= 0) return;

    let remain = added;

    // Jika belum ada bin
    if (this.bins.length === 0) {
      const fill = Math.min(remain, this.maxPerBin);
      const newBin = {
        sku: this.currentSku,
        bin: 1,
        contain: fill,
        start_counter: 0,
        end_counter: fill,
        started_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };
      this.bins.push(newBin);
      this.currentBin = newBin.bin;
      this.currentContain = newBin.contain;
      this.lastCounter += fill;
      remain -= fill;
    }

    // Tambah ke bin terakhir jika belum penuh
    let lastBin = this.bins[this.bins.length - 1];
    const spaceLeft = this.maxPerBin - lastBin.contain;

    if (spaceLeft > 0) {
      const fill = Math.min(remain, spaceLeft);
      lastBin.contain += fill;
      lastBin.end_counter += fill;
      this.currentBin = lastBin.bin;
      this.currentContain = lastBin.contain;
      this.lastCounter += fill;
      remain -= fill;
    }

    // Tambahkan bin baru
    while (remain > 0) {
      const fill = Math.min(remain, this.maxPerBin);
      const newBin = {
        sku: this.currentSku,
        bin: this.bins.length + 1,
        contain: fill,
        start_counter: this.lastCounter,
        end_counter: this.lastCounter + fill,
        started_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };
      this.bins.push(newBin);
      this.currentBin = newBin.bin;
      this.currentContain = newBin.contain;
      this.lastCounter += fill;
      remain -= fill;
    }
  }
}

module.exports = BinTracker;