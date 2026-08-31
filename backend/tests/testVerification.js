const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const VehicleVerification = require('../models/VehicleVerification');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { runChecks } = require('../utils/verificationService');
const adminController = require('../controllers/adminController');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/deals_on_wheels';

// Helper mock req/res
const createMockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const runTest = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Cleanup test data
    console.log('Cleaning up previous test data...');
    await User.deleteMany({
      $or: [
        { email: /test_seller|test_admin_verifier/i },
        { phone: { $in: ['8876543210', '8876543211'] } }
      ]
    });
    await Vehicle.deleteMany({ title: /Verification Test/i });
    await VehicleVerification.deleteMany({});
    await Report.deleteMany({});

    // Seed mock seller and admin
    console.log('Seeding mock users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const seller = await User.create({
      name: 'Test Seller',
      email: 'test_seller@deals.com',
      password: hashedPassword,
      role: 'user',
      phone: '8876543210',
      isEmailVerified: true
    });

    const admin = await User.create({
      name: 'Test Admin Verifier',
      email: 'test_admin_verifier@deals.com',
      password: hashedPassword,
      role: 'admin',
      phone: '8876543211',
      isEmailVerified: true
    });

    console.log('Seller and Admin seeded.');

    // Test Case 1: Normal Vehicle with Valid Documents (Low Risk)
    console.log('\n--- Test Case 1: Normal Vehicle with Valid Documents (Low Risk) ---');
    const vehicle1 = await Vehicle.create({
      sellerId: seller._id,
      title: 'Verification Test Vehicle 1',
      brand: 'Honda',
      model: 'City',
      year: 2021,
      price: 650000,
      vehicleType: 'Car',
      fuelType: 'Petrol',
      transmission: 'Manual',
      kilometersDriven: 20000,
      condition: 'Used',
      description: 'Excellent condition car.',
      city: 'Belagavi',
      state: 'Karnataka',
      images: ['/uploads/car1.jpg'],
      registrationNumber: 'KA22AB1234',
      rcDocument: '/uploads/rc_file.pdf',
      insuranceDocument: '/uploads/insurance_file.pdf',
      pucDocument: '/uploads/puc_file.pdf',
      status: 'available',
      approvalStatus: 'pending'
    });

    let verif1 = await runChecks(vehicle1);
    console.log(`Risk Score: ${verif1.riskScore} (Expected: 0)`);
    console.log(`Risk Level: ${verif1.riskLevel} (Expected: low)`);
    console.log(`Status: ${verif1.status} (Expected: pending)`);

    if (verif1.riskScore !== 0 || verif1.riskLevel !== 'low') {
      throw new Error('Test Case 1 failed: Incorrect risk metrics for clean vehicle');
    }

    // Test Case 2: Duplicate Registration Check
    console.log('\n--- Test Case 2: Duplicate Registration Check ---');
    const vehicle2 = await Vehicle.create({
      sellerId: seller._id,
      title: 'Verification Test Vehicle 2',
      brand: 'Maruti',
      model: 'Swift',
      year: 2022,
      price: 450000,
      vehicleType: 'Car',
      fuelType: 'Petrol',
      transmission: 'Manual',
      kilometersDriven: 10000,
      condition: 'Used',
      description: 'Nice hatch.',
      city: 'Hubli',
      state: 'Karnataka',
      images: ['/uploads/car2.jpg'],
      registrationNumber: 'KA22AB1234', // Same plate as vehicle 1
      rcDocument: '/uploads/rc_file2.pdf',
      insuranceDocument: '/uploads/insurance_file2.pdf',
      pucDocument: '/uploads/puc_file2.pdf',
      status: 'available',
      approvalStatus: 'pending'
    });

    let verif2 = await runChecks(vehicle2);
    console.log(`Risk Score: ${verif2.riskScore} (Expected: >= 40)`);
    console.log(`Risk Level: ${verif2.riskLevel} (Expected: medium/high)`);
    console.log(`Reg Check Status: ${verif2.registrationCheck.status} (Expected: failed)`);

    if (verif2.riskScore < 40 || verif2.registrationCheck.status !== 'failed') {
      throw new Error('Test Case 2 failed: Duplicate registration check did not trigger flag');
    }

    // Test Case 3: Data Mismatch (Simulated OCR mismatch)
    console.log('\n--- Test Case 3: Data Mismatch (Simulated OCR mismatch) ---');
    const vehicle3 = await Vehicle.create({
      sellerId: seller._id,
      title: 'Verification Test Vehicle 3',
      brand: 'Tata',
      model: 'Nexon',
      year: 2020,
      price: 800000,
      vehicleType: 'SUV',
      fuelType: 'Diesel',
      transmission: 'Automatic',
      kilometersDriven: 30000,
      condition: 'Used',
      description: 'Sturdy SUV.',
      city: 'Dharwad',
      state: 'Karnataka',
      images: ['/uploads/suv.jpg'],
      registrationNumber: 'KA25XY9999',
      rcDocument: '/uploads/mismatch_rc_file.pdf', // Mismatch in file name
      insuranceDocument: '/uploads/insurance_file.pdf',
      pucDocument: '/uploads/puc_file.pdf',
      status: 'available',
      approvalStatus: 'pending'
    });

    let verif3 = await runChecks(vehicle3);
    console.log(`Risk Score: ${verif3.riskScore} (Expected: >= 30)`);
    console.log(`Data Match Status: ${verif3.dataMatchCheck.status} (Expected: failed)`);

    if (verif3.riskScore < 30 || verif3.dataMatchCheck.status !== 'failed') {
      throw new Error('Test Case 3 failed: Mismatch document did not trigger flag');
    }

    // Test Case 4: Expired Insurance check
    console.log('\n--- Test Case 4: Expired Insurance check ---');
    const vehicle4 = await Vehicle.create({
      sellerId: seller._id,
      title: 'Verification Test Vehicle 4',
      brand: 'Mahindra',
      model: 'Thar',
      year: 2023,
      price: 1500000,
      vehicleType: 'SUV',
      fuelType: 'Diesel',
      transmission: 'Manual',
      kilometersDriven: 5000,
      condition: 'Used',
      description: 'Off-road beast.',
      city: 'Belagavi',
      state: 'Karnataka',
      images: ['/uploads/thar.jpg'],
      registrationNumber: 'KA22AB5678',
      rcDocument: '/uploads/rc_file.pdf',
      insuranceDocument: '/uploads/expired_insurance.pdf', // Expired
      pucDocument: '/uploads/puc_file.pdf',
      status: 'available',
      approvalStatus: 'pending'
    });

    let verif4 = await runChecks(vehicle4);
    console.log(`Risk Score: ${verif4.riskScore} (Expected: >= 10)`);
    console.log(`Data Match Status: ${verif4.dataMatchCheck.status} (Expected: warning)`);

    if (verif4.riskScore < 10 || verif4.dataMatchCheck.status !== 'warning') {
      throw new Error('Test Case 4 failed: Expired document did not trigger warning');
    }

    // Test Case 5: Admin Actions (Approve)
    console.log('\n--- Test Case 5: Admin Actions (Approve) ---');
    let reqApprove = {
      user: admin,
      params: { id: vehicle1._id },
      body: { action: 'approve', adminNote: 'All checks passed.' }
    };
    let resApprove = createMockRes();
    await adminController.processVerificationAction(reqApprove, resApprove, (err) => { if (err) throw err; });

    let updatedVehicle1 = await Vehicle.findById(vehicle1._id);
    let updatedVerif1 = await VehicleVerification.findOne({ vehicleId: vehicle1._id });

    console.log(`Vehicle approvalStatus: ${updatedVehicle1.approvalStatus} (Expected: approved)`);
    console.log(`Verification status: ${updatedVerif1.status} (Expected: verified)`);

    if (updatedVehicle1.approvalStatus !== 'approved' || updatedVerif1.status !== 'verified') {
      throw new Error('Test Case 5 failed: Approve action did not update states correctly');
    }

    // Test Case 6: Admin Actions (Request Documents)
    console.log('\n--- Test Case 6: Admin Actions (Request Documents) ---');
    let reqRequest = {
      user: admin,
      params: { id: vehicle3._id },
      body: { action: 'request-documents', adminNote: 'Please upload a clearer copy of your RC.' }
    };
    let resRequest = createMockRes();
    await adminController.processVerificationAction(reqRequest, resRequest, (err) => { if (err) throw err; });

    let updatedVehicle3 = await Vehicle.findById(vehicle3._id);
    let updatedVerif3 = await VehicleVerification.findOne({ vehicleId: vehicle3._id });

    console.log(`Vehicle approvalStatus: ${updatedVehicle3.approvalStatus} (Expected: pending)`);
    console.log(`Verification status: ${updatedVerif3.status} (Expected: documents_required)`);
    console.log(`Verification adminNote: "${updatedVerif3.adminNote}" (Expected: Please upload a clearer copy of your RC.)`);

    if (updatedVehicle3.approvalStatus !== 'pending' || updatedVerif3.status !== 'documents_required') {
      throw new Error('Test Case 6 failed: Request documents action did not update states correctly');
    }

    // Test Case 7: Admin Actions (Reject)
    console.log('\n--- Test Case 7: Admin Actions (Reject) ---');
    let reqReject = {
      user: admin,
      params: { id: vehicle4._id },
      body: { action: 'reject', rejectionReason: 'Fake insurance document uploaded.' }
    };
    let resReject = createMockRes();
    await adminController.processVerificationAction(reqReject, resReject, (err) => { if (err) throw err; });

    let updatedVehicle4 = await Vehicle.findById(vehicle4._id);
    let updatedVerif4 = await VehicleVerification.findOne({ vehicleId: vehicle4._id });

    console.log(`Vehicle approvalStatus: ${updatedVehicle4.approvalStatus} (Expected: rejected)`);
    console.log(`Verification status: ${updatedVerif4.status} (Expected: rejected)`);
    console.log(`Verification rejectionReason: "${updatedVerif4.rejectionReason}" (Expected: Fake insurance document uploaded.)`);

    if (updatedVehicle4.approvalStatus !== 'rejected' || updatedVerif4.status !== 'rejected') {
      throw new Error('Test Case 7 failed: Reject action did not update states correctly');
    }

    console.log('\n====================================');
    console.log(' ALL INTEGRATION TEST CASES PASSED! ');
    console.log('====================================');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification Test Failed with error:', error);
    process.exit(1);
  }
};

runTest();
