const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Vehicle title is required'],
      trim: true
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true
    },
    variant: {
      type: String,
      trim: true,
      default: ''
    },
    year: {
      type: Number,
      required: [true, 'Manufacturing year is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number']
    },
    vehicleType: {
      type: String,
      enum: ['Car', 'Bike', 'SUV', 'Electric Vehicle', 'Commercial Vehicle'],
      required: [true, 'Vehicle type is required']
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'],
      required: [true, 'Fuel type is required']
    },
    transmission: {
      type: String,
      enum: ['Manual', 'Automatic'],
      required: [true, 'Transmission type is required']
    },
    kilometersDriven: {
      type: Number,
      required: [true, 'Kilometers driven is required'],
      min: [0, 'Kilometers driven cannot be negative']
    },
    condition: {
      type: String,
      enum: ['New', 'Used'],
      required: [true, 'Condition is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    images: {
      type: [String],
      required: [true, 'At least one vehicle image is required'],
      validate: [val => val.length > 0, 'At least one vehicle image is required']
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'sold'],
      default: 'available'
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false
    },
    vinNumber: {
      type: String,
      default: ''
    },
    rcDocument: {
      type: String,
      default: ''
    },
    insuranceDocument: {
      type: String,
      default: ''
    },
    pucDocument: {
      type: String,
      default: ''
    },
    additionalDocument: {
      type: String,
      default: ''
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reservationExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Database Indexing for performant search
vehicleSchema.index({ brand: 1 });
vehicleSchema.index({ model: 1 });
vehicleSchema.index({ vehicleType: 1 });
vehicleSchema.index({ price: 1 });
vehicleSchema.index({ city: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ approvalStatus: 1 });
vehicleSchema.index({ categoryId: 1 });
vehicleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
