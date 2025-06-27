const express = require('express')
const { getBins, downloadBin } = require('../controller/binController.js')

const router = express.Router()

router.get('/:sessionId', getBins)
router.get('/download/:sessionId', downloadBin)
module.exports = router
