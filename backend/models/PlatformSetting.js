const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: 'Deals on Wheels',
      required: true
    },
    commissionPercentage: {
      type: Number,
      default: 1.0, // Default 1%
      min: [0, 'Commission cannot be negative'],
      max: [100, 'Commission cannot exceed 100%'],
      required: true
    },
    maxImageCount: {
      type: Number,
      default: 5,
      required: true
    },
    listingRules: {
      type: String,
      default: '1. All listings require a valid registration number. 2. Vehicle photos must show clear exterior. 3. Prices must be reasonable.',
      required: true
    },
    contactEmail: {
      type: String,
      default: 'support@dealsonwheels.com'
    },
    contactPhone: {
      type: String,
      default: '1800-123-4567'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);
