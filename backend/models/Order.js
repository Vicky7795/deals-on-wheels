const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
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
    platformFee: {
      type: Number,
      required: true,
      default: 0
    },
    sellerAmount: {
      type: Number,
      required: true,
      default: 0
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    status: {
      type: String,
      enum: ['payment_pending', 'confirmed', 'reserved', 'completed', 'cancelled', 'refunded'],
      default: 'payment_pending'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate active orders for the same vehicle
orderSchema.index({ vehicleId: 1 });
orderSchema.index({ buyerId: 1 });
orderSchema.index({ sellerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
