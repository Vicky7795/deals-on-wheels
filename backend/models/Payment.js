const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    gateway: {
      type: String,
      default: 'mock_gateway'
    },
    gatewayOrderId: {
      type: String,
      required: true
    },
    gatewayPaymentId: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed', 'refunded', 'refund_required'],
      default: 'pending'
    },
    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ gatewayOrderId: 1 }, { unique: true });
paymentSchema.index({ gatewayPaymentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
