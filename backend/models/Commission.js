const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
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
    saleAmount: {
      type: Number,
      required: true
    },
    commissionPercentage: {
      type: Number,
      required: true
    },
    commissionAmount: {
      type: Number,
      required: true
    },
    sellerAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'refunded'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

commissionSchema.index({ orderId: 1 });
commissionSchema.index({ sellerId: 1 });
commissionSchema.index({ status: 1 });

module.exports = mongoose.model('Commission', commissionSchema);
