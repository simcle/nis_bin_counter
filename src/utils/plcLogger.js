const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

// Map line => { sku, counter }
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

function handlePlcLineLog(line, sku, counter) {
  const last = lastStatePerLine.get(line);

  if (!last) {
    // Pertama kali muncul
    logToFile(line, { event: 'init', sku, counter });
    lastStatePerLine.set(line, { sku, counter });
    return;
  }

  // SKU berubah
  if (sku !== last.sku) {
    logToFile(line, { event: 'sku-change', oldSku: last.sku, newSku: sku });
  }

  // Counter reset
  if (counter < last.counter) {
    logToFile(line, { event: 'counter-reset', sku, prevCounter: last.counter, currentCounter: counter });
  }

  // Update last state
  lastStatePerLine.set(line, { sku, counter });
}

module.exports = {
  handlePlcLineLog
};