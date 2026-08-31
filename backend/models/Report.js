const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Report description is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'rejected'],
      default: 'pending'
    },
    adminNote: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

reportSchema.index({ reporterId: 1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', reportSchema);
