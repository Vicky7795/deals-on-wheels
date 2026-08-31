const Favorite = require('../models/Favorite');
const Vehicle = require('../models/Vehicle');

// @desc    Add vehicle to buyer favorites
// @route   POST /api/favorites/:vehicleId
// @access  Private (Buyer only)
const addFavorite = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const buyerId = req.user._id;

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.'
      });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({ buyerId, vehicleId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This vehicle is already in your favorites.'
      });
    }

    const favorite = await Favorite.create({ buyerId, vehicleId });

    res.status(201).json({
      success: true,
      message: 'Vehicle added to favorites.',
      data: favorite
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove vehicle from buyer favorites
// @route   DELETE /api/favorites/:vehicleId
// @access  Private (Buyer only)
const removeFavorite = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const buyerId = req.user._id;

    const result = await Favorite.findOneAndDelete({ buyerId, vehicleId });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Favorite record not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle removed from favorites.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in buyer's favorite vehicles
// @route   GET /api/favorites
// @access  Private (Buyer only)
const getBuyerFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ buyerId: req.user._id })
      .populate({
        path: 'vehicleId',
        populate: { path: 'sellerId', select: 'name city state' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Favorites retrieved successfully',
      data: favorites
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getBuyerFavorites
};
