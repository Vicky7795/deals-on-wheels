import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { ShoppingBag, Search, CreditCard, RefreshCw } from 'lucide-react';

const AdminOrders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/admin/orders?status=${statusFilter}` : '/admin/orders';
      const res = await api.get(url);
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load admin orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleRefund = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel and refund this order? This will release the vehicle listing back to available status.')) {
      return;
    }

    setUpdating(true);
    try {
      const res = await api.patch(`/admin/orders/${orderId}/refund`);
      if (res.data.success) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'refunded' } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: 'refunded' });
        }
        alert('Order has been cancelled and refunded successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to refund order');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeVariant = (s) => {
    if (s === 'completed') return 'success';
    if (s === 'confirmed' || s === 'reserved') return 'primary';
    if (s === 'payment_pending') return 'warning';
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
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            Marketplace Purchase Orders
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track purchase receipts, platforms commission breakdowns, and execute admin refunds.</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-48"
          >
            <option value="">All Orders</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="reserved">Reserved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <DataTable
            headers={['Order ID', 'Vehicle', 'Buyer & Seller', 'Amount', 'Order Status', 'Actions']}
            data={orders}
            emptyMessage="No marketplace purchase orders found."
            renderRow={(o) => (
              <tr key={o._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                  {o._id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {o.vehicleId?.title || 'Unknown Vehicle'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div>Buyer: <span className="font-semibold text-gray-900">{o.buyerId?.name || 'Unknown'}</span></div>
                  <div>Seller: <span className="font-semibold text-gray-900">{o.sellerId?.name || 'Unknown'}</span></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {formatPrice(o.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge variant={getStatusBadgeVariant(o.status)}>{o.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                  <Button variant="secondary" size="small" onClick={() => setSelectedOrder(o)}>
                    View Details
                  </Button>
                  {(o.status === 'confirmed' || o.status === 'reserved') && (
                    <Button
                      variant="danger"
                      size="small"
                      disabled={updating}
                      onClick={() => handleRefund(o._id)}
                    >
                      Refund
                    </Button>
                  )}
                </td>
              </tr>
            )}
          />
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-6 relative border border-gray-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
              <div>
                <h3 className="text-lg font-black text-gray-900">Order & Commission Details</h3>
                <p className="text-xs text-gray-500">Full specifications sheet for order ID: {selectedOrder._id}</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-sm">
                  <h4 className="font-bold text-gray-900">{selectedOrder.vehicleId?.title || 'Unknown Vehicle'}</h4>
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>Year: {selectedOrder.vehicleId?.year}</span>
                    <span>Price: {formatPrice(selectedOrder.vehicleId?.price)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-blue-50/50 border rounded-xl space-y-1.5">
                    <span className="font-bold text-blue-800 uppercase tracking-wide">Buyer Details</span>
                    <p className="font-semibold text-gray-900">{selectedOrder.buyerId?.name}</p>
                    <p className="text-gray-500">{selectedOrder.buyerId?.email}</p>
                    <p className="text-gray-500">{selectedOrder.buyerId?.phone}</p>
                  </div>
                  <div className="p-3 bg-purple-50/50 border rounded-xl space-y-1.5">
                    <span className="font-bold text-purple-800 uppercase tracking-wide">Seller Details</span>
                    <p className="font-semibold text-gray-900">{selectedOrder.sellerId?.name}</p>
                    <p className="text-gray-500">{selectedOrder.sellerId?.email}</p>
                    <p className="text-gray-500">{selectedOrder.sellerId?.phone}</p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 border-y border-gray-100 text-sm py-2">
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500 font-semibold">Total Price Paid</span>
                    <span className="text-gray-900 font-extrabold">{formatPrice(selectedOrder.amount)}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-red-500 font-semibold">Platform Commission Fee</span>
                    <span className="text-red-600 font-bold">- {formatPrice(selectedOrder.platformFee)}</span>
                  </div>
                  <div className="py-2 flex justify-between bg-emerald-50 px-2 rounded mt-1 font-bold">
                    <span className="text-emerald-800">Seller Payout Amount</span>
                    <span className="text-emerald-700">{formatPrice(selectedOrder.sellerAmount)}</span>
                  </div>
                  <div className="py-2 flex justify-between mt-1.5">
                    <span className="text-gray-500 font-semibold">Status</span>
                    <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
                {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'reserved') && (
                  <Button variant="danger" disabled={updating} onClick={() => handleRefund(selectedOrder._id)}>
                    Cancel & Refund
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminOrders;
