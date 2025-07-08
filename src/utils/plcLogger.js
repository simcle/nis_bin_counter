const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

// Map line => { sku, pro, counter }
const lastStatePerLine = new Map();

function logToFile(line, eventData) {
  const dir = path.resolve('./plc_logs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const logPath = path.join(dir, `${line}.log`);

  const logEntry = {
    time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    ...eventData
  };

  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
}

/**
 * Handle log perubahan PLC line
 * @param {string} line
 * @param {number} sku
 * @param {string} pro
 * @param {number} counter
 */

function handlePlcLineLog(line, sku, pro, counter) {
  const last = lastStatePerLine.get(line);

  if (!last) {
    // Pertama kali muncul
    logToFile(line, { event: 'init', sku, pro, counter });
    lastStatePerLine.set(line, { sku, pro, counter });
    return;
  }

  // SKU berubah
  if (sku !== last.sku) {
    logToFile(line, {
      event: 'sku-change',
      oldSku: last.sku,
      newSku: sku
    });
  }

  // PRO berubah
  if (pro !== last.pro) {
    logToFile(line, {
      event: 'pro-change',
      oldPro: last.pro,
      newPro: pro
    });
  }

  // Counter reset
  if (counter < last.counter) {
    logToFile(line, {
      event: 'counter-reset',
      sku,
      pro,
      prevCounter: last.counter,
      currentCounter: counter
    });
  }

  // Update last state
  lastStatePerLine.set(line, { sku, pro, counter });
}

module.exports = {
  handlePlcLineLog
};