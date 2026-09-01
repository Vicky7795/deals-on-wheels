const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/deals_on_wheels';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // One-time migration: Convert legacy buyer and seller roles to user
    const User = require('../models/User');
    const migrated = await User.updateMany(
      { role: { $in: ['buyer', 'seller'] } },
      { $set: { role: 'user' } }
    );
    if (migrated.modifiedCount > 0) {
      console.log(`Migrated ${migrated.modifiedCount} legacy users to the unified 'user' role.`);
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Please configure a valid MONGO_URI in your Render Environment Variables (e.g. from MongoDB Atlas). Server remaining active...');
  }
};


module.exports = connectDB;
