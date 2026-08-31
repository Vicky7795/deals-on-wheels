const express = require('express');
const router = express.Router();
const {
  createOrder,
  completeOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderById,
  downloadInvoice
} = require('../controllers/orderController');
const { authenticateUser, requireBuyer, requireSeller } = require('../middleware/auth');

router.post('/', authenticateUser, requireBuyer, createOrder);
router.patch('/:id/complete', authenticateUser, completeOrder);
router.get('/buyer', authenticateUser, requireBuyer, getBuyerOrders);
router.get('/seller', authenticateUser, requireSeller, getSellerOrders);
router.get('/:id/invoice', authenticateUser, downloadInvoice);
router.get('/:id', authenticateUser, getOrderById);

module.exports = router;

