import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { CreditCard } from 'lucide-react';

const AdminPayments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/admin/payments?status=${statusFilter}` : '/admin/payments';
      const res = await api.get(url);
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load admin payments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const getStatusBadgeVariant = (s) => {
    if (s === 'successful') return 'success';
    if (s === 'pending') return 'warning';
    return 'danger';
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-blue-600" />
            Payment Gateway Transactions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Audit payment order sessions, gateway identifiers, and transaction statuses.</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-48"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <DataTable
            headers={['Order ID', 'Gateway Order ID', 'Gateway Payment ID', 'Buyer & Seller', 'Amount', 'Status', 'Paid At']}
            data={payments}
            emptyMessage="No payment gateway transactions found."
            renderRow={(p) => (
              <tr key={p._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                  {p.orderId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-600">
                  {p.gatewayOrderId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-900 font-bold">
                  {p.gatewayPaymentId || 'N/A'}
                </td>
                <td className="px-6 py-4 text-xs text-gray-600">
                  <div>Buyer: <span className="font-semibold text-gray-900">{p.buyerId?.name || 'Unknown'}</span></div>
                  <div>Seller: <span className="font-semibold text-gray-900">{p.sellerId?.name || 'Unknown'}</span></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {formatPrice(p.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge variant={getStatusBadgeVariant(p.status)}>{p.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                  {p.paidAt ? new Date(p.paidAt).toLocaleString() : 'N/A'}
                </td>
              </tr>
            )}
          />
        )}
      </main>
    </div>
  );
};

export default AdminPayments;
