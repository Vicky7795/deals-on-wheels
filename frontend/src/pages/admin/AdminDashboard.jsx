import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard from '../../components/common/StatsCard';
import api from '../../services/api';
import {
  Users,
  Car,
  ShoppingBag,
  IndianRupee,
  Activity,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      users: { totalUsers: 0, totalBuyers: 0, totalSellers: 0, activeUsers: 0, suspendedUsers: 0, blockedUsers: 0 },
      vehicles: { totalVehicles: 0, pendingListings: 0, approvedListings: 0, rejectedListings: 0, soldVehicles: 0 },
      orders: { totalOrders: 0, confirmedOrders: 0, completedOrders: 0, cancelledOrders: 0 },
      revenue: { totalTransactionValue: 0, platformCommission: 0, pendingCommission: 0 }
    },
    recentLogs: [],
    charts: { orderAnalytics: [], userAnalytics: [], vehicleAnalytics: [] }
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
        <DashboardSidebar role="admin" />
        <main className="flex-1 flex justify-center items-center"><LoadingSpinner /></main>
      </div>
    );
  }

  const { stats, recentLogs } = dashboardData;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, Admin</h1>
            <p className="text-gray-300 text-sm mt-1">Platform management operations dashboard. Control listings, verify payments, and check analytics.</p>
          </div>
          <Activity className="w-12 h-12 text-blue-400 hidden sm:block animate-pulse" />
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.users.totalUsers}
            icon={Users}
            description="All platform accounts"
          />
          <StatsCard
            title="Total Buyers"
            value={stats.users.totalBuyers}
            icon={Users}
            description="Registered buyers"
          />
          <StatsCard
            title="Total Sellers"
            value={stats.users.totalSellers}
            icon={Users}
            description="Registered sellers"
          />
          <StatsCard
            title="Total Vehicles"
            value={stats.vehicles.totalVehicles}
            icon={Car}
            description="Listed catalog units"
          />
          <StatsCard
            title="Pending Approvals"
            value={stats.vehicles.pendingListings}
            icon={Car}
            description="Awaiting listing audit"
          />
          <StatsCard
            title="Total Orders"
            value={stats.orders.totalOrders}
            icon={ShoppingBag}
            description="Purchases initiated"
          />
          <StatsCard
            title="Total Sales"
            value={formatPrice(stats.revenue.totalTransactionValue)}
            icon={IndianRupee}
            description="Gross merchandise volume"
          />
          <StatsCard
            title="Platform Commission"
            value={formatPrice(stats.revenue.platformCommission)}
            icon={IndianRupee}
            description="Marketplace earnings"
          />
        </div>

        {/* Detailed Stats Subsections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Statuses Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" /> User Accounts
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Active</span>
                <span className="text-gray-900 bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">{stats.users.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Suspended</span>
                <span className="text-gray-900 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-bold">{stats.users.suspendedUsers}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Blocked</span>
                <span className="text-gray-900 bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold">{stats.users.blockedUsers}</span>
              </div>
            </div>
            <Link to="/admin/users" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-4">
              View All Users <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Listings Approval Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-gray-500" /> Listings Verification
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Awaiting Review</span>
                <span className="text-gray-900 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">{stats.vehicles.pendingListings}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Approved Listings</span>
                <span className="text-gray-900 bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">{stats.vehicles.approvedListings}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Rejected Listings</span>
                <span className="text-gray-900 bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold">{stats.vehicles.rejectedListings}</span>
              </div>
            </div>
            <Link to="/admin/vehicles/pending" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-4">
              Go to Approvals <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Orders / Payments Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-500" /> Transactions & Sales
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Gross Sales Value</span>
                <span className="text-gray-900 font-bold">{formatPrice(stats.revenue.totalTransactionValue)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Commissions Collected</span>
                <span className="text-emerald-600 font-extrabold">{formatPrice(stats.revenue.platformCommission)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-500">Settlements Pending</span>
                <span className="text-gray-900 font-bold">{formatPrice(stats.revenue.pendingCommission)}</span>
              </div>
            </div>
            <Link to="/admin/commissions" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 mt-4">
              Payout Control <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Custom Visual Data Representation (Monthly Payout & Volume Trends) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Monthly Commission & Volume Trends
            </h3>
            <span className="text-xs text-gray-400 font-medium">Auto-generated mock visual representation</span>
          </div>

          {/* custom styling graphic representing commission chart */}
          <div className="h-48 flex items-end gap-3 pt-6 border-b border-gray-200 px-4">
            {[45, 60, 52, 75, 90, 85, 110, 130, 95, 120, 140, 160].map((height, i) => {
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="relative w-full">
                    <div
                      style={{ height: `${height * 0.8}px` }}
                      className="w-full bg-blue-600 rounded-t-lg group-hover:bg-indigo-600 transition-colors shadow-sm"
                    />
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none whitespace-nowrap z-10 shadow">
                      ₹{(height * 1000).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 group-hover:text-gray-700">{months[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Log / Activity Log Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" /> Recent Administrative Activity Log
          </h3>
          <div className="divide-y divide-gray-100">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log._id} className="py-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-sm text-gray-700">
                  <div>
                    <span className="font-bold text-gray-900">{log.adminId?.name || 'Admin'}</span>{' '}
                    <span>{log.action}</span>
                    <span className="text-xs text-gray-400 ml-2 font-medium bg-gray-100 border px-1.5 py-0.5 rounded capitalize">
                      {log.relatedEntity}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-gray-500 text-center">No recent administrative action logs recorded.</p>
            )}
          </div>
          <Link to="/admin/dashboard" className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 mt-4">
            View Platform Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
