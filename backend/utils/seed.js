const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Favorite = require('../models/Favorite');
const Inquiry = require('../models/Inquiry');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const Category = require('../models/Category');
const PlatformSetting = require('../models/PlatformSetting');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const Report = require('../models/Report');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/deals_on_wheels';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Favorite.deleteMany({});
    await Inquiry.deleteMany({});
    await Order.deleteMany({});
    await Notification.deleteMany({});
    await Category.deleteMany({});
    await PlatformSetting.deleteMany({});
    await Payment.deleteMany({});
    await Commission.deleteMany({});
    await Report.deleteMany({});

    console.log('Cleared existing data.');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Password123', salt);

    // Create Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dealsonwheels.com';
    const adminPasswordRaw = process.env.ADMIN_PASSWORD || 'Password123';
    const adminPassword = await bcrypt.hash(adminPasswordRaw, salt);

    const adminUser = await User.create({
      name: 'Marketplace Admin',
      email: adminEmail.toLowerCase(),
      phone: '9999999999',
      password: adminPassword,
      role: 'admin',
      city: 'Mumbai',
      state: 'Maharashtra',
      accountStatus: 'active'
    });

    console.log(`Seeded Admin: ${adminEmail}`);

    // Create 3 Sellers
    const seller1 = await User.create({
      name: 'Rajesh Sharma',
      email: 'seller1@example.com',
      phone: '9876543210',
      password: defaultPassword,
      role: 'user',
      city: 'Mumbai',
      state: 'Maharashtra'
    });

    const seller2 = await User.create({
      name: 'Ananya Verma',
      email: 'seller2@example.com',
      phone: '9876543211',
      password: defaultPassword,
      role: 'user',
      city: 'Bengaluru',
      state: 'Karnataka'
    });

    const seller3 = await User.create({
      name: 'Amit Patel',
      email: 'seller3@example.com',
      phone: '9876543214',
      password: defaultPassword,
      role: 'user',
      city: 'Delhi',
      state: 'Delhi'
    });

    // Create 5 Buyers
    const buyer1 = await User.create({
      name: 'Vikram Patel',
      email: 'buyer1@example.com',
      phone: '9876543212',
      password: defaultPassword,
      role: 'user',
      city: 'Delhi',
      state: 'Delhi'
    });

    const buyer2 = await User.create({
      name: 'Priya Sundaram',
      email: 'buyer2@example.com',
      phone: '9876543213',
      password: defaultPassword,
      role: 'user',
      city: 'Chennai',
      state: 'Tamil Nadu'
    });

    const buyer3 = await User.create({
      name: 'Rohit Sharma',
      email: 'buyer3@example.com',
      phone: '9876543215',
      password: defaultPassword,
      role: 'user',
      city: 'Mumbai',
      state: 'Maharashtra'
    });

    const buyer4 = await User.create({
      name: 'Neha Gupta',
      email: 'buyer4@example.com',
      phone: '9876543216',
      password: defaultPassword,
      role: 'user',
      city: 'Pune',
      state: 'Maharashtra'
    });

    const buyer5 = await User.create({
      name: 'Siddharth Rao',
      email: 'buyer5@example.com',
      phone: '9876543217',
      password: defaultPassword,
      role: 'user',
      city: 'Hyderabad',
      state: 'Telangana'
    });

    console.log('Seeded 3 Sellers and 5 Buyers.');

    // Seed Platform Settings
    const setting = await PlatformSetting.create({
      platformName: 'Deals on Wheels',
      commissionPercentage: 1.5,
      maxImageCount: 5,
      listingRules: '1. Registration number must be readable. 2. Price must match market values.',
      contactEmail: 'admin@dealsonwheels.com',
      contactPhone: '1800-123-4567'
    });
    console.log('Seeded Platform Settings.');

    // Seed Categories
    const catCar = await Category.create({ name: 'Car', description: 'Sedans, Hatchbacks, Coupes, and convertibles' });
    const catBike = await Category.create({ name: 'Bike', description: 'Motorcycles, scooters, and cruise bikes' });
    const catSuv = await Category.create({ name: 'SUV', description: 'Sports Utility Vehicles and crossovers' });
    const catEv = await Category.create({ name: 'Electric Vehicle', description: 'Battery electric passenger vehicles' });
    const catComm = await Category.create({ name: 'Commercial Vehicle', description: 'Trucks, cargo vans, and loaders' });

    console.log('Seeded Categories.');

    // Seed Vehicles
    const vehiclesData = [
      {
        sellerId: seller1._id,
        title: '2022 Hyundai Creta SX (O) Turbo Petrol',
        brand: 'Hyundai',
        model: 'Creta',
        variant: 'SX (O) Turbo',
        year: 2022,
        price: 1450000,
        vehicleType: 'SUV',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        kilometersDriven: 18500,
        condition: 'Used',
        description: 'Immaculate condition Hyundai Creta SX Option Turbo with panoramic sunroof, ventilated seats, Bose audio, and full service record at authorized dealership.',
        city: 'Mumbai',
        state: 'Maharashtra',
        images: [
          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80'
        ],
        registrationNumber: 'MH-01-AB-1234',
        status: 'available',
        approvalStatus: 'approved',
        categoryId: catSuv._id
      },
      {
        sellerId: seller1._id,
        title: '2023 Tata Nexon EV Max XZ+ Lux',
        brand: 'Tata',
        model: 'Nexon EV',
        variant: 'Max XZ+ Lux',
        year: 2023,
        price: 1620000,
        vehicleType: 'Electric Vehicle',
        fuelType: 'Electric',
        transmission: 'Automatic',
        kilometersDriven: 12000,
        condition: 'Used',
        description: 'Well-maintained Tata Nexon EV Max with extended battery range of 453km. Fast charger included. Zero accidents, insurance valid till 2026.',
        city: 'Mumbai',
        state: 'Maharashtra',
        images: [
          'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1000&q=80'
        ],
        registrationNumber: 'MH-02-CD-5678',
        status: 'available',
        approvalStatus: 'approved',
        categoryId: catEv._id
      },
      {
        sellerId: seller1._id,
        title: '2021 Royal Enfield Meteor 350 Stellar',
        brand: 'Royal Enfield',
        model: 'Meteor 350',
        variant: 'Stellar Black',
        year: 2021,
        price: 185000,
        vehicleType: 'Bike',
        fuelType: 'Petrol',
        transmission: 'Manual',
        kilometersDriven: 8400,
        condition: 'Used',
        description: 'Single owner Royal Enfield Meteor 350 with Tripper navigation, touring seat, and backrest. Smooth engine, scratchless body.',
        city: 'Mumbai',
        state: 'Maharashtra',
        images: [
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80'
        ],
        registrationNumber: 'MH-03-EF-9012',
        status: 'available',
        approvalStatus: 'approved',
        categoryId: catBike._id
      },
      {
        sellerId: seller2._id,
        title: '2023 Mahindra Thar LX Hard Top Diesel 4WD',
        brand: 'Mahindra',
        model: 'Thar',
        variant: 'LX Hard Top 4WD',
        year: 2023,
        price: 1580000,
        vehicleType: 'SUV',
        fuelType: 'Diesel',
        transmission: 'Manual',
        kilometersDriven: 14000,
        condition: 'Used',
        description: 'Rugged 4x4 Mahindra Thar with factory hardtop, touchscreen infotainment, alloy wheels, and all-terrain tires. Ready for offroad adventures.',
        city: 'Bengaluru',
        state: 'Karnataka',
        images: [
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80'
        ],
        registrationNumber: 'KA-03-GH-3456',
        status: 'available',
        approvalStatus: 'approved',
        categoryId: catSuv._id
      },
      {
        sellerId: seller2._id,
        title: '2022 Honda City ZX i-VTEC CVT',
        brand: 'Honda',
        model: 'City',
        variant: 'ZX CVT',
        year: 2022,
        price: 1290000,
        vehicleType: 'Car',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        kilometersDriven: 22000,
        condition: 'Used',
        description: 'Top end Honda City 5th Gen with full leather upholstery, LaneWatch camera, sunroof, LED headlights, and company warranty.',
        city: 'Bengaluru',
        state: 'Karnataka',
        images: [
          'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1000&q=80'
        ],
        registrationNumber: 'KA-04-IJ-7890',
        status: 'available',
        approvalStatus: 'approved',
        categoryId: catCar._id
      },
      {
        sellerId: seller2._id,
        title: '2024 Tata Ace Gold Diesel (Commercial)',
        brand: 'Tata',
        model: 'Ace Gold',
        variant: 'BS6 Diesel',
        year: 2024,
        price: 520000,
        vehicleType: 'Commercial Vehicle',
        fuelType: 'Diesel',
        transmission: 'Manual',
        kilometersDriven: 3500,
        condition: 'New',
        description: 'Brand new Tata Ace Gold mini truck. Excellent payload capacity, high fuel efficiency, and robust load body.',
        city: 'Bengaluru',
        state: 'Karnataka',
        images: [
          'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1000&q=80'
        ],
        registrationNumber: 'KA-05-KL-1234',
        status: 'available',
        approvalStatus: 'approved',
        categoryId: catComm._id
      }
    ];

    const seededVehicles = await Vehicle.insertMany(vehiclesData);
    console.log(`Seeded ${seededVehicles.length} vehicle listings.`);

    // Seed a sample inquiry
    const inquiry1 = await Inquiry.create({
      buyerId: buyer1._id,
      sellerId: seller1._id,
      vehicleId: seededVehicles[0]._id,
      message: 'Hi, is the Hyundai Creta still available? Can we schedule a test drive this weekend?',
      status: 'pending'
    });

    await Notification.create({
      userId: seller1._id,
      message: `${buyer1.name} sent an inquiry for your listing "${seededVehicles[0].title}"`,
      type: 'inquiry',
      relatedId: inquiry1._id
    });

    // Seed a sample favorite
    await Favorite.create({
      buyerId: buyer1._id,
      vehicleId: seededVehicles[1]._id
    });

    console.log('\n========================================');
    console.log('DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`ADMIN ACCOUNT:`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPasswordRaw}`);
    console.log('DEMO ACCOUNTS (Password: Password123 for all):');
    console.log('1) Seller 1: seller1@example.com (Phone: 9876543210)');
    console.log('2) Seller 2: seller2@example.com (Phone: 9876543211)');
    console.log('3) Seller 3: seller3@example.com (Phone: 9876543214)');
    console.log('4) Buyer 1:  buyer1@example.com  (Phone: 9876543212)');
    console.log('5) Buyer 2:  buyer2@example.com  (Phone: 9876543213)');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
