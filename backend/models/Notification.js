const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: [
        'inquiry',
        'inquiry_response',
        'purchase',
        'vehicle_sold',
        'order_confirmation',
        'general',
        'vehicle_approved',
        'vehicle_rejected',
        'payout_processed',
        'refund',
        'order_update'
      ],
      default: 'general'
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ userId: 1, isRead: 1 });

notificationSchema.post('save', function (doc) {
  try {
    const { emitNotificationToUser } = require('../config/socket');
    emitNotificationToUser(doc.userId, doc);
  } catch (err) {
    // Ignore if socket server not initialized during tests
  }
});

module.exports = mongoose.model('Notification', notificationSchema);

