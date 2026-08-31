const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getBuyerInquiries,
  getSellerInquiries,
  respondInquiry,
  closeInquiry,
  replyInquiry
} = require('../controllers/inquiryController');
const { authenticateUser, requireBuyer, requireSeller } = require('../middleware/auth');

router.post('/', authenticateUser, requireBuyer, createInquiry);
router.get('/buyer', authenticateUser, requireBuyer, getBuyerInquiries);
router.get('/seller', authenticateUser, requireSeller, getSellerInquiries);
router.post('/:id/respond', authenticateUser, requireSeller, respondInquiry);
router.post('/:id/reply', authenticateUser, replyInquiry);
router.patch('/:id/close', authenticateUser, closeInquiry);

module.exports = router;
