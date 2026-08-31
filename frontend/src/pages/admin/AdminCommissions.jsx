import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { IndianRupee } from 'lucide-react';

const AdminCommissions = () => {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/admin/commissions?status=${statusFilter}` : '/admin/commissions';
      const res = await api.get(url);
      if (res.data.success) {
        setCommissions(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load admin commissions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [statusFilter]);

  const handleProcessCommission = async (id) => {
    if (!window.confirm('Mark this seller payout commission as processed/completed? This signifies that the platform has settled the payout to the seller.')) {
      return;
    }

    setUpdating(id);
    try {
      const res = await api.patch(`/admin/commissions/${id}/process`);
      if (res.data.success) {
        setCommissions(commissions.map(c => c._id === id ? { ...c, status: 'processed' } : c));
        alert('Payout commission marked as processed successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process payout');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeVariant = (s) => {
    if (s === 'processed') return 'success';
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
            <IndianRupee className="w-8 h-8 text-blue-600" />
            Seller Payouts & Commissions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review gross sales volume, platform commission fee cuts, and trigger bank settlement payouts to sellers.</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-500">Filter Payout Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-48"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Settlement</option>
            <option value="processed">Processed / Settled</option>
            <option value="refunded">Refunded / Cancelled</option>
          </select>
        </div>

        {/* Commissions Table */}
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <DataTable
            headers={['Order ID', 'Seller Details', 'Sale Amount', 'Commission Fee %', 'Commission Earned', 'Net Seller Payout', 'Status', 'Actions']}
            data={commissions}
            emptyMessage="No platform payout commission logs found."
            renderRow={(c) => (
              <tr key={c._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                  {c.orderId?._id || c.orderId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <div className="font-semibold text-gray-900">{c.sellerId?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-400">{c.sellerId?.email || ''}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {formatPrice(c.saleAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 text-center">
                  {c.commissionPercentage}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                  {formatPrice(c.commissionAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-extrabold">
                  {formatPrice(c.sellerAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {c.status === 'pending' ? (
                    <Button
                      variant="primary"
                      size="small"
                      disabled={updating === c._id}
                      onClick={() => handleProcessCommission(c._id)}
                    >
                      Process Payout
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-400 font-semibold italic">Processed</span>
                  )}
                </td>
              </tr>
            )}
          />
        )}
      </main>
    </div>
  );
};

export default AdminCommissions;
