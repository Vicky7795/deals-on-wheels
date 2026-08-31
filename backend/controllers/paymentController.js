const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Vehicle = require('../models/Vehicle');
const PlatformSetting = require('../models/PlatformSetting');
const Commission = require('../models/Commission');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Initialize Razorpay SDK instance using environment credentials.
 * Throws an explicit error if keys are not configured.
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    const error = new Error('Razorpay credentials missing. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.');
    error.statusCode = 500;
    throw error;
  }

  return new Razorpay({
    key_id,
    key_secret
  });
};

// @desc    Create a payment transaction / Real Razorpay Order
// @route   POST /api/payments/create
// @access  Private (Buyer Only)
const createPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('vehicleId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to pay for this order' });
    }

    // Automatically release expired vehicle reservations
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

    // Fetch the vehicle from DB (source of truth)
    const vehicle = await Vehicle.findById(order.vehicleId._id || order.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle listing not found' });
    }

    if (vehicle.approvalStatus !== 'approved') {
      return res.status(400).json({ success: false, message: 'This vehicle is awaiting verification approval' });
    }

    if (vehicle.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot purchase your own vehicle listing' });
    }

    // Atomic vehicle reservation check & update (prevents concurrent race conditions)
    const reservedVehicle = await Vehicle.findOneAndUpdate(
      {
        _id: vehicle._id,
        approvalStatus: 'approved',
        sellerId: { $ne: req.user._id },
        $or: [
          { status: 'available' },
          { status: 'reserved', reservedBy: req.user._id }
        ]
      },
      {
        $set: {
          status: 'reserved',
          reservedBy: req.user._id,
          reservationExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry window
        }
      },
      { new: true }
    );

    if (!reservedVehicle) {
      return res.status(409).json({ success: false, message: 'This vehicle is currently reserved or no longer available' });
    }

    // Reuse existing retryable payment or create a real Razorpay order via Razorpay SDK
    let payment = await Payment.findOne({ orderId, status: { $in: ['pending', 'authorized'] } });

    if (!payment) {
      const razorpay = getRazorpayInstance();
      const amountInPaise = Math.round(order.amount * 100);

      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order._id.toString(),
        notes: {
          orderId: order._id.toString(),
          vehicleId: vehicle._id.toString(),
          buyerId: req.user._id.toString()
        }
      });

      payment = await Payment.create({
        orderId: order._id,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        vehicleId: vehicle._id,
        amount: order.amount,
        currency: 'INR',
        gateway: 'razorpay',
        gatewayOrderId: razorpayOrder.id,
        status: 'pending'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment checkout initiated',
      data: {
        payment,
        key: process.env.RAZORPAY_KEY_ID,
        order_id: payment.gatewayOrderId,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        vehicleTitle: vehicle.title
      }
    });
  } catch (error) {
    if (error.statusCode === 401 || error.message.includes('Unauthorized') || error.message.includes('API key') || error.message.includes('auth')) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay authentication failed. Please configure valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.'
      });
    }
    next(error);
  }
};

