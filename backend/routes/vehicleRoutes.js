const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  markAsSold,
  getSellerVehicles,
  getSellerStats
} = require('../controllers/vehicleController');
const { authenticateUser, requireSeller } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Multer fields configuration for images and documents
const uploadFields = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'rcDocument', maxCount: 1 },
  { name: 'insuranceDocument', maxCount: 1 },
  { name: 'pucDocument', maxCount: 1 },
  { name: 'additionalDocument', maxCount: 1 }
]);

// Public routes
router.get('/', getVehicles);
router.get('/categories', require('../controllers/adminController').getCategories);

// Seller dashboard endpoints (must come before /:id)
router.get('/seller/my-listings', authenticateUser, requireSeller, getSellerVehicles);
router.get('/seller/stats', authenticateUser, requireSeller, getSellerStats);

// Seller verification report check
router.get('/:id/verification', authenticateUser, requireSeller, require('../controllers/vehicleController').getVehicleVerification);

router.get('/:id', getVehicleById);

// Protected Seller routes
router.post('/', authenticateUser, requireSeller, uploadFields, createVehicle);
router.put('/:id', authenticateUser, requireSeller, uploadFields, updateVehicle);
router.delete('/:id', authenticateUser, requireSeller, deleteVehicle);
router.patch('/:id/sold', authenticateUser, requireSeller, markAsSold);

module.exports = router;
