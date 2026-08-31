const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate favorite entries for the same buyer and vehicle
favoriteSchema.index({ buyerId: 1, vehicleId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
