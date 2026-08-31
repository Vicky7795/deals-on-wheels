import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import api from '../../services/api';
import { ShoppingBag, Calendar, MapPin, CheckCircle, ShieldCheck, FileText } from 'lucide-react';


const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/buyer');
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" /> My Vehicle Orders & Purchases
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review confirmed orders and purchase receipts</p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading orders..." />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="You haven't purchased any vehicles yet. Explore available listings and purchase your dream vehicle today."
            icon={ShoppingBag}
            actionLabel="Browse Vehicles"
            onAction={() => window.location.href = '/browse'}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => {
              const veh = ord.vehicleId;
              const seller = ord.sellerId;
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
                      <Badge variant={
                        (ord.status === 'confirmed' || ord.status === 'completed') ? 'green' :
                        ord.status === 'payment_pending' ? 'warning' :
                        (ord.status === 'cancelled' || ord.status === 'failed') ? 'danger' : 'blue'
                      }>{ord.status.replace(/_/g, ' ')}</Badge>
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
                      <span className="text-xs font-semibold text-gray-500 block">Purchase Amount</span>
                      <span className="text-lg font-extrabold text-blue-600">{formatPrice(ord.amount)}</span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Seller Name</span>
                      <span className="font-bold text-gray-800">{seller?.name || 'Seller'}</span>
                      <p className="text-xs text-gray-500">{seller?.city}, {seller?.state}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Seller Contact Phone</span>
                      <span className="font-bold text-gray-800">{seller?.phone || 'Available'}</span>
                      <p className="text-xs text-gray-500">{seller?.email}</p>
                    </div>
                  </div>

                  {veh && (
                    <div className="flex items-center justify-between pt-2">
                      <Link to={`/vehicles/${veh._id}`} className="text-xs font-bold text-blue-600 hover:underline">
                        View Vehicle Listing Details →
                      </Link>
                      <div className="flex items-center gap-3">
                        <a
                          href={`/api/orders/${ord._id}/invoice?token=${localStorage.getItem('token')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 rounded-lg text-xs font-bold transition-colors"
                        >

                          <FileText className="w-4 h-4" /> Download Invoice (PDF)
                        </a>
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Order Verified
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BuyerOrders;
