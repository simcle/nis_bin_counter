const express = require('express')
const { getLines, downloadLine} = require('../controller/lineController.js')

const router = express.Router()

router.get('/', getLines)
router.get('/download', downloadLine)
module.exports = router