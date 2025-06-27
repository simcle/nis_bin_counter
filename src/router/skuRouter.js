const express = require('express')
const { getAllSku, downloadSku, createSKU, editSKU, deletedSKU } = require('../controller/skuController.js')


const router = express.Router()

router.get('/', getAllSku)
router.get('/download', downloadSku)
router.post('/', createSKU)
router.put('/', editSKU)
router.delete('/:id', deletedSKU)

module.exports = router