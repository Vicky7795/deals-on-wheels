const mongoose = require('mongoose');

const vehicleVerificationSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      unique: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registrationCheck: {
      status: { type: String, enum: ['passed', 'warning', 'failed'], default: 'passed' },
      details: { type: String, default: '' }
    },
    duplicateCheck: {
      status: { type: String, enum: ['passed', 'warning', 'failed'], default: 'passed' },
      details: { type: String, default: '' }
    },
    documentCheck: {
      status: { type: String, enum: ['passed', 'warning', 'failed'], default: 'passed' },
      details: { type: String, default: '' }
    },
    dataMatchCheck: {
      status: { type: String, enum: ['passed', 'warning', 'failed'], default: 'passed' },
      details: { type: String, default: '' }
    },
    imageCheck: {
      status: { type: String, enum: ['passed', 'warning', 'failed'], default: 'passed' },
      details: { type: String, default: '' }
    },
    sellerHistoryCheck: {
      status: { type: String, enum: ['passed', 'warning', 'failed'], default: 'passed' },
      details: { type: String, default: '' }
    },
    reportCheck: {
      status: { type: String, enum: ['passed', 'warning', 'failed'], default: 'passed' },
      details: { type: String, default: '' }
    },
    riskScore: {
      type: Number,
      required: true,
      default: 0
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'documents_required', 'verified', 'rejected'],
      default: 'pending'
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    adminNote: {
      type: String,
      default: ''
    },
    rejectionReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

vehicleVerificationSchema.index({ sellerId: 1 });
vehicleVerificationSchema.index({ status: 1 });

module.exports = mongoose.model('VehicleVerification', vehicleVerificationSchema);
