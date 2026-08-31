import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import api from '../../services/api';
import { CreditCard, IndianRupee, TrendingUp } from 'lucide-react';

const SellerPayments = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSales: 0, platformFees: 0, netPayout: 0 });
  const [commissions, setCommissions] = useState([]);

  const fetchPaymentsData = async () => {
    setLoading(true);
    try {
      // Get all seller orders to calculate payouts and list them
      const res = await api.get('/orders/seller');
      if (res.data.success) {
        const orders = res.data.data.filter(o => o.status !== 'cancelled' && o.status !== 'payment_pending');
        
        const totalSales = orders.reduce((sum, o) => sum + o.amount, 0);
        const platformFees = orders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
        const netPayout = orders.reduce((sum, o) => sum + (o.sellerAmount || 0), 0);

        setStats({ totalSales, platformFees, netPayout });
        setCommissions(orders);
      }
    } catch (e) {
      console.error('Failed to fetch payments/payouts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
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
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-blue-600" />
            My Payouts & Commissions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track your sales proceeds, platform commission deductions, and processed bank transfers.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Gross Sales</span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mt-2">{formatPrice(stats.totalSales)}</h3>
            <p className="text-xs text-gray-400 mt-1">Total revenue generated from sales</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Platform Commission</span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Deducted</span>
            </div>
            <h3 className="text-2xl font-black text-red-600 mt-2">{formatPrice(stats.platformFees)}</h3>
            <p className="text-xs text-gray-400 mt-1">Platform service fees (e.g. 1.5%)</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-blue-800 uppercase tracking-wider">Net Payout Amount</span>
              <IndianRupee className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-3xl font-black text-blue-900 mt-2">{formatPrice(stats.netPayout)}</h3>
            <p className="text-xs text-blue-700 mt-1">Settled to your verified bank account</p>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Payout Records</h2>
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <DataTable
              headers={['Order Date', 'Vehicle Title', 'Vehicle Price', 'Platform Fee', 'Net Payout', 'Payout Status']}
              data={commissions}
              emptyMessage="No completed sales payouts found."
              renderRow={(order) => (
                <tr key={order._id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {order.vehicleId?.title || 'Unknown Vehicle'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatPrice(order.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    - {formatPrice(order.platformFee)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-bold">
                    {formatPrice(order.sellerAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.status === 'completed' ? (
                      <Badge variant="success">Settled</Badge>
                    ) : (
                      <Badge variant="warning">Payout Pending</Badge>
                    )}
                  </td>
                </tr>
              )}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerPayments;
