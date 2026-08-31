const VehicleVerification = require('../models/VehicleVerification');
const Vehicle = require('../models/Vehicle');
const Report = require('../models/Report');
const User = require('../models/User');

/**
 * Normalizes an Indian RTO vehicle registration number by converting to uppercase
 * and stripping spaces and hyphens.
 */
const normalizeRegNumber = (regNum) => {
  if (!regNum) return '';
  return regNum.trim().toUpperCase().replace(/[-\s]/g, '');
};

/**
 * Validates registration format (e.g. KA22AB1234 or MH01A1234)
 */
const isValidRegFormat = (regNum) => {
  const normalized = normalizeRegNumber(regNum);
  // Standard Indian registration: StateCode (2 letters) + District (2 digits) + Series (1-3 letters) + Number (4 digits)
  const indianRegRegex = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/;
  return indianRegRegex.test(normalized);
};

/**
 * Runs automatic verification checks and saves results to VehicleVerification collection
 */
const runChecks = async (vehicle) => {
  try {
    const vehicleId = vehicle._id;
    const sellerId = vehicle.sellerId;
    const normalizedReg = normalizeRegNumber(vehicle.registrationNumber);

    let riskScore = 0;

    // 1. Registration Check
    let registrationCheck = { status: 'passed', details: 'Registration format is valid.' };
    if (!normalizedReg) {
      registrationCheck = { status: 'failed', details: 'Registration number is missing.' };
      riskScore += 40;
    } else if (!isValidRegFormat(normalizedReg)) {
      registrationCheck = { status: 'warning', details: `Registration format "${vehicle.registrationNumber}" is non-standard.` };
      riskScore += 10;
    }

    // Scan DB for other active listings using this registration number
    const dupRegVehicle = await Vehicle.findOne({
      _id: { $ne: vehicleId },
      registrationNumber: { $regex: new RegExp(`^${vehicle.registrationNumber.trim()}$`, 'i') },
      status: { $ne: 'sold' }
    });
    if (dupRegVehicle) {
      registrationCheck = { status: 'failed', details: `Duplicate active registration found on vehicle ID: ${dupRegVehicle._id}` };
      riskScore += 40;
    }

    // 2. Duplicate Listing Check (same seller has active listing with same model/year)
    let duplicateCheck = { status: 'passed', details: 'No duplicate listings detected for this seller.' };
    const dupListing = await Vehicle.findOne({
      _id: { $ne: vehicleId },
      sellerId,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      status: { $ne: 'sold' }
    });
    if (dupListing) {
      duplicateCheck = { status: 'warning', details: `Seller has another active listing of the same vehicle: ${dupListing.title}` };
      riskScore += 15;
    }

    // 3. Document Check (Verify RC, Insurance, and PUC presence)
    let documentCheck = { status: 'passed', details: 'All required documents (RC, Insurance, PUC) are present.' };
    const missingDocs = [];
    if (!vehicle.rcDocument) missingDocs.push('RC');
    if (!vehicle.insuranceDocument) missingDocs.push('Insurance');
    if (!vehicle.pucDocument) missingDocs.push('PUC');

    if (missingDocs.length > 0) {
      documentCheck = { status: 'failed', details: `Missing required documents: ${missingDocs.join(', ')}.` };
      riskScore += missingDocs.length * 15; // +15 per missing doc
    }

    // 4. Data Match Check (Simulated OCR Check)
    let dataMatchCheck = { status: 'passed', details: 'Document data matches seller-entered vehicle details.' };
    
    // Scan filenames to look for simulated test files
    const allDocPaths = [vehicle.rcDocument, vehicle.insuranceDocument, vehicle.pucDocument, vehicle.additionalDocument].filter(Boolean);
    const hasMismatchDoc = allDocPaths.some(p => p.toLowerCase().includes('mismatch'));
    const hasExpiredDoc = allDocPaths.some(p => p.toLowerCase().includes('expired'));

    if (hasMismatchDoc) {
      dataMatchCheck = {
        status: 'failed',
        details: '⚠️ Registration mismatch, Model mismatch, Year mismatch (Simulated OCR mismatch flag).'
      };
      riskScore += 30;
    } else if (hasExpiredDoc) {
      dataMatchCheck = {
        status: 'warning',
        details: '⚠️ Insurance document appears expired (Simulated OCR expiry flag).'
      };
      riskScore += 10;
    }

    // 5. Image Check (Duplicate Image Detection)
    let imageCheck = { status: 'passed', details: 'Uploaded images are unique to this listing.' };
    if (vehicle.images && vehicle.images.length > 0) {
      const dupImageVehicle = await Vehicle.findOne({
        _id: { $ne: vehicleId },
        images: { $in: vehicle.images }
      });
      if (dupImageVehicle) {
        imageCheck = { status: 'warning', details: `One or more images duplicate another vehicle listing: ${dupImageVehicle.title}` };
        riskScore += 20;
      }
    }

    // 6. Seller History Check
    let sellerHistoryCheck = { status: 'passed', details: 'Seller has a good listing approval history.' };
    const rejectedCount = await Vehicle.countDocuments({ sellerId, approvalStatus: 'rejected' });
    if (rejectedCount > 0) {
      sellerHistoryCheck = { status: 'warning', details: `Seller has ${rejectedCount} previously rejected vehicle listings.` };
      riskScore += Math.min(30, rejectedCount * 15); // +15 per rejection, cap at 30
    }

    // 7. Report Check
    let reportCheck = { status: 'passed', details: 'No active reports filed against this seller or vehicle.' };
    const reportsCount = await Report.countDocuments({
      $or: [
        { vehicleId },
        { reportedUserId: sellerId }
      ]
    });
    if (reportsCount > 0) {
      reportCheck = { status: 'failed', details: `There are ${reportsCount} user reports filed against this vehicle or seller.` };
      riskScore += 25;
    }

    // 8. Suspicious Price Check (Heuristic)
    let isSuspiciousPrice = false;
    if (vehicle.vehicleType === 'Car' && vehicle.price < 50000) isSuspiciousPrice = true;
    if (vehicle.vehicleType === 'SUV' && vehicle.price < 100000) isSuspiciousPrice = true;
    if (vehicle.vehicleType === 'Bike' && vehicle.price < 10000) isSuspiciousPrice = true;

    if (isSuspiciousPrice) {
      riskScore += 10;
    }

    // Map risk score to level
    let riskLevel = 'low';
    if (riskScore >= 51) {
      riskLevel = 'high';
    } else if (riskScore >= 21) {
      riskLevel = 'medium';
    }

    // Save or update VehicleVerification
    let verification = await VehicleVerification.findOne({ vehicleId });
    if (!verification) {
      verification = new VehicleVerification({
        vehicleId,
        sellerId,
        status: 'pending'
      });
    }

    verification.registrationCheck = registrationCheck;
    verification.duplicateCheck = duplicateCheck;
    verification.documentCheck = documentCheck;
    verification.dataMatchCheck = dataMatchCheck;
    verification.imageCheck = imageCheck;
    verification.sellerHistoryCheck = sellerHistoryCheck;
    verification.reportCheck = reportCheck;
    verification.riskScore = riskScore;
    verification.riskLevel = riskLevel;

    // Default status handling: if any check failed, default state remains under_review or pending
    if (verification.status === 'verified' || verification.status === 'rejected') {
      // Keep verified or rejected status unless seller resubmits
      verification.status = 'pending';
    }

    await verification.save();
    return verification;
  } catch (error) {
    console.error('Failed to run verification checks:', error);
    throw error;
  }
};

module.exports = {
  runChecks,
  normalizeRegNumber,
  isValidRegFormat
};
