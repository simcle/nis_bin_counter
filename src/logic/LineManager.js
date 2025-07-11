const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const BinTracker = require('./BinTracker.js');
const { findSkuId } = require('../services/autoCoding.js');
const { saveToDatabase } = require('../utils/fileSaver.js');
const { EventEmitter } = require('events');

const SAVE_PATH = path.resolve('./line_state.json');

class LineManager extends EventEmitter {
  constructor() {
    super();
    this.lines = new Map(); // line => { tracker, pro, started_at }
    this.pendingChanges = new Map();
    this.firstInit = true;
  }

  updateLine({ line, sku, pro, counter }) {
    const skuInfo = findSkuId(sku);
    if (!skuInfo) {
      this.emit('invalid-sku', { 
        line, 
        sku, 
        pro, 
        counter, 
        message: 'SKU tidak ditemukan di master data' 
      });
      return;
    }

    const currentLine = this.lines.get(line);
    const currentTracker = currentLine?.tracker;
    const currentPro = currentLine?.pro;

    // INIT line baru
    if (!currentTracker && !this.pendingChanges.has(line)) {
      if (counter === 1 || this.firstInit) {
        const tracker = new BinTracker(sku, skuInfo.max_per_bin, skuInfo);
        const started_at = dayjs().format('YYYY-MM-DD HH:mm:ss');
        tracker.addCounter(counter);
        this.lines.set(line, {
          tracker,
          pro,
          started_at
        });
        this.emit('new-line-start', { line, tracker, started_at });
        if (this.lines.size >= 1) {
          this.firstInit = false;
        }
      } else {
        this.pendingChanges.set(line, { sku, pro });
        this.emit('waiting-for-counter-reset', { line, sku, pro });
      }
      return;
    }

    // Menunggu counter reset
    if (this.pendingChanges.has(line)) {
      const pending = this.pendingChanges.get(line);
      if (sku === pending.sku && pro === pending.pro && counter === 1) {
        const tracker = new BinTracker(sku, skuInfo.max_per_bin, skuInfo);
        const started_at = dayjs().format('YYYY-MM-DD HH:mm:ss');
        tracker.addCounter(counter);
        this.lines.set(line, {
          tracker,
          pro,
          started_at
        });
        this.pendingChanges.delete(line);
        this.emit('new-line-start', { line, tracker, started_at });
      } else {
        this.emit('waiting-for-counter-reset', { line, sku, pro, counter });
      }
      return;
    }

    // PRO berubah
    if (pro !== currentPro) {
      const started_at = currentLine?.started_at || dayjs().format('YYYY-MM-DD HH:mm:ss');
      saveToDatabase(
        line,
        currentTracker.currentSku,
        currentLine?.pro || null,
        currentTracker.currentBin,
        currentTracker.lastCounter,
        currentTracker.skuData,
        started_at,
        currentTracker.bins
      );
      this.emit('pro-change', { line, oldPro: currentPro, newPro: pro });
      this.lines.delete(line);

      const tracker = new BinTracker(sku, skuInfo.max_per_bin, skuInfo);
      const newStartedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
      tracker.addCounter(counter);
      this.lines.set(line, {
        tracker,
        pro,
        started_at: newStartedAt
      });
      this.emit('new-line-start', { line, tracker, started_at: newStartedAt });
      return;
    }

    // SKU berubah
    if (sku !== currentTracker.currentSku) {
      const started_at = currentLine?.started_at || dayjs().format('YYYY-MM-DD HH:mm:ss');
      saveToDatabase(
        line,
        currentTracker.currentSku,
        currentLine?.pro || null,
        currentTracker.currentBin,
        currentTracker.lastCounter,
        currentTracker.skuData,
        started_at,
        currentTracker.bins
      );
      this.emit('sku-change', { line, oldSku: currentTracker.currentSku, newSku: sku });
      this.lines.delete(line);

      if (counter === 1) {
        const tracker = new BinTracker(sku, skuInfo.max_per_bin, skuInfo);
        const newStartedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        tracker.addCounter(counter);
        this.lines.set(line, {
          tracker,
          pro,
          started_at: newStartedAt
        });
        this.emit('new-line-start', { line, tracker, started_at: newStartedAt });
      } else {
        this.pendingChanges.set(line, { sku, pro });
        this.emit('waiting-for-counter-reset', { line, sku, pro });
      }
      return;
    }

    // SKU dan PRO sama → lanjut tracking
    const prevBinCount = currentTracker.bins.length;
    currentTracker.addCounter(counter);
    const newBinCount = currentTracker.bins.length;

    this.emit('line-update', {
      line,
      sku,
      pro,
      bin: currentTracker.currentBin,
      contain: currentTracker.currentContain,
      counter,
      bins: currentTracker.bins
    });

    if (newBinCount > prevBinCount) {
      const addedBins = currentTracker.bins.slice(prevBinCount);
      for (const newBin of addedBins) {
        this.emit('bin-added', { line, sku, pro, bin: newBin });
      }
    }
  }

  getLineBins() {
    const result = [];
    for (const [line, { tracker, pro, started_at }] of this.lines.entries()) {
      result.push({
        line,
        status: false,
        skuData: {
          sku_id: tracker?.skuData?.sku_id || null,
          print_text: tracker?.skuData?.print_text || null,
          mat_desc: tracker?.skuData?.mat_desc || null,
          max_per_bin: tracker?.skuData?.max_per_bin || null
        },
        message: 'Waiting...',
        updateCounter: {
          bin: tracker?.currentBin || null,
          contain: tracker?.currentContain || null,
          counter: tracker?.lastCounter || null
        },
        bins: tracker.bins,
        pro,
        started_at
      });
    }
    return result;
  }

  flushAllToDatabase() {
    for (const [line, data] of this.lines) {
      const { tracker, started_at } = data;
      if (tracker.bins.length > 0) {
        saveToDatabase(
          line,
          tracker.currentSku,
          data?.pro || null,
          tracker.currentBin,
          tracker.lastCounter,
          tracker.skuData,
          started_at,
          tracker.bins
        );
        this.emit('flushed', { line, bins: tracker.bins });
      }
    }
  }

  flushAllToFile() {
    const state = {};
    for (const [line, data] of this.lines) {
      const { tracker, started_at, pro } = data;
      state[line] = {
        sku: tracker.currentSku,
        maxPerBin: tracker.maxPerBin,
        lastCounter: tracker.lastCounter,
        bins: tracker.bins,
        started_at,
        pro,
        skuData: tracker.skuData
      };
    }
    fs.writeFileSync(SAVE_PATH, JSON.stringify(state, null, 2));
    console.log(`📁 State saved to ${SAVE_PATH}`);
  }

  restoreFromFile() {
    if (!fs.existsSync(SAVE_PATH)) return;
    try {
      const data = fs.readFileSync(SAVE_PATH, 'utf-8');
      const state = JSON.parse(data);
      for (const [line, value] of Object.entries(state)) {
        const tracker = new BinTracker(value.sku, value.maxPerBin, value.skuData || {});
        tracker.lastCounter = value.lastCounter;
        tracker.bins = value.bins;
        this.lines.set(line, {
          tracker,
          pro: value.pro || null,
          started_at: value.started_at || dayjs().format('YYYY-MM-DD HH:mm:ss')
        });
      }
      console.log('✅ State restored from file.');
    } catch (err) {
      console.error('❌ Failed to restore state:', err.message);
    }
  }
}

module.exports = LineManager;