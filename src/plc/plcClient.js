const LineManager = require('../logic/LineManager.js')
// Inisialisasi LineManager
const manager = new LineManager();

manager.restoreFromFile()

const simulatedInputs = [
  { line: "Line01", sku: 202722, counter: 2 },
  { line: "Line01", sku: 202722, counter: 3 },
  { line: "Line01", sku: 202722, counter: 4 },
  { line: "Line01", sku: 202722, counter: 5 },
  { line: "Line01", sku: 202722, counter: 6 },
  { line: "Line01", sku: 202722, counter: 7 },
  { line: "Line01", sku: 202722, counter: 8 },
  { line: "Line01", sku: 171710, counter: 1 },
  { line: "Line01", sku: 171710, counter: 2 },
  { line: "Line01", sku: 171710, counter: 3 },
  { line: "Line01", sku: 171710, counter: 4 },
  { line: "Line01", sku: 171710, counter: 5 },
  { line: "Line01", sku: 171710, counter: 6 },
  { line: "Line01", sku: 171710, counter: 7 },
  { line: "Line01", sku: 171710, counter: 8 },
  { line: "Line01", sku: 171710, counter: 9},
  { line: "Line01", sku: 171710, counter: 10},
  { line: "Line01", sku: 171710, counter: 11},
  { line: "Line01", sku: 171710, counter: 12},
  { line: "Line01", sku: 202722, counter: 12},
  { line: "Line01", sku: 202722, counter: 12},
  { line: "Line02", sku: 196673, counter: 1 },
  { line: "Line02", sku: 196673, counter: 2 },
  { line: "Line02", sku: 196673, counter: 5 },
  { line: "Line02", sku: 196673, counter: 7 },
  { line: "Line02", sku: 196673, counter: 8 },
  { line: "Line02", sku: 196673, counter: 10 },
  { line: "Line02", sku: 196673, counter: 11 },
  { line: "Line02", sku: 196673, counter: 13 },
];

function pollingPcl () {
  let index = 0;
  const interval = setInterval(() => {
      if (index >= simulatedInputs.length) {
        clearInterval(interval);
        console.log("Selesai simulasi");
        manager.flushAllToDatabase();
        return;
      }
      const input = simulatedInputs[index];
      manager.updateLine(input);
      index++;
      // manager.flushAllToFile()
    }, 1000);
}


module.exports = {
    pollingPcl,
    manager
}