import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { ShoppingBag, Calendar, Phone, Mail, CheckCircle, FileText } from 'lucide-react';


const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const fetchSellerOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/seller');
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load seller orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to mark this order as completed? This signifies you have handed over the vehicle key and documents to the buyer.')) {
      return;
    }

    setCompleting(true);
    try {
      const res = await api.patch(`/orders/${orderId}/complete`);
      if (res.data.success) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'completed' } : o));
        alert('Order completed successfully! Listing is now marked as sold.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete order');
    } finally {
      setCompleting(false);
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
    }).format(val);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="seller" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-purple-600" /> Vehicle Sales Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">Confirmed orders placed by buyers for your vehicle listings</p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your sales orders..." />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders received yet"
            description="When buyers purchase your listed vehicles, confirmed order details and buyer contact information will appear here."
            icon={ShoppingBag}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => {
              const veh = ord.vehicleId;
              const buyer = ord.buyerId;
              return (
                <div key={ord._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-xs text-gray-400 font-mono">ORDER ID: {ord._id}</span>
                      <h3 className="text-lg font-bold text-gray-900">
                        {veh?.title || 'Vehicle Listing'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusBadgeVariant(ord.status)}>{ord.status}</Badge>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Total Sale Price</span>
                      <span className="text-lg font-extrabold text-blue-600">{formatPrice(ord.amount)}</span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Buyer Full Name</span>
                      <span className="font-bold text-gray-800">{buyer?.name || 'Buyer'}</span>
                      <p className="text-xs text-gray-500">{buyer?.city}, {buyer?.state}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Buyer Phone & Email</span>
                      <span className="font-bold text-gray-800 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-blue-600" /> {buyer?.phone}
                      </span>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /> {buyer?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <a
                      href={`/api/orders/${ord._id}/invoice?token=${localStorage.getItem('token')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 rounded-lg text-xs font-bold transition-colors"
                    >

                      <FileText className="w-4 h-4" /> Download Invoice (PDF)
                    </a>

                    {ord.status === 'confirmed' && (
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => handleCompleteOrder(ord._id)}
                        isLoading={completing}
                        icon={CheckCircle}
                      >
                        Handover Completed
                      </Button>
                    )}
                    {ord.status === 'completed' && (
                      <span className="text-xs text-emerald-600 font-bold italic flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
                        ✓ Vehicle Delivered / Sold
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SellerOrders;
