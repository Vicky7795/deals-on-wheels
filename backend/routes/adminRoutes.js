const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getVehicles,
  approveVehicle,
  rejectVehicle,
  getOrders,
  getPayments,
  getCommissions,
  processCommission,
  refundOrder,
  getReports,
  updateReportStatus,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSettings,
  updateSettings,
  getActivityLogs,
  getPendingVerifications,
  getVehicleVerificationAdmin,
  processVerificationAction
} = require('../controllers/adminController');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Apply admin protection to all routes
router.use(authenticateUser);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// Vehicles
router.get('/vehicles', getVehicles);
router.patch('/vehicles/:id/approve', approveVehicle);
router.patch('/vehicles/:id/reject', rejectVehicle);

// Verification and Fraud checks
router.get('/vehicles/pending', getPendingVerifications);
router.get('/vehicles/:id/verification', getVehicleVerificationAdmin);
router.patch('/vehicles/:id/verify-action', processVerificationAction);

// Orders & Payments & Commissions
router.get('/orders', getOrders);
router.patch('/orders/:id/refund', refundOrder);
router.get('/payments', getPayments);
router.get('/commissions', getCommissions);
router.patch('/commissions/:id/process', processCommission);

// Reports
router.get('/reports', getReports);
router.patch('/reports/:id', updateReportStatus);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Activity Logs
router.get('/activity-logs', getActivityLogs);

module.exports = router;
