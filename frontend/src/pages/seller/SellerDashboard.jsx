import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Car, PlusCircle, ShoppingBag, MessageSquare, IndianRupee, ArrowRight, CheckCircle } from 'lucide-react';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { totalListings: 0, activeListings: 0, soldVehicles: 0, totalSales: 0 },
    recentListings: [],
    recentInquiries: [],
    recentOrders: []
  });

  const fetchSellerStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles/seller/stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load seller stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerStats();
  }, []);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="seller" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome, {user?.name}!</h1>
            <p className="text-gray-300 text-sm mt-1">Manage your vehicle inventory, customer inquiries, and sales performance.</p>
          </div>
          <Link to="/seller/vehicles/add">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Add New Vehicle
            </button>
          </Link>
        </div>

        {/* Dashboard Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-gray-900">{data.stats.totalListings}</span>
              <p className="text-xs text-gray-500 font-medium">Total Listings</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-gray-900">{data.stats.activeListings}</span>
              <p className="text-xs text-gray-500 font-medium">Active Listings</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-gray-900">{data.stats.soldVehicles}</span>
              <p className="text-xs text-gray-500 font-medium">Sold Vehicles</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black text-gray-900 truncate block">{formatPrice(data.stats.totalSales)}</span>
              <p className="text-xs text-gray-500 font-medium">Total Sales Revenue</p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        {loading ? (
          <LoadingSpinner message="Fetching dashboard analytics..." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Vehicles */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600" /> Recent Listings
                </h3>
                <Link to="/seller/vehicles" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  My Vehicles ({data.stats.totalListings}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.recentListings.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">You haven't listed any vehicles yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentListings.map((veh) => (
                    <div key={veh._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={veh.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80'}
                          alt={veh.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{veh.title}</h4>
                          <span className="text-xs text-gray-500">{formatPrice(veh.price)}</span>
                        </div>
                      </div>
                      <Badge variant={veh.status === 'sold' ? 'red' : 'green'}>
                        {veh.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Inquiries */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600" /> Recent Inquiries
                </h3>
                <Link to="/seller/inquiries" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data.recentInquiries.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No customer inquiries received yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentInquiries.map((inq) => (
                    <div key={inq._id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-900">{inq.buyerId?.name || 'Buyer'}</span>
                        <Badge variant={inq.status === 'responded' ? 'green' : 'amber'}>{inq.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1">"{inq.message}"</p>
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

export default SellerDashboard;
