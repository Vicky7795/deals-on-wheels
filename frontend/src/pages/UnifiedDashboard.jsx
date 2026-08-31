import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Car,
  Search,
  Heart,
  MessageSquare,
  ShoppingBag,
  PlusCircle,
  Bell,
  User,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const UnifiedDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    favorites: [],
    listings: [],
    buyerOrders: [],
    sellerOrders: [],
    buyerInquiries: [],
    sellerInquiries: []
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [favRes, listRes, buyerOrdRes, sellerOrdRes, buyerInqRes, sellerInqRes] = await Promise.all([
        api.get('/favorites').catch(() => ({ data: { success: false } })),
        api.get('/vehicles/seller/my-listings').catch(() => ({ data: { success: false } })),
        api.get('/orders/buyer').catch(() => ({ data: { success: false } })),
        api.get('/orders/seller').catch(() => ({ data: { success: false } })),
        api.get('/inquiries/buyer').catch(() => ({ data: { success: false } })),
        api.get('/inquiries/seller').catch(() => ({ data: { success: false } }))
      ]);

      setData({
        favorites: favRes.data.success ? favRes.data.data : [],
        listings: listRes.data.success ? listRes.data.data : [],
        buyerOrders: buyerOrdRes.data.success ? buyerOrdRes.data.data : [],
        sellerOrders: sellerOrdRes.data.success ? sellerOrdRes.data.data : [],
        buyerInquiries: buyerInqRes.data.success ? buyerInqRes.data.data : [],
        sellerInquiries: sellerInqRes.data.success ? sellerInqRes.data.data : []
      });
    } catch (e) {
      console.error('Failed to load unified dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalSalesRevenue = data.sellerOrders
    .filter(o => o.status === 'confirmed' || o.status === 'completed')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="user" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Unified Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome back, {user?.name}!</h1>
          <p className="text-indigo-100 text-sm max-w-2xl">
            Deals on Wheels is your complete vehicle marketplace. You can buy vehicles, sell your own, and track all listings and transactions from this single dashboard.
          </p>
        </div>

        {/* Action Panel: BUY vs SELL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">BUY VEHICLES</h3>
              <p className="text-sm text-gray-500">
                Browse our curated marketplace, filter by your specifications, contact vehicle owners, and securely purchase your next ride.
              </p>
            </div>
            <Link to="/browse">
              <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                Browse Vehicles <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">SELL YOUR VEHICLE</h3>
              <p className="text-sm text-gray-500">
                List your vehicle with high-quality images, technical specifications, and documents to get approved and connect with buyers.
              </p>
            </div>
            <Link to="/sell">
              <button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                Sell a Vehicle <PlusCircle className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Marketplace Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link to="/my-listings" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex flex-col items-center text-center">
            <Car className="w-5 h-5 text-indigo-600 mb-1.5" />
            <span className="text-xl font-black text-gray-900">{data.listings.length}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">My Listings</span>
          </Link>

          <Link to="/my-purchases" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex flex-col items-center text-center">
            <ShoppingBag className="w-5 h-5 text-emerald-600 mb-1.5" />
            <span className="text-xl font-black text-gray-900">{data.buyerOrders.length}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">My Purchases</span>
          </Link>

          <Link to="/favorites" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex flex-col items-center text-center">
            <Heart className="w-5 h-5 text-rose-600 mb-1.5" />
            <span className="text-xl font-black text-gray-900">{data.favorites.length}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Favorites</span>
          </Link>

          <Link to="/inquiries" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex flex-col items-center text-center">
            <MessageSquare className="w-5 h-5 text-blue-600 mb-1.5" />
            <span className="text-xl font-black text-gray-900">{data.buyerInquiries.length + data.sellerInquiries.length}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">My Inquiries</span>
          </Link>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
            <ShoppingBag className="w-5 h-5 text-amber-600 mb-1.5" />
            <span className="text-xl font-black text-gray-900">{data.sellerOrders.length}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Sales Orders</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-sm font-black text-gray-900 mb-2 truncate max-w-full">
              ₹{totalSalesRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-auto">Sales Revenue</span>
          </div>
        </div>

        {/* Details Grid */}
        {loading ? (
          <LoadingSpinner message="Loading your activity logs..." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Listings */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Car className="w-4 h-4 text-indigo-600" /> Recent Vehicle Listings
                </h3>
                <Link to="/my-listings" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Manage Listings ({data.listings.length}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.listings.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">You haven't listed any vehicles yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.listings.slice(0, 3).map((veh) => (
                    <div key={veh._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={veh.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80'}
                          alt={veh.title}
                          className="w-12 h-12 object-cover rounded-lg border"
                        />
                        <div>
                          <Link to={`/vehicles/${veh._id}`} className="text-sm font-bold text-gray-900 hover:text-blue-600 line-clamp-1">
                            {veh.title}
                          </Link>
                          <span className="text-xs text-gray-500">₹{veh.price?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 capitalize">
                        {veh.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Purchases */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" /> Recent Purchases
                </h3>
                <Link to="/my-purchases" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  My Orders ({data.buyerOrders.length}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.buyerOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">You haven't purchased any vehicles yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.buyerOrders.slice(0, 3).map((ord) => (
                    <div key={ord._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={ord.vehicleId?.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80'}
                          alt={ord.vehicleId?.title}
                          className="w-12 h-12 object-cover rounded-lg border"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{ord.vehicleId?.title || 'Vehicle'}</h4>
                          <span className="text-xs text-gray-500">₹{ord.amount?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 capitalize">
                        {ord.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UnifiedDashboard;
