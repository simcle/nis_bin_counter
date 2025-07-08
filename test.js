const { handlePlcLineLog } = require('./src/utils/plcLogger.js')

const simulatedInputs = [
  { line: "line1", sku: 202722, counter: 1 },
  { line: "line1", sku: 202722, counter: 2 },
  { line: "line1", sku: 202722, counter: 3 },
  { line: "line1", sku: 202722, counter: 4 },
  { line: "line1", sku: 202722, counter: 5 },
  { line: "line1", sku: 202722, counter: 2 },
  { line: "line1", sku: 202722, counter: 3 },
  { line: "line1", sku: 202722, counter: 4 },
  { line: "line1", sku: 202721, counter: 3 },
  { line: "line1", sku: 202721, counter: 4 },
  { line: "line1", sku: 202721, counter: 5 },
  { line: "line1", sku: 202721, counter: 6 },
  { line: "line2", sku: 202724, counter: 1 },
  { line: "line2", sku: 202724, counter: 2 },
  { line: "line2", sku: 202724, counter: 5 },
  { line: "line2", sku: 202724, counter: 7 },
  { line: "line2", sku: 202724, counter: 8 },
  { line: "line2", sku: 202724, counter: 10 },
  { line: "line2", sku: 202724, counter: 11 },
  { line: "line2", sku: 202724, counter: 13 },
];

let index = 0;
const interval = setInterval(() => {
  if (index >= simulatedInputs.length) {
    clearInterval(interval);
    console.log("Selesai simulasi");
    return;
  }
  const {line, sku, counter} = simulatedInputs[index];
  handlePlcLineLog(line, sku, counter)

  index++;

}, 1000);