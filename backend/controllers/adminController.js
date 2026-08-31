const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const Report = require('../models/Report');
const Category = require('../models/Category');
const PlatformSetting = require('../models/PlatformSetting');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const VehicleVerification = require('../models/VehicleVerification');

// Helper to log admin actions
const logAdminAction = async (adminId, action, relatedEntity, relatedEntityId) => {
  try {
    await ActivityLog.create({
      adminId,
      action,
      relatedEntity,
      relatedEntityId
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

// @desc    Get Admin Dashboard Stats & Analytics
// @route   GET /api/admin/dashboard
// @access  Private (Admin Only)
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. User Stats
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalBuyers = await User.countDocuments({ role: { $in: ['user', 'buyer'] } });
    const totalSellers = await User.countDocuments({ role: { $in: ['user', 'seller'] } });
    const activeUsers = await User.countDocuments({ accountStatus: 'active', role: { $ne: 'admin' } });
    const suspendedUsers = await User.countDocuments({ accountStatus: 'suspended', role: { $ne: 'admin' } });
    const blockedUsers = await User.countDocuments({ accountStatus: 'blocked', role: { $ne: 'admin' } });

    // 2. Vehicle Stats
    const totalVehicles = await Vehicle.countDocuments();
    const pendingListings = await Vehicle.countDocuments({ approvalStatus: 'pending' });
    const approvedListings = await Vehicle.countDocuments({ approvalStatus: 'approved' });
    const rejectedListings = await Vehicle.countDocuments({ approvalStatus: 'rejected' });
    const soldVehicles = await Vehicle.countDocuments({ status: 'sold' });

    // 3. Order Stats
    const totalOrders = await Order.countDocuments();
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    // 4. Revenue Stats
    const confirmedAndCompletedOrders = await Order.find({ status: { $in: ['confirmed', 'completed'] } });
    const totalTransactionValue = confirmedAndCompletedOrders.reduce((sum, o) => sum + o.amount, 0);
    const platformCommission = confirmedAndCompletedOrders.reduce((sum, o) => sum + (o.platformFee || 0), 0);

    const pendingCommissionDocs = await Commission.find({ status: 'pending' });
    const pendingCommission = pendingCommissionDocs.reduce((sum, c) => sum + c.commissionAmount, 0);

    // 5. Activity Logs (Recent 5)
    const recentLogs = await ActivityLog.find()
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Analytics Charts Data (Grouped by Month/Year)
    const orderAnalytics = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          totalSales: { $sum: "$amount" },
          totalCommission: { $sum: "$platformFee" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    const userAnalytics = await User.aggregate([
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    const vehicleAnalytics = await Vehicle.aggregate([
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          users: { totalUsers, totalBuyers, totalSellers, activeUsers, suspendedUsers, blockedUsers },
          vehicles: { totalVehicles, pendingListings, approvedListings, rejectedListings, soldVehicles },
          orders: { totalOrders, confirmedOrders, completedOrders, cancelledOrders },
          revenue: { totalTransactionValue, platformCommission, pendingCommission }
        },
        recentLogs,
        charts: {
          orderAnalytics,
          userAnalytics,
          vehicleAnalytics
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Users (Admin filters)
// @route   GET /api/admin/users
// @access  Private (Admin Only)
const getUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    } else {
      query.role = { $in: ['user', 'buyer', 'seller'] };
    }
    if (status) query.accountStatus = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    const usersWithStats = await Promise.all(users.map(async (u) => {
      const listingsCount = await Vehicle.countDocuments({ sellerId: u._id });
      const activeListingsCount = await Vehicle.countDocuments({ sellerId: u._id, status: 'available', approvalStatus: 'approved' });
      const soldListingsCount = await Vehicle.countDocuments({ sellerId: u._id, status: 'sold' });
      const purchasesCount = await Order.countDocuments({ buyerId: u._id });
      const reportsCount = await Report.countDocuments({ reportedUserId: u._id });
      return {
        ...u,
        listingsCount,
        activeListingsCount,
        soldListingsCount,
        purchasesCount,
        reportsCount
      };
    }));

    res.status(200).json({
      success: true,
      data: usersWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Status (Suspend, Activate, Block)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin Only)
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot modify admin status' });
    }

    user.accountStatus = status;
    await user.save();

    await logAdminAction(req.user._id, `Updated user ${user.email} status to ${status}`, 'User', user._id);

    // Notify user
    await Notification.create({
      userId: user._id,
      message: `Your account status has been updated to ${status} by the platform administrator.`,
      type: 'general'
    });

    res.status(200).json({
      success: true,
      message: `User account status updated to ${status} successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Vehicles (Admin view)
// @route   GET /api/admin/vehicles
// @access  Private (Admin Only)
const getVehicles = async (req, res, next) => {
  try {
    const { approvalStatus, status, search } = req.query;
    const query = {};

    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query)
      .populate('sellerId', 'name email phone')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a Vehicle listing
// @route   PATCH /api/admin/vehicles/:id/approve
// @access  Private (Admin Only)
const approveVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle listing not found' });
    }

    vehicle.approvalStatus = 'approved';
    vehicle.rejectionReason = '';
    await vehicle.save();

    await logAdminAction(req.user._id, `Approved vehicle listing: ${vehicle.title}`, 'Vehicle', vehicle._id);

    // Notify seller
    await Notification.create({
      userId: vehicle.sellerId,
      message: `Your listing "${vehicle.title}" has been approved and is now live in the marketplace!`,
      type: 'vehicle_approved',
      relatedId: vehicle._id
    });

    res.status(200).json({
      success: true,
      message: 'Vehicle listing approved successfully',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a Vehicle listing
// @route   PATCH /api/admin/vehicles/:id/reject
// @access  Private (Admin Only)
const rejectVehicle = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle listing not found' });
    }

    vehicle.approvalStatus = 'rejected';
    vehicle.rejectionReason = rejectionReason;
    await vehicle.save();

    await logAdminAction(
      req.user._id,
      `Rejected vehicle listing: ${vehicle.title}. Reason: ${rejectionReason}`,
      'Vehicle',
      vehicle._id
    );

    // Notify seller
    await Notification.create({
      userId: vehicle.sellerId,
      message: `Your listing "${vehicle.title}" was rejected: ${rejectionReason}`,
      type: 'vehicle_rejected',
      relatedId: vehicle._id
    });

    res.status(200).json({
      success: true,
      message: 'Vehicle listing rejected successfully',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Orders (Admin)
// @route   GET /api/admin/orders
// @access  Private (Admin Only)
const getOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('buyerId', 'name email phone')
      .populate('sellerId', 'name email phone')
      .populate('vehicleId', 'title brand model price status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Payments (Admin)
// @route   GET /api/admin/payments
// @access  Private (Admin Only)
const getPayments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('vehicleId', 'title brand price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Commissions (Admin)
// @route   GET /api/admin/commissions
// @access  Private (Admin Only)
const getCommissions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const commissions = await Commission.find(query)
      .populate('sellerId', 'name email phone')
      .populate('vehicleId', 'title brand price')
      .populate('orderId', 'status amount platformFee')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: commissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Payout / Commission as processed
// @route   PATCH /api/admin/commissions/:id/process
// @access  Private (Admin Only)
const processCommission = async (req, res, next) => {
  try {
    const commission = await Commission.findById(req.params.id);
    if (!commission) {
      return res.status(404).json({ success: false, message: 'Commission record not found' });
    }

    if (commission.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Commission is already ${commission.status}` });
    }

    commission.status = 'processed';
    await commission.save();

    await logAdminAction(
      req.user._id,
      `Processed payout for seller commission on Order ${commission.orderId}`,
      'Commission',
      commission._id
    );

    // Notify seller
    await Notification.create({
      userId: commission.sellerId,
      message: `Platform payout of ₹${commission.sellerAmount.toLocaleString()} has been processed for vehicle sale.`,
      type: 'payout_processed',
      relatedId: commission.orderId
    });

    res.status(200).json({
      success: true,
      message: 'Payout/commission marked as processed successfully',
      data: commission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel Order & Refund Payment
// @route   PATCH /api/admin/orders/:id/refund
// @access  Private (Admin Only)
const refundOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'refunded' || order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled or refunded' });
    }

    order.status = 'refunded';
    await order.save();

    // Make vehicle available again
    await Vehicle.findByIdAndUpdate(order.vehicleId, { status: 'available' });

    // Update payment
    if (order.paymentId) {
      await Payment.findByIdAndUpdate(order.paymentId, { status: 'refunded' });
    }

    // Update Commission record
    await Commission.findOneAndUpdate({ orderId: order._id }, { status: 'refunded' });

    await logAdminAction(
      req.user._id,
      `Refunded and cancelled Order ${order._id}`,
      'Order',
      order._id
    );

    // Notify buyer and seller
    await Notification.create({
      userId: order.buyerId,
      message: `Your purchase order for vehicle has been cancelled and refunded.`,
      type: 'refund'
    });

    await Notification.create({
      userId: order.sellerId,
      message: `Order for your vehicle sale was cancelled and refunded by admin. Listing is active again.`,
      type: 'order_update'
    });

    res.status(200).json({
      success: true,
      message: 'Order has been successfully cancelled and refunded.',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Reports (Admin)
// @route   GET /api/admin/reports
// @access  Private (Admin Only)
const getReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('reporterId', 'name email phone')
      .populate('reportedUserId', 'name email phone')
      .populate('vehicleId', 'title brand model price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve or Reject a Report
// @route   PATCH /api/admin/reports/:id
// @access  Private (Admin Only)
const updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNote, suspendUser, deleteListing } = req.body;

    if (!['reviewing', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid report status' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status;
    if (adminNote) report.adminNote = adminNote;
    await report.save();

    await logAdminAction(
      req.user._id,
      `Updated report ${report._id} status to ${status}`,
      'Report',
      report._id
    );

    // Take administrative actions if requested
    if (suspendUser && report.reportedUserId) {
      await User.findByIdAndUpdate(report.reportedUserId, { accountStatus: 'suspended' });
      await logAdminAction(req.user._id, `Suspended user ${report.reportedUserId} via Report resolution`, 'User', report.reportedUserId);
    }

    if (deleteListing && report.vehicleId) {
      // Set to unavailable / rejected
      await Vehicle.findByIdAndUpdate(report.vehicleId, { approvalStatus: 'rejected', rejectionReason: 'Removed due to user reports.' });
      await logAdminAction(req.user._id, `Rejected vehicle ${report.vehicleId} via Report resolution`, 'Vehicle', report.vehicleId);
    }

    res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Categories
// @route   GET /api/admin/categories
// @access  Private (Admin or Public)
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Category
// @route   POST /api/admin/categories
// @access  Private (Admin Only)
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({ name, description });

    await logAdminAction(req.user._id, `Created Category: ${name}`, 'Category', category._id);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Category
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin Only)
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (status) category.status = status;

    await category.save();

    await logAdminAction(req.user._id, `Updated Category: ${category.name}`, 'Category', category._id);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin Only)
const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    // Safety check: check if any vehicles use this category
    const count = await Vehicle.countDocuments({ categoryId });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. There are ${count} vehicles associated with it.`
      });
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await logAdminAction(req.user._id, `Deleted Category: ${category.name}`, 'Category', categoryId);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Platform Settings
// @route   GET /api/admin/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSetting.findOne();
    if (!settings) {
      settings = await PlatformSetting.create({
        platformName: 'Deals on Wheels',
        commissionPercentage: 1.0,
        maxImageCount: 5,
        listingRules: 'Default rules.'
      });
    }
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Platform Settings
// @route   PUT /api/admin/settings
// @access  Private (Admin Only)
const updateSettings = async (req, res, next) => {
  try {
    const { platformName, commissionPercentage, maxImageCount, listingRules, contactEmail, contactPhone } = req.body;

    let settings = await PlatformSetting.findOne();
    if (!settings) {
      settings = new PlatformSetting();
    }

    if (platformName) settings.platformName = platformName;
    if (commissionPercentage !== undefined) settings.commissionPercentage = commissionPercentage;
    if (maxImageCount !== undefined) settings.maxImageCount = maxImageCount;
    if (listingRules) settings.listingRules = listingRules;
    if (contactEmail) settings.contactEmail = contactEmail;
    if (contactPhone) settings.contactPhone = contactPhone;

    await settings.save();

    await logAdminAction(req.user._id, `Updated Platform Settings`, 'PlatformSetting', settings._id);

    res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Activity Logs
// @route   GET /api/admin/activity-logs
// @access  Private (Admin Only)
const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending vehicle verifications list
// @route   GET /api/admin/vehicles/pending
// @access  Private (Admin Only)
const getPendingVerifications = async (req, res, next) => {
  try {
    const verifications = await VehicleVerification.find({
      status: { $in: ['pending', 'under_review', 'documents_required'] }
    })
      .populate('vehicleId')
      .populate('sellerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: verifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vehicle verification report details
// @route   GET /api/admin/vehicles/:id/verification
// @access  Private (Admin Only)
const getVehicleVerificationAdmin = async (req, res, next) => {
  try {
    let verification = await VehicleVerification.findOne({ vehicleId: req.params.id })
      .populate('vehicleId')
      .populate('sellerId', 'name email phone');

    if (!verification) {
      const vehicle = await Vehicle.findById(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle listing not found.' });
      }

      // Automatically generate checks on-the-fly
      const verificationService = require('../utils/verificationService');
      await verificationService.runChecks(vehicle);

      verification = await VehicleVerification.findOne({ vehicleId: req.params.id })
        .populate('vehicleId')
        .populate('sellerId', 'name email phone');
    }

    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process vehicle verification action (approve, reject, request documents)
// @route   PATCH /api/admin/vehicles/:id/verify-action
// @access  Private (Admin Only)
const processVerificationAction = async (req, res, next) => {
  try {
    const { action, rejectionReason, adminNote } = req.body;
    const vehicleId = req.params.id;

    if (!['approve', 'reject', 'request-documents'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid verification action.' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle listing not found.' });
    }

    let verification = await VehicleVerification.findOne({ vehicleId });
    if (!verification) {
      verification = new VehicleVerification({
        vehicleId,
        sellerId: vehicle.sellerId
      });
    }

    verification.adminId = req.user._id;

    if (action === 'approve') {
      vehicle.approvalStatus = 'approved';
      vehicle.rejectionReason = '';
      verification.status = 'verified';
      verification.adminNote = adminNote || '';
      verification.rejectionReason = '';
      
      await vehicle.save();
      await verification.save();

      // Log admin action
      await logAdminAction(req.user._id, `Approved vehicle verification: ${vehicle.title}`, 'Vehicle', vehicle._id);

      // Notify seller
      await Notification.create({
        userId: vehicle.sellerId,
        message: `Your listing "${vehicle.title}" has been verified and is now live!`,
        type: 'vehicle_approved',
        relatedId: vehicle._id
      });
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
      }

      vehicle.approvalStatus = 'rejected';
      vehicle.rejectionReason = rejectionReason;
      verification.status = 'rejected';
      verification.rejectionReason = rejectionReason;
      verification.adminNote = adminNote || '';

      await vehicle.save();
      await verification.save();

      // Log admin action
      await logAdminAction(req.user._id, `Rejected vehicle verification: ${vehicle.title}. Reason: ${rejectionReason}`, 'Vehicle', vehicle._id);

      // Notify seller
      await Notification.create({
        userId: vehicle.sellerId,
        message: `Your listing "${vehicle.title}" was rejected: ${rejectionReason}`,
        type: 'vehicle_rejected',
        relatedId: vehicle._id
      });
    } else if (action === 'request-documents') {
      if (!adminNote) {
        return res.status(400).json({ success: false, message: 'Admin instruction message is required to request more documents.' });
      }

      vehicle.approvalStatus = 'pending';
      verification.status = 'documents_required';
      verification.adminNote = adminNote;

      await vehicle.save();
      await verification.save();

      // Log admin action
      await logAdminAction(req.user._id, `Requested document update for: ${vehicle.title}. Note: ${adminNote}`, 'Vehicle', vehicle._id);

      // Notify seller
      await Notification.create({
        userId: vehicle.sellerId,
        message: `Platform administrator requested document updates for "${vehicle.title}". Note: ${adminNote}`,
        type: 'general',
        relatedId: vehicle._id
      });
    }

    res.status(200).json({
      success: true,
      message: `Verification action "${action}" processed successfully.`,
      data: { vehicle, verification }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
