const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Mock razorpay module in require cache before importing paymentController
const mockRazorpay = function() {
  return {
    orders: {
      create: async (opts) => ({ id: 'order_' + Math.random().toString(36).substring(2, 9), ...opts }),
      fetch: async (id) => ({ id, amount: 99999900, status: 'captured' })
    },
    payments: {
      fetch: async (id) => ({ id, amount: 99999900, status: 'captured' }),
      capture: async (id, amt) => ({ id, amount: amt, status: 'captured' })
    }
  };
};
require.cache[require.resolve('razorpay')] = {
  id: require.resolve('razorpay'),
  filename: require.resolve('razorpay'),
  loaded: true,
  exports: mockRazorpay
};

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const PlatformSetting = require('../models/PlatformSetting');
const Notification = require('../models/Notification');

const { createOrder } = require('../controllers/orderController');
const { createPayment, verifyPayment, handleWebhook } = require('../controllers/paymentController');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/deals_on_wheels';

const createMockReqRes = (body, user = null, headers = {}) => {
  const res = {
    statusCode: 200,
    jsonData: null,
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.jsonData = data;
      return this;
    }
  };
  const req = {
    body,
    user,
    headers
  };
  const next = (err) => {
    if (err) throw err;
  };
  return { req, res, next };
};

const runTest = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Setup platform setting
    const settingExists = await PlatformSetting.findOne();
    if (!settingExists) {
      await PlatformSetting.create({
        platformName: 'Deals on Wheels',
        commissionPercentage: 1.5,
        maxImageCount: 5,
        listingRules: 'Default rules.'
      });
    }

    // Clear existing data
    await User.deleteMany({ email: /test_buyer|test_seller|test_admin/i });
    await Vehicle.deleteMany({ title: 'Test Vehicle' });
    await Payment.deleteMany({});
    await Order.deleteMany({});
    await Commission.deleteMany({});
    await Notification.deleteMany({});

    // Create Users
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('Password123', salt);

    const admin = await User.create({
      name: 'Test Admin',
      email: 'test_admin@example.com',
      phone: '9999990000',
      password,
      role: 'admin',
      city: 'Test City',
      state: 'Test State'
    });

    const seller = await User.create({
      name: 'Test Seller',
      email: 'test_seller@example.com',
      phone: '9999990001',
      password,
      role: 'user',
      city: 'Test City',
      state: 'Test State'
    });

    const buyerA = await User.create({
      name: 'Buyer A',
      email: 'test_buyer_a@example.com',
      phone: '9999990002',
      password,
      role: 'user',
      city: 'Test City',
      state: 'Test State'
    });

    const buyerB = await User.create({
      name: 'Buyer B',
      email: 'test_buyer_b@example.com',
      phone: '9999990003',
      password,
      role: 'user',
      city: 'Test City',
      state: 'Test State'
    });

    const resetVehicle = async () => {
      await Vehicle.deleteMany({ title: 'Test Vehicle' });
      return await Vehicle.create({
        sellerId: seller._id,
        title: 'Test Vehicle',
        brand: 'Test Brand',
        model: 'Test Model',
        year: 2026,
        price: 999999,
        vehicleType: 'Car',
        fuelType: 'Petrol',
        transmission: 'Manual',
        kilometersDriven: 100,
        condition: 'New',
        description: 'Test vehicle listing',
        city: 'Test City',
        state: 'Test State',
        images: ['/uploads/test.png'],
        registrationNumber: 'TEST-001',
        status: 'available',
        approvalStatus: 'approved'
      });
    };

    const crypto = require('crypto');
    process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_concurrency_123';
    process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'concurrency_secret_key_1234';
    process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'concurrency_webhook_secret_5678';
    const secret = process.env.RAZORPAY_KEY_SECRET;

    console.log('\n==================================================');
    console.log('STARTING INTEGRATION TEST SUITE (10 SCENARIOS)');
    console.log('==================================================\n');

    // --------------------------------------------------
    // TEST 1: Normal Purchase Flow
    // --------------------------------------------------
    console.log('--- TEST 1: Normal Purchase Flow ---');
    let vehicle = await resetVehicle();

    // 1. Create order
    let ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerA);
    await createOrder(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 201) throw new Error(`Test 1 Order failed: ${ctx.res.statusCode}`);
    const orderId = ctx.res.jsonData.data._id;

    // 2. Create Payment
    ctx = createMockReqRes({ orderId }, buyerA);
    await createPayment(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 200) throw new Error(`Test 1 Payment failed: ${ctx.res.statusCode}`);
    const rzpOrderId = ctx.res.jsonData.data.payment.gatewayOrderId;

    // 3. Verify Payment
    const mockPaymentId = 'pay_normal_test';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(rzpOrderId + '|' + mockPaymentId)
      .digest('hex');

    ctx = createMockReqRes({
      gatewayOrderId: rzpOrderId,
      gatewayPaymentId: mockPaymentId,
      gatewaySignature: signature
    }, buyerA);
    await verifyPayment(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 200) throw new Error(`Test 1 Verify failed: ${ctx.res.statusCode}`);

    // Validate DB State
    const v1 = await Vehicle.findById(vehicle._id);
    const o1 = await Order.findById(orderId);
    const p1 = await Payment.findOne({ orderId });
    if (v1.status !== 'sold' || v1.reservedBy !== null) throw new Error('Test 1 vehicle status invalid');
    if (o1.status !== 'confirmed') throw new Error('Test 1 order status invalid');
    if (p1.status !== 'successful') throw new Error('Test 1 payment status invalid');
    console.log('TEST 1 PASSED');

    // --------------------------------------------------
    // TEST 2: Checkout Cancel & Retry (Same Buyer)
    // --------------------------------------------------
    console.log('\n--- TEST 2: Checkout Cancel & Retry ---');
    vehicle = await resetVehicle();

    // 1. Initiate order
    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerA);
    await createOrder(ctx.req, ctx.res, ctx.next);
    const o2Id = ctx.res.jsonData.data._id;

    // 2. Create payment (reserves vehicle)
    ctx = createMockReqRes({ orderId: o2Id }, buyerA);
    await createPayment(ctx.req, ctx.res, ctx.next);
    const rzpOrderId2 = ctx.res.jsonData.data.payment.gatewayOrderId;

    // 3. Simulate cancel by retrying (calling createOrder again)
    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerA);
    await createOrder(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 201 && ctx.res.statusCode !== 200) throw new Error('Test 2 Retry Order failed');

    // 4. Create payment again (should update/reuse)
    ctx = createMockReqRes({ orderId: o2Id }, buyerA);
    await createPayment(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 200) throw new Error('Test 2 Retry Payment failed');
    console.log('TEST 2 PASSED');

    // --------------------------------------------------
    // TEST 3: Checkout Failure & Retry
    // --------------------------------------------------
    console.log('\n--- TEST 3: Checkout Failure & Retry ---');
    vehicle = await resetVehicle();

    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerA);
    await createOrder(ctx.req, ctx.res, ctx.next);
    const o3Id = ctx.res.jsonData.data._id;

    ctx = createMockReqRes({ orderId: o3Id }, buyerA);
    await createPayment(ctx.req, ctx.res, ctx.next);
    const rzpOrderId3 = ctx.res.jsonData.data.payment.gatewayOrderId;

    // Trigger failure Webhook
    ctx = createMockReqRes({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            order_id: rzpOrderId3
          }
        }
      }
    });
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const payloadStr = JSON.stringify(ctx.req.body);
    const webhookSig = crypto.createHmac('sha256', webhookSecret).update(payloadStr).digest('hex');
    ctx.req.headers['x-razorpay-signature'] = webhookSig;
    ctx.req.rawBody = Buffer.from(payloadStr);

    await handleWebhook(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 200) {
      console.log(`Test 3 failure webhook error response: Status: ${ctx.res.statusCode}, Body: ${JSON.stringify(ctx.res.jsonData)}`);
      throw new Error('Test 3 failure webhook failed');
    }

    // Validate released
    const v3 = await Vehicle.findById(vehicle._id);
    if (v3.status !== 'available') throw new Error('Test 3 vehicle did not release');
    console.log('TEST 3 PASSED');

    // --------------------------------------------------
    // TEST 4: Active Lock Protection (different buyer)
    // --------------------------------------------------
    console.log('\n--- TEST 4: Active Lock Protection ---');
    vehicle = await resetVehicle();

    // Buyer A reserves
    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerA);
    await createOrder(ctx.req, ctx.res, ctx.next);
    const o4Id = ctx.res.jsonData.data._id;

    ctx = createMockReqRes({ orderId: o4Id }, buyerA);
    await createPayment(ctx.req, ctx.res, ctx.next);

    // Buyer B attempts purchase
    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerB);
    await createOrder(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 400 || ctx.res.jsonData.message !== 'This vehicle is no longer available.') {
      throw new Error(`Test 4 Buyer B allowed incorrectly: ${ctx.res.statusCode} ${JSON.stringify(ctx.res.jsonData)}`);
    }
    console.log('TEST 4 PASSED');

    // --------------------------------------------------
    // TEST 5: Expired Lock Release
    // --------------------------------------------------
    console.log('\n--- TEST 5: Expired Lock Release ---');
    vehicle = await resetVehicle();

    // Buyer A reserves
    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerA);
    await createOrder(ctx.req, ctx.res, ctx.next);
    const o5Id = ctx.res.jsonData.data._id;

    ctx = createMockReqRes({ orderId: o5Id }, buyerA);
    await createPayment(ctx.req, ctx.res, ctx.next);

    // Expire reservation artificially in DB
    await Vehicle.findByIdAndUpdate(vehicle._id, {
      reservationExpiresAt: new Date(Date.now() - 1000) // 1s ago
    });

    // Buyer B attempts purchase (should succeed because lock is expired)
    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerB);
    await createOrder(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 201) throw new Error('Test 5 Buyer B rejected on expired lock');
    console.log('TEST 5 PASSED');

    // --------------------------------------------------
    // TEST 6: Idempotent Success Verify Call
    // --------------------------------------------------
    console.log('\n--- TEST 6: Idempotent Success Verify Call ---');
    vehicle = await resetVehicle();

    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerA);
    await createOrder(ctx.req, ctx.res, ctx.next);
    const o6Id = ctx.res.jsonData.data._id;

    ctx = createMockReqRes({ orderId: o6Id }, buyerA);
    await createPayment(ctx.req, ctx.res, ctx.next);
    const rzpOrderId6 = ctx.res.jsonData.data.payment.gatewayOrderId;

    const mockPaymentId6 = 'pay_idempotent_test';
    const sig6 = crypto
      .createHmac('sha256', secret)
      .update(rzpOrderId6 + '|' + mockPaymentId6)
      .digest('hex');

    // First call
    ctx = createMockReqRes({
      gatewayOrderId: rzpOrderId6,
      gatewayPaymentId: mockPaymentId6,
      gatewaySignature: sig6
    }, buyerA);
    await verifyPayment(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 200) throw new Error('Test 6 first call failed');

    // Second duplicate call
    ctx = createMockReqRes({
      gatewayOrderId: rzpOrderId6,
      gatewayPaymentId: mockPaymentId6,
      gatewaySignature: sig6
    }, buyerA);
    await verifyPayment(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 200) throw new Error('Test 6 duplicate call failed');
    console.log('TEST 6 PASSED');

    // --------------------------------------------------
    // TEST 7: Invalid Signature Guard
    // --------------------------------------------------
    console.log('\n--- TEST 7: Invalid Signature Guard ---');
    vehicle = await resetVehicle();

    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerA);
    await createOrder(ctx.req, ctx.res, ctx.next);
    const o7Id = ctx.res.jsonData.data._id;

    ctx = createMockReqRes({ orderId: o7Id }, buyerA);
    await createPayment(ctx.req, ctx.res, ctx.next);
    const rzpOrderId7 = ctx.res.jsonData.data.payment.gatewayOrderId;

    // Bad signature
    ctx = createMockReqRes({
      gatewayOrderId: rzpOrderId7,
      gatewayPaymentId: 'pay_bad_sig',
      gatewaySignature: 'bad_signature_value'
    }, buyerA);
    await verifyPayment(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 400) throw new Error('Test 7 bad signature allowed');
    console.log('TEST 7 PASSED');

    // --------------------------------------------------
    // TEST 8: Frontend Amount Tampering Protection
    // --------------------------------------------------
    console.log('\n--- TEST 8: Frontend Amount Tampering Protection ---');
    vehicle = await resetVehicle();

    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerA);
    await createOrder(ctx.req, ctx.res, ctx.next);
    const o8Id = ctx.res.jsonData.data._id;

    // Force manipulate req body with bad amount (it should be ignored as backend retrieves price from order db)
    ctx = createMockReqRes({ orderId: o8Id, amount: 100 }, buyerA);
    await createPayment(ctx.req, ctx.res, ctx.next);
    
    const finalPayment = ctx.res.jsonData.data.payment;
    if (finalPayment.amount !== 999999) {
      throw new Error(`Test 8 amount tampered! Expected 999999, got ${finalPayment.amount}`);
    }
    console.log('TEST 8 PASSED');

    // --------------------------------------------------
    // TEST 9: Concurrent Race Condition (Simultaneous checkout)
    // --------------------------------------------------
    console.log('\n--- TEST 9: Concurrent Race Condition ---');
    vehicle = await resetVehicle();

    const orderRaceA = await Order.create({
      buyerId: buyerA._id,
      sellerId: seller._id,
      vehicleId: vehicle._id,
      amount: vehicle.price,
      status: 'payment_pending'
    });

    const orderRaceB = await Order.create({
      buyerId: buyerB._id,
      sellerId: seller._id,
      vehicleId: vehicle._id,
      amount: vehicle.price,
      status: 'payment_pending'
    });

    const ctxRaceA = createMockReqRes({ orderId: orderRaceA._id }, buyerA);
    const ctxRaceB = createMockReqRes({ orderId: orderRaceB._id }, buyerB);

    // Fire concurrently
    await Promise.all([
      createPayment(ctxRaceA.req, ctxRaceA.res, ctxRaceA.next),
      createPayment(ctxRaceB.req, ctxRaceB.res, ctxRaceB.next)
    ]);

    const codeA = ctxRaceA.res.statusCode;
    const codeB = ctxRaceB.res.statusCode;

    console.log(`Concurrent results -> Buyer A: ${codeA}, Buyer B: ${codeB}`);
    const successCount = (codeA === 200 ? 1 : 0) + (codeB === 200 ? 1 : 0);
    const conflictCount = (codeA === 409 ? 1 : 0) + (codeB === 409 ? 1 : 0);

    if (successCount !== 1 || conflictCount !== 1) {
      throw new Error(`Race condition validation failed. Success: ${successCount}, Conflicts: ${conflictCount}`);
    }
    console.log('TEST 9 PASSED');

    // --------------------------------------------------
    // TEST 10: Webhook Failure & Success Reconciliation
    // --------------------------------------------------
    console.log('\n--- TEST 10: Webhook Failure & Success Reconciliation ---');
    vehicle = await resetVehicle();

    ctx = createMockReqRes({ vehicleId: vehicle._id }, buyerA);
    await createOrder(ctx.req, ctx.res, ctx.next);
    const o10Id = ctx.res.jsonData.data._id;

    ctx = createMockReqRes({ orderId: o10Id }, buyerA);
    await createPayment(ctx.req, ctx.res, ctx.next);
    const rzpOrderId10 = ctx.res.jsonData.data.payment.gatewayOrderId;

    // Simulate successful webhook (payment.captured)
    const mockPaymentId10 = 'pay_webhook_reconciliation';
    ctx = createMockReqRes({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: mockPaymentId10,
            order_id: rzpOrderId10,
            amount: 99999900
          }
        }
      }
    });

    const payloadStr10 = JSON.stringify(ctx.req.body);
    const webhookSig10 = crypto.createHmac('sha256', webhookSecret).update(payloadStr10).digest('hex');
    ctx.req.headers['x-razorpay-signature'] = webhookSig10;
    ctx.req.rawBody = Buffer.from(payloadStr10);

    await handleWebhook(ctx.req, ctx.res, ctx.next);
    if (ctx.res.statusCode !== 200) throw new Error('Test 10 webhook capture failed');

    // Validate sold
    const v10 = await Vehicle.findById(vehicle._id);
    const o10 = await Order.findById(o10Id);
    if (v10.status !== 'sold') throw new Error('Test 10 vehicle not sold');
    if (o10.status !== 'confirmed') throw new Error('Test 10 order not confirmed');
    console.log('TEST 10 PASSED');

    console.log('\n==================================================');
    console.log('ALL 10 PAYMENT & CONCURRENCY TEST CASES PASSED!');
    console.log('==================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Test Suite Failed with error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTest();
