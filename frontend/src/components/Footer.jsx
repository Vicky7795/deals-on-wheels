import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin, Shield, CheckCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">
                Deals on <span className="text-blue-500">Wheels</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              India's premier vehicle marketplace connecting buyers and sellers directly with trust, simplicity, and confidence.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-emerald-400" /> Verified Listings
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-blue-400" /> Direct Purchase
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-white transition-colors">Browse Marketplace</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">Join as Seller</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Vehicle Types */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Categories</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/browse?vehicleType=Car" className="hover:text-white transition-colors">Cars</Link>
              </li>
              <li>
                <Link to="/browse?vehicleType=SUV" className="hover:text-white transition-colors">SUVs</Link>
              </li>
              <li>
                <Link to="/browse?vehicleType=Bike" className="hover:text-white transition-colors">Bikes & Motorcycles</Link>
              </li>
              <li>
                <Link to="/browse?vehicleType=Electric+Vehicle" className="hover:text-white transition-colors">Electric Vehicles</Link>
              </li>
              <li>
                <Link to="/browse?vehicleType=Commercial+Vehicle" className="hover:text-white transition-colors">Commercial Vehicles</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact & Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>Mumbai, Maharashtra, India</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>support@dealsonwheels.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Deals on Wheels. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0 items-center">
            <Link to="/admin/login" className="hover:underline hover:text-gray-400">Admin Login</Link>
            <span>•</span>
            <p>Built for full-stack excellence.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