// @desc    Verify real Razorpay payment signature & status
// @route   POST /api/payments/verify
// @access  Private (Buyer Only)
const verifyPayment = async (req, res, next) => {
  try {
    const { gatewayOrderId, gatewayPaymentId, gatewaySignature } = req.body;

    if (!gatewayOrderId || !gatewayPaymentId || !gatewaySignature) {
      return res.status(400).json({ success: false, message: 'Payment gateway order ID, payment ID, and signature are required' });
    }

    // 1. Idempotency Check by gatewayPaymentId
    const existingPayment = await Payment.findOne({ gatewayPaymentId, status: 'successful' });
    if (existingPayment) {
      const confirmedOrder = await Order.findOne({ paymentId: existingPayment._id })
        .populate('buyerId', 'name email phone city state')
        .populate('sellerId', 'name email phone city state')
        .populate('vehicleId');
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        data: {
          payment: existingPayment,
          order: confirmedOrder
        }
      });
    }

    // Fetch payment record by gatewayOrderId
    const payment = await Payment.findOne({ gatewayOrderId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found for this gateway order' });
    }

    // Idempotency check on existing record
    if (payment.status === 'successful') {
      const confirmedOrder = await Order.findOne({ paymentId: payment._id })
        .populate('buyerId', 'name email phone city state')
        .populate('sellerId', 'name email phone city state')
        .populate('vehicleId');
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        data: {
          payment,
          order: confirmedOrder
        }
      });
    }

    if (payment.status === 'failed' || payment.status === 'refunded' || payment.status === 'refund_required') {
      return res.status(400).json({
        success: false,
        message: `Payment has already been processed with status: ${payment.status}`
      });
    }

    // Fetch associated internal order
    const order = await Order.findById(payment.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Associated order not found' });
    }

    if (order.status !== 'payment_pending') {
      return res.status(400).json({
        success: false,
        message: `Associated order is not pending payment (current status: ${order.status})`
      });
    }

    // 2. Server-side Cryptographic Signature Verification
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay secret key is not configured on the server.'
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== gatewaySignature) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ success: false, message: 'Invalid payment signature. Verification failed.' });
    }

    // 3. Verify Payment details directly with Razorpay API (anti-tampering check)
    const razorpay = getRazorpayInstance();
    const rzpPayment = await razorpay.payments.fetch(gatewayPaymentId);
    if (!rzpPayment || (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized')) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ success: false, message: `Razorpay payment is in an invalid state: ${rzpPayment ? rzpPayment.status : 'unknown'}` });
    }

    // Validate paid amount in paise matches expected amount in paise
    const expectedAmountInPaise = Math.round(payment.amount * 100);
    if (rzpPayment.amount !== expectedAmountInPaise) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ success: false, message: 'Payment amount mismatch verification error.' });
    }

    // If status is authorized but not captured, trigger server-side capture
    if (rzpPayment.status === 'authorized') {
      await razorpay.payments.capture(gatewayPaymentId, expectedAmountInPaise, 'INR');
    }

    // Mark payment as successful
    payment.gatewayPaymentId = gatewayPaymentId;
    payment.status = 'successful';
    payment.paidAt = new Date();
    await payment.save();

    // 4. Mark Vehicle as Sold and clear reservation
    const vehicle = await Vehicle.findOneAndUpdate(
      {
        _id: payment.vehicleId,
        status: 'reserved',
        reservedBy: req.user._id
      },
      {
        $set: { status: 'sold' },
        $unset: { reservedBy: 1, reservationExpiresAt: 1 }
      },
      { new: true }
    );

    if (!vehicle) {
      payment.status = 'refund_required';
      await payment.save();

      order.status = 'cancelled';
      await order.save();

      await Notification.create({
        userId: order.buyerId,
        message: 'Your payment was successful, but the vehicle reservation has expired or is no longer available. A refund has been requested.',
        type: 'general'
      });

      return res.status(409).json({
        success: false,
        message: 'This vehicle reservation has expired and is no longer available. A refund has been initiated.'
      });
    }

    // 5. Calculate platform commission server-side
    const settings = (await PlatformSetting.findOne()) || { commissionPercentage: 1.0 };
    const commissionPercent = settings.commissionPercentage;
    const commissionAmount = Math.round((order.amount * commissionPercent) / 100);
    const sellerAmount = order.amount - commissionAmount;

    // 6. Confirm Order
    order.status = 'confirmed';
    order.paymentId = payment._id;
    order.platformFee = commissionAmount;
    order.sellerAmount = sellerAmount;
    await order.save();

    // 7. Create Commission Record
    const commission = await Commission.create({
      orderId: order._id,
      sellerId: order.sellerId,
      vehicleId: vehicle._id,
      saleAmount: order.amount,
      commissionPercentage: commissionPercent,
      commissionAmount,
      sellerAmount,
      status: 'pending'
    });

    // 8. Create Notifications
    await Notification.create({
      userId: order.buyerId,
      message: `Payment of ₹${order.amount.toLocaleString('en-IN')} successful! Your order for ${vehicle.title} is confirmed.`,
      type: 'order_confirmation',
      relatedId: order._id
    });

    await Notification.create({
      userId: order.sellerId,
      message: `Your listing "${vehicle.title}" has been purchased! Order value: ₹${order.amount.toLocaleString('en-IN')}. Payout details updated in your dashboard.`,
      type: 'purchase',
      relatedId: order._id
    });

    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      await Notification.create({
        userId: adminUser._id,
        message: `New order completed on platform! Order ID: ${order._id}, Commission earned: ₹${commissionAmount.toLocaleString('en-IN')}`,
        type: 'general',
        relatedId: order._id
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('buyerId', 'name email phone city state')
      .populate('sellerId', 'name email phone city state')
      .populate('vehicleId');

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully and order confirmed!',
      data: {
        payment,
        order: populatedOrder,
        commission
      }
    });
  } catch (error) {
    if (error.statusCode === 401 || error.message.includes('Unauthorized') || error.message.includes('API key') || error.message.includes('auth')) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay authentication failed during verification. Please configure valid credentials in backend/.env.'
      });
    }
    next(error);
  }
};

