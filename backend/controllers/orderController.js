const Order = require('../models/Order');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const PlatformSetting = require('../models/PlatformSetting');
const User = require('../models/User');

// @desc    Purchase a vehicle (Initiate Order)
// @route   POST /api/orders
// @access  Private (Buyer only)
const createOrder = async (req, res, next) => {
  try {
    // Automatically release expired reservations
    await Vehicle.updateMany(
      {
        status: 'reserved',
        $or: [
          { reservationExpiresAt: { $lt: new Date() } },
          { reservedBy: null },
          { reservationExpiresAt: null }
        ]
      },
      {
        $set: { status: 'available', reservedBy: null, reservationExpiresAt: null }
      }
    );

    const { vehicleId } = req.body;
    const buyerId = req.user._id;

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID is required to process purchase.'
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.'
      });
    }

    // Rule: Seller cannot purchase their own vehicle
    if (vehicle.sellerId.toString() === buyerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot purchase your own vehicle listing.'
      });
    }

    // Rule: Check if vehicle is already sold or reserved (allow if reserved by the same buyer)
    const isReservedBySelf = vehicle.status === 'reserved' && vehicle.reservedBy && vehicle.reservedBy.toString() === buyerId.toString();
    if (vehicle.status !== 'available' && !isReservedBySelf) {
      return res.status(400).json({
        success: false,
        message: 'This vehicle is no longer available.'
      });
    }

    // Check if there is already an existing pending order for this buyer and vehicle
    let order = await Order.findOne({ buyerId, vehicleId, status: 'payment_pending' });
    if (!order) {
      // Create new Order in payment_pending status
      order = await Order.create({
        buyerId,
        sellerId: vehicle.sellerId,
        vehicleId,
        amount: vehicle.price,
        platformFee: 0,
        sellerAmount: 0,
        status: 'payment_pending'
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('buyerId', 'name email phone city state')
      .populate('sellerId', 'name email phone city state')
      .populate('vehicleId');

    res.status(201).json({
      success: true,
      message: 'Order initiated. Please proceed to payment.',
      data: populatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete Order (Handover)
// @route   PATCH /api/orders/:id/complete
// @access  Private (Seller or Admin)
const completeOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Access control: Seller of the vehicle or Admin
    const isAuthorized = order.sellerId.toString() === req.user._id.toString() || req.user.role === 'admin';
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only the seller or admin can complete the order.' });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: `Cannot complete order in status: ${order.status}` });
    }

    order.status = 'completed';
    await order.save();

    // Mark vehicle as sold
    await Vehicle.findByIdAndUpdate(order.vehicleId, { status: 'sold' });

    // Create notifications
    await Notification.create({
      userId: order.buyerId,
      message: `Your vehicle purchase order has been marked as completed and delivered. Thank you!`,
      type: 'general',
      relatedId: order._id
    });

    await Notification.create({
      userId: order.sellerId,
      message: `The buyer has confirmed receipt of the vehicle. Your sale is now complete!`,
      type: 'general',
      relatedId: order._id
    });

    res.status(200).json({
      success: true,
      message: 'Order completed successfully and vehicle marked as sold.',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get buyer's orders
// @route   GET /api/orders/buyer
// @access  Private (Buyer only)
const getBuyerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate('sellerId', 'name email phone city state')
      .populate('vehicleId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Buyer orders retrieved successfully',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller's orders
// @route   GET /api/orders/seller
// @access  Private (Seller only)
const getSellerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ sellerId: req.user._id })
      .populate('buyerId', 'name email phone city state')
      .populate('vehicleId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Seller orders retrieved successfully',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name email phone city state')
      .populate('sellerId', 'name email phone city state')
      .populate('vehicleId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Ensure user is buyer, seller or admin
    const userIdStr = req.user._id.toString();
    const hasAccess = order.buyerId._id.toString() === userIdStr ||
                      order.sellerId._id.toString() === userIdStr ||
                      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view this order.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download Order PDF Invoice
// @route   GET /api/orders/:id/invoice
// @access  Private (Buyer, Seller or Admin)
const downloadInvoice = async (req, res, next) => {
  try {
    const { generateInvoice } = require('../utils/invoiceGenerator');

    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name email phone city state')
      .populate('sellerId', 'name email phone city state')
      .populate('vehicleId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const userIdStr = req.user._id.toString();
    const hasAccess =
      order.buyerId._id.toString() === userIdStr ||
      order.sellerId._id.toString() === userIdStr ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Forbidden. Permission denied.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order._id}.pdf`);

    generateInvoice(order, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  completeOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderById,
  downloadInvoice
};

