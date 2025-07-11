const { Controller, Tag, TagGroup } = require('ethernet-ip');
const LineManager = require('../logic/LineManager.js');
const eventBus = require('../even/event.js');
const { handlePlcLineLog } = require('../utils/plcLogger.js')

// Inisialisasi LineManager
const manager = new LineManager();
manager.restoreFromFile();

// Inisialisasi PLC
const PLC = new Controller();
const PLC_IP = '10.203.179.200';

const lineTags = {
	Line02: { sku: 'Filler_SPLine02.CTX_SKUID', pro: 'Filler_SPLine02.CTX_PrO', counter: 'Total_Counter_L2' },
	Line03: { sku: 'Filler_SPLine03.CTX_SKUID', pro: 'Filler_SPLine03.CTX_PrO', counter: 'Total_Counter_L3' },
	Line04: { sku: 'Filler_SPLine04.CTX_SKUID', pro: 'Filler_SPLine04.CTX_PrO', counter: 'Total_Counter_L4' }
};

const tagGroup = new TagGroup();
const skuTags = [];
const proTags = [];
const counterTags = {};

// Helper untuk membaca STRING Allen-Bradley
function createABStringTagGroup(tagGroup, baseTagName, length = 10) {
	const tagLen = new Tag(`${baseTagName}.LEN`);
	const tagData = [];
	for (let i = 0; i < length; i++) {
		const dataTag = new Tag(`${baseTagName}.DATA[${i}]`);
		tagGroup.add(dataTag);
		tagData.push(dataTag);
	}
	const tagLenObj = new Tag(`${baseTagName}.LEN`);
	tagGroup.add(tagLenObj);
	return { tagName: baseTagName, tagLen: tagLenObj, tagData };
}

// Daftarkan semua tags
for (const [line, { sku, pro, counter }] of Object.entries(lineTags)) {
	// SKU tag
	const skuTag = createABStringTagGroup(tagGroup, sku);
	skuTags.push({ line, ...skuTag });

	// PRO tag
	const proTag = createABStringTagGroup(tagGroup, pro);
	proTags.push({ line, ...proTag });

	// Counter tag
	const counterTag = new Tag(counter);
	tagGroup.add(counterTag);
	counterTags[line] = counterTag;
}

let poolingInterval = null;

const startPooling = () => {
	if (poolingInterval) return; // Jangan dobel pooling
	console.log('📡 Start polling...');
	poolingInterval = setInterval(async () => {
		try {
		await PLC.readTagGroup(tagGroup);

		for (const { line } of skuTags) {
			const skuTagObj = skuTags.find(t => t.line === line);
			const proTagObj = proTags.find(t => t.line === line);

			// Baca SKU string
			const skuLen = skuTagObj.tagLen.value;
			let skuStr = '';
			for (let i = 0; i < skuLen; i++) {
				skuStr += String.fromCharCode(skuTagObj.tagData[i].value || 0);
			}
			const skuNum = parseInt(skuStr);

			// Baca PRO string
			const proLen = proTagObj.tagLen.value;
			let proStr = '';
			for (let i = 0; i < proLen; i++) {
				proStr += String.fromCharCode(proTagObj.tagData[i].value || 0);
			}

			// Baca counter
			const counterVal = Number(counterTags[line]?.value) || 0;

			if (!isNaN(skuNum)) {
				console.log({
					line,
					sku: skuNum,
					pro: proStr,
					counter: counterVal
				});

				// Emit event contoh
				eventBus.emit('plc', { message: 'Connected' });

				//
				// Logs
				handlePlcLineLog(line, skuNum, proStr, counterVal)   
				
				// Tracking
				manager.updateLine({ line, sku: skuNum, pro: proStr, counter: counterVal });
			}
		}
		} catch (error) {
			eventBus.emit('plc', { message: 'Polling error' });
			console.error('❌ PLC polling error:', error.message);
		}
	}, 1000);
};

function connectToPLC() {
	console.log(`🔌 Connecting to PLC ${PLC_IP}...`);
	eventBus.emit('plc', { message: 'Connecting to plc...' });

	PLC.connect(PLC_IP, 0)
		.then(() => {
			console.log('✅ PLC connected.');
			eventBus.emit('plc', { message: 'Connected' });
			startPooling();
		})
		.catch(err => {
			console.error('❌ PLC connection error:', err.message);
			eventBus.emit('plc', { message: 'Connection error' });
		});
}

module.exports = {
  connectToPLC,
  manager
};