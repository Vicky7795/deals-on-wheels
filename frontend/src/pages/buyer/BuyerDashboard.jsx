import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import VehicleCard from '../../components/vehicle/VehicleCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Heart, MessageSquare, ShoppingBag, CheckCircle, ArrowRight } from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchBuyerData = async () => {
    setLoading(true);
    try {
      const [favRes, inqRes, ordRes] = await Promise.all([
        api.get('/favorites'),
        api.get('/inquiries/buyer'),
        api.get('/orders/buyer')
      ]);

      if (favRes.data.success) setFavorites(favRes.data.data || []);
      if (inqRes.data.success) setInquiries(inqRes.data.data || []);
      if (ordRes.data.success) setOrders(ordRes.data.data || []);
    } catch (e) {
      console.error('Failed to load buyer dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyerData();
  }, []);

  const purchasedCount = orders.filter(o => o.status === 'confirmed' || o.status === 'completed').length;
  const activeInquiriesCount = inquiries.filter(i => i.status !== 'closed').length;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100 text-sm mt-1">Manage your saved vehicles, inquiries, and orders from your buyer dashboard.</p>
          </div>
          <Link to="/browse">
            <button className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors">
              Browse Vehicles
            </button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-gray-900">{favorites.length}</span>
              <p className="text-xs text-gray-500 font-medium">Favorite Vehicles</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-gray-900">{activeInquiriesCount}</span>
              <p className="text-xs text-gray-500 font-medium">Active Inquiries</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-gray-900">{orders.length}</span>
              <p className="text-xs text-gray-500 font-medium">Total Orders</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-gray-900">{purchasedCount}</span>
              <p className="text-xs text-gray-500 font-medium">Purchased Vehicles</p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        {loading ? (
          <LoadingSpinner message="Loading dashboard statistics..." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Favorites */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" /> Recent Favorites
                </h3>
                <Link to="/buyer/favorites" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View All ({favorites.length}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {favorites.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">You haven't saved any vehicles yet.</p>
              ) : (
                <div className="space-y-3">
                  {favorites.slice(0, 3).map((fav) => {
                    const veh = fav.vehicleId;
                    if (!veh) return null;
                    return (
                      <div key={fav._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={veh.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80'}
                            alt={veh.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <Link to={`/vehicles/${veh._id}`} className="text-sm font-bold text-gray-900 hover:text-blue-600 line-clamp-1">
                              {veh.title}
                            </Link>
                            <span className="text-xs text-gray-500">₹{veh.price?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <Link to={`/vehicles/${veh._id}`}>
                          <button className="text-xs text-blue-600 font-semibold border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">
                            View
                          </button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" /> Recent Purchases / Orders
                </h3>
                <Link to="/buyer/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View All ({orders.length}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {orders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No purchase orders found.</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((ord) => {
                    const veh = ord.vehicleId;
                    return (
                      <div key={ord._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{veh?.title || 'Vehicle'}</h4>
                          <span className="text-xs text-gray-500">Order Amount: ₹{ord.amount?.toLocaleString('en-IN')}</span>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 capitalize">
                          {ord.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BuyerDashboard;
