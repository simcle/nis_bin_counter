const { Controller, Tag, TagGroup } = require('ethernet-ip')
const LineManager = require('../logic/LineManager.js')

// Inisialisasi LineManager
const manager = new LineManager();
manager.restoreFromFile()

// Inisialisasi PLC
const PLC = new Controller()
const PLC_IP = '192.168.1.10'

const lineTags = {
    Line01: {
        sku: 'Filler_SPLine01.CTX_SKUID',
        counter: 'Total_Counter_L1'
    },
    Line02: {
        sku: 'Filler_SPLine02.CTX_SKUID',
        counter: 'Total_Counter_L2'
    },
    Line03: {
        sku: 'Filler_SPLine03.CTX_SKUID',
        counter: 'Total_Counter_L3'
    },
    Line04: {
        sku: 'Filler_SPLine04.CTX_SKUID',
        counter: 'Total_Counter_L4'
    }
}

const tagGroup = new TagGroup()
const stringTags = []
const counterTags = {}

function createABStringTagGroup(tagGroup, baseTagName, length = 10) {
	const tagLen = new Tag(`${baseTagName}.LEN`)
	const tagData = []

	for (let i = 0; i < length; i++) {
		const dataTag = new Tag(`${baseTagName}.DATA[${i}]`)
		tagGroup.add(dataTag)
		tagData.push(dataTag)
	}

	const tagLenObj = new Tag(`${baseTagName}.LEN`)
	tagGroup.add(tagLenObj)

  return { tagName: baseTagName, tagLen: tagLenObj, tagData }
}

for (const [line, { sku, counter }] of Object.entries(lineTags)) {
  const stringTag = createABStringTagGroup(tagGroup, sku)
  stringTags.push({ line, ...stringTag })

  const counterTag = new Tag(counter)
  tagGroup.add(counterTag)
  counterTags[line] = counterTag
}


const startPooling = () => {

    setInterval(async () => {
        try {
            await PLC.readTagGroup(tagGroup)
            const result = {}

            for (const { line, tagLen, tagData } of stringTags) {
                const len = tagLen.value
                let str = ""
                
                for (let i = 0; i < len; i++) {
                    str += String.fromCharCode(tagData[i].value || 0)
                }
                
                const skuNum = parseInt(str)
                const counterVal = Number(counterTags[line]?.value) || 0
                
                if (!isNaN(skuNum)) {
                    result[line] = {
                        sku: skuNum,
                        counter: counterVal
                    }
					console.log({line: line, sku: skuNum, counter: counterVal})
					// start tracking
                    // manager.updateLine({line: line, sku: skuNum, counter: counterVal})
                }
            }
        } catch (error) {
            console.log('ERROR: ' +error)
        }
        
    }, 1000)
}

function connectToPLC () {
	PLC.connect(PLC_IP, 0)
	.then(() => {
		console.log('PLC connected')
		startPooling()
	})
	.catch(err => {
		console.log('PLC error: '+err)
	})
}

module.exports = {
    connectToPLC,
    manager
}