// @desc    Razorpay Webhook Handler
// @route   POST /api/payments/razorpay/webhook
// @access  Public
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ success: false, message: 'Webhook signature or secret missing' });
    }

    // Verify webhook signature using raw body buffer
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const payload = req.body;
    const event = payload.event;
    console.log(`Razorpay Webhook event received: ${event}`);

    // Handle payment.captured event
    if (event === 'payment.captured') {
      const paymentData = payload.payload.payment.entity;
      const gatewayPaymentId = paymentData.id;
      const gatewayOrderId = paymentData.order_id;
      const rzpAmount = paymentData.amount; // in paise

      // Idempotency check
      const existingPayment = await Payment.findOne({ gatewayPaymentId, status: 'successful' });
      if (existingPayment) {
        return res.status(200).json({ success: true, message: 'Event already processed' });
      }

      const payment = await Payment.findOne({ gatewayOrderId });
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      if (payment.status === 'successful') {
        return res.status(200).json({ success: true, message: 'Payment already completed' });
      }

      if (rzpAmount !== Math.round(payment.amount * 100)) {
        return res.status(400).json({ success: false, message: 'Amount mismatch' });
      }

      const order = await Order.findById(payment.orderId);
      if (!order || order.status !== 'payment_pending') {
        return res.status(400).json({ success: false, message: 'Associated order status invalid' });
      }

      // Mark payment successful
      payment.gatewayPaymentId = gatewayPaymentId;
      payment.status = 'successful';
      payment.paidAt = new Date();
      await payment.save();

      // Mark vehicle as sold
      const vehicle = await Vehicle.findOneAndUpdate(
        {
          _id: payment.vehicleId,
          status: 'reserved',
          reservedBy: payment.buyerId
        },
        {
          $set: { status: 'sold' },
          $unset: { reservedBy: 1, reservationExpiresAt: 1 }
        },
        { new: true }
      );

      if (!vehicle) {
        payment.status = 'refund_required';
        await payment.save();

        order.status = 'cancelled';
        await order.save();

        await Notification.create({
          userId: order.buyerId,
          message: 'Your payment was successful, but the vehicle reservation has expired or is no longer available. A refund has been requested.',
          type: 'general'
        });
        return res.status(200).json({ success: true, message: 'Vehicle unavailable, refund required' });
      }

      // Calculate platform commission
      const settings = (await PlatformSetting.findOne()) || { commissionPercentage: 1.0 };
      const commissionPercent = settings.commissionPercentage;
      const commissionAmount = Math.round((order.amount * commissionPercent) / 100);
      const sellerAmount = order.amount - commissionAmount;

      order.status = 'confirmed';
      order.paymentId = payment._id;
      order.platformFee = commissionAmount;
      order.sellerAmount = sellerAmount;
      await order.save();

      await Commission.create({
        orderId: order._id,
        sellerId: order.sellerId,
        vehicleId: vehicle._id,
        saleAmount: order.amount,
        commissionPercentage: commissionPercent,
        commissionAmount,
        sellerAmount,
        status: 'pending'
      });

      // Notifications
      await Notification.create({
        userId: order.buyerId,
        message: `Payment of ₹${order.amount.toLocaleString('en-IN')} successful! Your order for ${vehicle.title} is confirmed.`,
        type: 'order_confirmation',
        relatedId: order._id
      });

      await Notification.create({
        userId: order.sellerId,
        message: `Your listing "${vehicle.title}" has been purchased! Order value: ₹${order.amount.toLocaleString('en-IN')}. Payout details updated in your dashboard.`,
        type: 'purchase',
        relatedId: order._id
      });
    }

    // Handle payment.failed event
    if (event === 'payment.failed') {
      const paymentData = payload.payload.payment.entity;
      const gatewayOrderId = paymentData.order_id;

      const payment = await Payment.findOne({ gatewayOrderId });
      if (payment && payment.status === 'pending') {
        payment.status = 'failed';
        await payment.save();

        const order = await Order.findById(payment.orderId);
        if (order) {
          order.status = 'cancelled';
          await order.save();
        }

        // Release vehicle reservation
        await Vehicle.findOneAndUpdate(
          { _id: payment.vehicleId, reservedBy: payment.buyerId },
          { $set: { status: 'available' }, $unset: { reservedBy: 1, reservationExpiresAt: 1 } }
        );
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('buyerId', 'name email phone')
      .populate('sellerId', 'name email phone')
      .populate('vehicleId', 'title brand model price');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const isOwner =
      payment.buyerId._id.toString() === req.user._id.toString() ||
      payment.sellerId._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this payment' });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  handleWebhook,
  getPaymentById
};
