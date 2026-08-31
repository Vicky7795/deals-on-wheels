const Vehicle = require('../models/Vehicle');
const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const User = require('../models/User');
const VehicleVerification = require('../models/VehicleVerification');
const verificationService = require('../utils/verificationService');

// @desc    Get all vehicles with search, filters, sorting & pagination
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res, next) => {
  try {
    // Automatically release expired reservations
    await Vehicle.updateMany(
      {
        status: 'reserved',
        $or: [
          { reservationExpiresAt: { $lt: new Date() } },
          { reservedBy: null },
          { reservationExpiresAt: null }
        ]
      },
      {
        $set: { status: 'available', reservedBy: null, reservationExpiresAt: null }
      }
    );

    const {
      search,
      vehicleType,
      brand,
      minPrice,
      maxPrice,
      fuelType,
      transmission,
      year,
      condition,
      city,
      status,
      sort,
      page = 1,
      limit = 9
    } = req.query;

    const query = {
      approvalStatus: 'approved'
    };

    // By default, public browse shows available vehicles unless specified
    if (status) {
      query.status = status;
    } else {
      query.status = 'available';
    }

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (fuelType) {
      query.fuelType = fuelType;
    }

    if (transmission) {
      query.transmission = transmission;
    }

    if (condition) {
      query.condition = condition;
    }

    if (year) {
      query.year = Number(year);
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { brand: searchRegex },
        { model: searchRegex },
        { city: searchRegex }
      ];
    }

    // Sort order
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .populate('sellerId', 'name city state createdAt')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle details
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res, next) => {
  try {
    // Automatically release reservation if expired
    await Vehicle.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'reserved',
        $or: [
          { reservationExpiresAt: { $lt: new Date() } },
          { reservedBy: null },
          { reservationExpiresAt: null }
        ]
      },
      {
        $set: { status: 'available', reservedBy: null, reservationExpiresAt: null }
      }
    );

    const vehicle = await Vehicle.findById(req.params.id).populate(
      'sellerId',
      'name email phone city state profileImage createdAt'
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle listing not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle details retrieved successfully',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new vehicle listing
// @route   POST /api/vehicles
// @access  Private (Seller only)
const createVehicle = async (req, res, next) => {
  try {
    const {
      title,
      brand,
      model,
      variant,
      year,
      price,
      vehicleType,
      fuelType,
      transmission,
      kilometersDriven,
      condition,
      description,
      city,
      state,
      images: bodyImages,
      registrationNumber,
      categoryId,
      vinNumber
    } = req.body;

    // Handle files from upload.fields
    let imageList = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      imageList = req.files.images.map(file => `/uploads/${file.filename}`);
    } else if (bodyImages) {
      if (Array.isArray(bodyImages)) {
        imageList = bodyImages;
      } else if (typeof bodyImages === 'string') {
        try {
          imageList = JSON.parse(bodyImages);
        } catch (e) {
          imageList = [bodyImages];
        }
      }
    }

    if (!imageList || imageList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one vehicle image is required.'
      });
    }

    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Registration number is required.'
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number.'
      });
    }

    if (Number(kilometersDriven) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Kilometers driven cannot be negative.'
      });
    }

    const currentYear = new Date().getFullYear();
    if (Number(year) < 1900 || Number(year) > currentYear + 1) {
      return res.status(400).json({
        success: false,
        message: `Year must be between 1900 and ${currentYear + 1}.`
      });
    }

    // Extract documents
    const rcDocument = req.files && req.files.rcDocument && req.files.rcDocument.length > 0
      ? `/uploads/${req.files.rcDocument[0].filename}` : '';
    const insuranceDocument = req.files && req.files.insuranceDocument && req.files.insuranceDocument.length > 0
      ? `/uploads/${req.files.insuranceDocument[0].filename}` : '';
    const pucDocument = req.files && req.files.pucDocument && req.files.pucDocument.length > 0
      ? `/uploads/${req.files.pucDocument[0].filename}` : '';
    const additionalDocument = req.files && req.files.additionalDocument && req.files.additionalDocument.length > 0
      ? `/uploads/${req.files.additionalDocument[0].filename}` : '';

    const vehicle = await Vehicle.create({
      sellerId: req.user._id,
      title,
      brand,
      model,
      variant: variant || '',
      year: Number(year),
      price: Number(price),
      vehicleType,
      fuelType,
      transmission,
      kilometersDriven: Number(kilometersDriven),
      condition,
      description,
      city,
      state,
      images: imageList,
      registrationNumber,
      categoryId: categoryId || null,
      vinNumber: vinNumber || '',
      rcDocument,
      insuranceDocument,
      pucDocument,
      additionalDocument,
      status: 'available',
      approvalStatus: 'pending'
    });

    // Run verification/fraud checks immediately
    await verificationService.runChecks(vehicle);

    // Notify Admins
    try {
      const Notification = require('../models/Notification');
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          message: `New vehicle listed by ${req.user.name} awaiting approval: "${title}"`,
          type: 'general',
          relatedId: vehicle._id
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify admins of new listing:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Vehicle submitted and automatic fraud verification check initiated.',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle listing
// @route   PUT /api/vehicles/:id
// @access  Private (Seller only)
const updateVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle listing not found.'
      });
    }

    // Verify ownership
    if (vehicle.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only edit your own vehicle listings.'
      });
    }

    const {
      title,
      brand,
      model,
      variant,
      year,
      price,
      vehicleType,
      fuelType,
      transmission,
      kilometersDriven,
      condition,
      description,
      city,
      state,
      images: bodyImages,
      registrationNumber,
      categoryId,
      status,
      vinNumber
    } = req.body;

    // Handle files from upload.fields
    let imageList = vehicle.images;
    if (req.files && req.files.images && req.files.images.length > 0) {
      imageList = req.files.images.map(file => `/uploads/${file.filename}`);
    } else if (bodyImages) {
      if (Array.isArray(bodyImages)) {
        imageList = bodyImages;
      } else if (typeof bodyImages === 'string') {
        try {
          imageList = JSON.parse(bodyImages);
        } catch (e) {
          imageList = [bodyImages];
        }
      }
    }

    if (price && Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number.'
      });
    }

    if (kilometersDriven !== undefined && Number(kilometersDriven) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Kilometers driven cannot be negative.'
      });
    }

    // Extract new documents or keep existing ones
    const rcDocument = req.files && req.files.rcDocument && req.files.rcDocument.length > 0
      ? `/uploads/${req.files.rcDocument[0].filename}` : vehicle.rcDocument;
    const insuranceDocument = req.files && req.files.insuranceDocument && req.files.insuranceDocument.length > 0
      ? `/uploads/${req.files.insuranceDocument[0].filename}` : vehicle.insuranceDocument;
    const pucDocument = req.files && req.files.pucDocument && req.files.pucDocument.length > 0
      ? `/uploads/${req.files.pucDocument[0].filename}` : vehicle.pucDocument;
    const additionalDocument = req.files && req.files.additionalDocument && req.files.additionalDocument.length > 0
      ? `/uploads/${req.files.additionalDocument[0].filename}` : vehicle.additionalDocument;

    vehicle.title = title || vehicle.title;
    vehicle.brand = brand || vehicle.brand;
    vehicle.model = model || vehicle.model;
    vehicle.variant = variant !== undefined ? variant : vehicle.variant;
    vehicle.year = year ? Number(year) : vehicle.year;
    vehicle.price = price ? Number(price) : vehicle.price;
    vehicle.vehicleType = vehicleType || vehicle.vehicleType;
    vehicle.fuelType = fuelType || vehicle.fuelType;
    vehicle.transmission = transmission || vehicle.transmission;
    vehicle.kilometersDriven = kilometersDriven !== undefined ? Number(kilometersDriven) : vehicle.kilometersDriven;
    vehicle.condition = condition || vehicle.condition;
    vehicle.description = description || vehicle.description;
    vehicle.city = city || vehicle.city;
    vehicle.state = state || vehicle.state;
    vehicle.images = imageList;
    vehicle.registrationNumber = registrationNumber || vehicle.registrationNumber;
    vehicle.vinNumber = vinNumber !== undefined ? vinNumber : vehicle.vinNumber;
    vehicle.rcDocument = rcDocument;
    vehicle.insuranceDocument = insuranceDocument;
    vehicle.pucDocument = pucDocument;
    vehicle.additionalDocument = additionalDocument;
    
    if (categoryId) vehicle.categoryId = categoryId;
    if (status && ['available', 'reserved', 'sold'].includes(status)) {
      vehicle.status = status;
    }

    // Reset approval on update (so it goes back to admin verification review)
    vehicle.approvalStatus = 'pending';
    vehicle.rejectionReason = '';

    await vehicle.save();

    // Re-run verification/fraud checks
    const verification = await verificationService.runChecks(vehicle);
    
    // If it was already under review/documents required, reset verification status
    if (verification.status !== 'pending') {
      verification.status = 'pending';
      await verification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully and resubmitted for verification.',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle listing
// @route   DELETE /api/vehicles/:id
// @access  Private (Seller only)
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle listing not found.'
      });
    }

    if (vehicle.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete your own vehicle listings.'
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark vehicle as sold
// @route   PATCH /api/vehicles/:id/sold
// @access  Private (Seller only)
const markAsSold = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle listing not found.'
      });
    }

    if (vehicle.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only modify your own vehicle listings.'
      });
    }

    vehicle.status = 'sold';
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle marked as sold successfully.',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller's listed vehicles
// @route   GET /api/vehicles/seller/my-listings
// @access  Private (Seller only)
const getSellerVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ sellerId: req.user._id }).sort({ createdAt: -1 }).lean();

    // Fetch and map verification status for each vehicle
    const vehicleIds = vehicles.map(v => v._id);
    const verifications = await VehicleVerification.find({ vehicleId: { $in: vehicleIds } }).lean();

    const verifMap = {};
    verifications.forEach(v => {
      verifMap[v.vehicleId.toString()] = v;
    });

    const vehiclesWithVerification = vehicles.map(veh => ({
      ...veh,
      verification: verifMap[veh._id.toString()] || null
    }));

    res.status(200).json({
      success: true,
      message: 'Seller listings retrieved successfully',
      data: vehiclesWithVerification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller dashboard summary statistics
// @route   GET /api/vehicles/seller/stats
// @access  Private (Seller only)
const getSellerStats = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    const totalListings = await Vehicle.countDocuments({ sellerId });
    const activeListings = await Vehicle.countDocuments({ sellerId, status: 'available', approvalStatus: 'approved' });
    const pendingApproval = await Vehicle.countDocuments({ sellerId, approvalStatus: 'pending' });
    const soldVehicles = await Vehicle.countDocuments({ sellerId, status: 'sold' });
    const pendingOrders = await Order.countDocuments({ sellerId, status: 'payment_pending' });

    const orders = await Order.find({ sellerId, status: { $ne: 'cancelled' } });
    const totalSales = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

    const recentListings = await Vehicle.find({ sellerId }).sort({ createdAt: -1 }).limit(5);
    const recentInquiries = await Inquiry.find({ sellerId })
      .populate('buyerId', 'name email phone')
      .populate('vehicleId', 'title images price')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentOrders = await Order.find({ sellerId })
      .populate('buyerId', 'name email phone')
      .populate('vehicleId', 'title images price')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: 'Seller statistics retrieved successfully',
      data: {
        stats: {
          totalListings,
          activeListings,
          pendingApproval,
          soldVehicles,
          totalSales,
          pendingOrders
        },
        recentListings,
        recentInquiries,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vehicle verification details
// @route   GET /api/vehicles/:id/verification
// @access  Private (Seller or Admin)
const getVehicleVerification = async (req, res, next) => {
  try {
    let verification = await VehicleVerification.findOne({ vehicleId: req.params.id })
      .populate('vehicleId')
      .populate('sellerId', 'name email phone');

    if (!verification) {
      const vehicle = await Vehicle.findById(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle listing not found for verification.' });
      }

      // Automatically generate checks on-the-fly
      await verificationService.runChecks(vehicle);

      verification = await VehicleVerification.findOne({ vehicleId: req.params.id })
        .populate('vehicleId')
        .populate('sellerId', 'name email phone');
    }

    // Access control: only owner Seller or Admin
    const isOwner = verification.sellerId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not have permission to view this report.' });
    }

    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  markAsSold,
  getSellerVehicles,
  getSellerStats,
  getVehicleVerification
};
