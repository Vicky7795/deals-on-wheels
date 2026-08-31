const Report = require('../models/Report');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Private (Buyer or Seller)
const submitReport = async (req, res, next) => {
  try {
    const { reportedUserId, vehicleId, reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Reason and description are required for reporting.'
      });
    }

    // Optional validations
    if (reportedUserId) {
      const userExists = await User.findById(reportedUserId);
      if (!userExists) {
        return res.status(404).json({ success: false, message: 'Reported user not found' });
      }
    }

    if (vehicleId) {
      const vehicleExists = await Vehicle.findById(vehicleId);
      if (!vehicleExists) {
        return res.status(404).json({ success: false, message: 'Reported vehicle not found' });
      }
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reportedUserId,
      vehicleId,
      reason,
      description,
      status: 'pending'
    });

    // Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        message: `New report submitted by ${req.user.name}: "${reason}"`,
        type: 'general',
        relatedId: report._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. The platform administrator will review it shortly.',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitReport
};
