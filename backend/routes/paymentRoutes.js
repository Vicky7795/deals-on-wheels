const express = require('express');
const router = express.Router();
const { createPayment, verifyPayment, handleWebhook, getPaymentById } = require('../controllers/paymentController');
const { authenticateUser, requireBuyer } = require('../middleware/auth');

router.post('/create', authenticateUser, requireBuyer, createPayment);
router.post('/verify', authenticateUser, requireBuyer, verifyPayment);
router.post('/razorpay/webhook', handleWebhook);
router.get('/:id', authenticateUser, getPaymentById);

module.exports = router;
