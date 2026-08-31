const path = require('path');
const fs = require('fs');
const Vehicle = require('../models/Vehicle');
const { authenticateUser } = require('./auth');

const documentGuard = async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename);
    const safeUploadsDir = path.resolve(__dirname, '../uploads');
    const filePath = path.join(safeUploadsDir, filename);

    if (!filePath.startsWith(safeUploadsDir) || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isPdf = filename.toLowerCase().endsWith('.pdf');
    const isDocInDb = await Vehicle.findOne({
      $or: [
        { rcDocument: `/uploads/${filename}` },
        { insuranceDocument: `/uploads/${filename}` },
        { pucDocument: `/uploads/${filename}` },
        { additionalDocument: `/uploads/${filename}` }
      ]
    });

    if (isPdf || isDocInDb) {
      // Execute authentication check
      return authenticateUser(req, res, async () => {
        const vehicle = isDocInDb || await Vehicle.findOne({
          $or: [
            { rcDocument: `/uploads/${filename}` },
            { insuranceDocument: `/uploads/${filename}` },
            { pucDocument: `/uploads/${filename}` },
            { additionalDocument: `/uploads/${filename}` }
          ]
        });

        const isOwner = vehicle && vehicle.sellerId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (isOwner || isAdmin) {
          return res.sendFile(filePath);
        } else {
          return res.status(403).json({
            success: false,
            message: 'Forbidden. You do not have access to view this document.'
          });
        }
      });
    }

    // Serve public images
    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

module.exports = documentGuard;
