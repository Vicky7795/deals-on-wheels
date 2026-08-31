const Inquiry = require('../models/Inquiry');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');

// @desc    Create new inquiry for a vehicle
// @route   POST /api/inquiries
// @access  Private (Buyer only)
const createInquiry = async (req, res, next) => {
  try {
    const { vehicleId, message } = req.body;
    const buyerId = req.user._id;

    if (!vehicleId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both vehicle ID and inquiry message.'
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.'
      });
    }

    // Prevent user from sending inquiry to themselves
    if (vehicle.sellerId.toString() === buyerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send an inquiry for your own vehicle listing.'
      });
    }

    const inquiry = await Inquiry.create({
      buyerId,
      sellerId: vehicle.sellerId,
      vehicleId,
      message,
      status: 'pending',
      messages: [{ senderId: buyerId, text: message }]
    });

    // Notify seller
    await Notification.create({
      userId: vehicle.sellerId,
      message: `${req.user.name} sent an inquiry for your listing "${vehicle.title}"`,
      type: 'inquiry',
      relatedId: inquiry._id
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry sent successfully to the seller.',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get buyer's inquiries
// @route   GET /api/inquiries/buyer
// @access  Private (Buyer only)
const getBuyerInquiries = async (req, res, next) => {
  try {
    const inquiries = await Inquiry.find({ buyerId: req.user._id })
      .populate('sellerId', 'name email phone city state')
      .populate('vehicleId', 'title images price brand model status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Buyer inquiries retrieved successfully',
      data: inquiries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller's inquiries
// @route   GET /api/inquiries/seller
// @access  Private (Seller only)
const getSellerInquiries = async (req, res, next) => {
  try {
    const inquiries = await Inquiry.find({ sellerId: req.user._id })
      .populate('buyerId', 'name email phone city state')
      .populate('vehicleId', 'title images price brand model status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Seller inquiries retrieved successfully',
      data: inquiries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to an inquiry
// @route   POST /api/inquiries/:id/respond
// @access  Private (Seller only)
const respondInquiry = async (req, res, next) => {
  try {
    const { response } = req.body;
    const inquiryId = req.params.id;

    if (!response || !response.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Response message cannot be empty.'
      });
    }

    const inquiry = await Inquiry.findById(inquiryId).populate('vehicleId', 'title');
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    if (inquiry.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only respond to inquiries for your own listings.'
      });
    }

    inquiry.response = response;
    inquiry.status = 'responded';
    inquiry.messages.push({ senderId: req.user._id, text: response });
    await inquiry.save();

    // Notify buyer
    await Notification.create({
      userId: inquiry.buyerId,
      message: `Seller responded to your inquiry regarding "${inquiry.vehicleId ? inquiry.vehicleId.title : 'vehicle'}"`,
      type: 'inquiry_response',
      relatedId: inquiry._id
    });

    res.status(200).json({
      success: true,
      message: 'Response sent successfully.',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close an inquiry
// @route   PATCH /api/inquiries/:id/close
// @access  Private
const closeInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    // Must be buyer or seller of inquiry
    const userIdStr = req.user._id.toString();
    if (inquiry.buyerId.toString() !== userIdStr && inquiry.sellerId.toString() !== userIdStr) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to close this inquiry.'
      });
    }

    inquiry.status = 'closed';
    await inquiry.save();

    res.status(200).json({
      success: true,
      message: 'Inquiry closed successfully.',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to an inquiry (either buyer or seller)
// @route   POST /api/inquiries/:id/reply
// @access  Private
const replyInquiry = async (req, res, next) => {
  try {
    const { text } = req.body;
    const inquiryId = req.params.id;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply message cannot be empty.'
      });
    }

    const inquiry = await Inquiry.findById(inquiryId).populate('vehicleId', 'title');
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    const isBuyer = inquiry.buyerId.toString() === req.user._id.toString();
    const isSeller = inquiry.sellerId.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not a participant in this inquiry.'
      });
    }

    // Append to messages list
    inquiry.messages.push({
      senderId: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    });

    // Sync root fields based on sender
    if (isSeller) {
      inquiry.status = 'responded';
      inquiry.response = text.trim();
      
      // Notify buyer
      await Notification.create({
        userId: inquiry.buyerId,
        message: `${req.user.name} (Seller) replied to your inquiry on "${inquiry.vehicleId ? inquiry.vehicleId.title : 'vehicle'}"`,
        type: 'inquiry_response',
        relatedId: inquiry._id
      });
    } else {
      inquiry.status = 'pending';
      inquiry.message = text.trim();

      // Notify seller
      await Notification.create({
        userId: inquiry.sellerId,
        message: `${req.user.name} (Buyer) replied to your inquiry on "${inquiry.vehicleId ? inquiry.vehicleId.title : 'vehicle'}"`,
        type: 'inquiry',
        relatedId: inquiry._id
      });
    }

    await inquiry.save();

    // Re-populate and return clean object
    const updatedInquiry = await Inquiry.findById(inquiryId)
      .populate('buyerId', 'name email phone city state')
      .populate('sellerId', 'name email phone city state')
      .populate('vehicleId', 'title images price brand model status');

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully.',
      data: updatedInquiry
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInquiry,
  getBuyerInquiries,
  getSellerInquiries,
  respondInquiry,
  closeInquiry,
  replyInquiry
};
