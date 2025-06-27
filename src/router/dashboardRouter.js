const express = require('express')
const { getLines } = require('../controller/dashboardController.js')
const router = express.Router()

router.get('/', getLines)

module.exports = router