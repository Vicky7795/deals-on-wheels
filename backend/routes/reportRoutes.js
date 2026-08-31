const express = require('express');
const router = express.Router();
const { submitReport } = require('../controllers/reportController');
const { authenticateUser, requireBuyerOrSeller } = require('../middleware/auth');

router.post('/', authenticateUser, requireBuyerOrSeller, submitReport);

module.exports = router;
