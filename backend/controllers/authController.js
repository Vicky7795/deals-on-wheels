const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'deals_on_wheels_super_secret_jwt_key_2026', {
    expiresIn: '7d'
  });
};

// @desc    Register a new user (Buyer or Seller)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, role, city, state } = req.body;

    // Basic Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Full Name, Email, Phone, Password, Confirm Password).'
      });
    }

    let finalRole = role || 'user';
    if (['buyer', 'seller'].includes(finalRole)) {
      finalRole = 'user';
    }

    if (finalRole !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Registrations are allowed as User only.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    // Validate Indian Phone Number format (10 digits, optionally prefixed with +91 or 0)
    const phoneClean = phone.trim().replace(/^(\+91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian phone number.'
      });
    }

    // Check unique email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Check unique phone
    const existingPhone = await User.findOne({ phone: phoneClean });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: 'An account with this phone number already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phoneClean,
      password: hashedPassword,
      role: finalRole,
      city: city || '',
      state: state || ''
    });

    const token = generateToken(user._id);

    // Omit password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      city: user.city,
      state: user.state,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Deals on Wheels.',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both Email and Password.'
      });
    }

    // Select password field explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please check your email or register.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    const token = generateToken(user._id);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      city: user.city,
      state: user.state,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
