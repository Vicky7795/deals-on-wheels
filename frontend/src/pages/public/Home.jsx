import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../../components/vehicle/SearchBar';
import VehicleCard from '../../components/vehicle/VehicleCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { Car, Bike, Zap, Truck, ShieldCheck, MessageCircle, ShoppingBag, ArrowRight } from 'lucide-react';

const Home = () => {
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/vehicles?limit=6&status=available');
        if (res.data.success) {
          setFeaturedVehicles(res.data.data.vehicles || []);
        }
      } catch (error) {
        console.error('Failed to fetch featured vehicles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const categories = [
    { title: 'Cars', count: 'Sedans & Hatchbacks', icon: Car, type: 'Car', bg: 'bg-blue-50 text-blue-600' },
    { title: 'SUVs', count: '4x4 & Compact SUVs', icon: ShieldCheck, type: 'SUV', bg: 'bg-emerald-50 text-emerald-600' },
    { title: 'Bikes', count: 'Cruisers & Sports', icon: Bike, type: 'Bike', bg: 'bg-amber-50 text-amber-600' },
    { title: 'Electric Vehicles', count: 'EV Cars & Scooters', icon: Zap, type: 'Electric Vehicle', bg: 'bg-purple-50 text-purple-600' },
    { title: 'Commercial', count: 'Pickups & Trucks', icon: Truck, type: 'Commercial Vehicle', bg: 'bg-rose-50 text-rose-600' }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-xl overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold tracking-wide uppercase border border-blue-400/30">
            India's Trusted Vehicle Marketplace
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Find Your <span className="text-blue-400">Perfect Vehicle</span>
          </h1>

          <p className="text-lg sm:text-xl text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
            Buy and sell quality vehicles with confidence. Direct seller communication and transparent deals.
          </p>

          <div className="pt-6">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Explore by Category</h2>
            <p className="text-sm text-gray-500">Find the right vehicle for your daily commute or lifestyle</p>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Browse All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                to={`/browse?vehicleType=${encodeURIComponent(cat.type)}`}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center text-center group"
              >
                <div className={`w-14 h-14 ${cat.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{cat.title}</h3>
                <span className="text-xs text-gray-500">{cat.count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Vehicle Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Vehicles</h2>
            <p className="text-sm text-gray-500">Handpicked verified vehicles ready for purchase</p>
          </div>
          <Link to="/browse">
            <Button variant="outline" size="sm" icon={ArrowRight}>
              View All Listings
            </Button>
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching featured vehicles..." />
        ) : featuredVehicles.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
            No vehicle listings available currently. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} showFavoriteButton={false} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="bg-white border-y border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Simplicity First</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-12">How Deals on Wheels Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
              <div className="w-14 h-14 bg-blue-600 text-white font-black text-xl rounded-2xl flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900">Browse Vehicles</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Filter through verified vehicle listings by price, vehicle type, brand, transmission, and city location.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
              <div className="w-14 h-14 bg-blue-600 text-white font-black text-xl rounded-2xl flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900">Contact Seller</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Send direct inquiries to the vehicle owner, ask questions, negotiate terms, or arrange test drives.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
              <div className="w-14 h-14 bg-blue-600 text-white font-black text-xl rounded-2xl flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900">Make Purchase</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Confirm your purchase seamlessly online with instant order tracking and owner notifications.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
