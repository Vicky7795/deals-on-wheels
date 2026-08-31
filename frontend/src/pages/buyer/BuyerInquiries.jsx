import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import api from '../../services/api';
import { MessageSquare, Calendar, MapPin, User, CheckCircle, Clock } from 'lucide-react';

const BuyerInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inquiries/buyer');
      if (res.data.success) {
        setInquiries(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load inquiries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'responded') return <Badge variant="green">Responded by Seller</Badge>;
    if (status === 'closed') return <Badge variant="gray">Closed</Badge>;
    return <Badge variant="amber">Pending Response</Badge>;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" /> My Vehicle Inquiries
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track messages and seller responses for vehicles you inquired about</p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your inquiries..." />
        ) : inquiries.length === 0 ? (
          <EmptyState
            title="No inquiries yet"
            description="When you contact a seller on any vehicle details page, your message history will appear here."
            icon={MessageSquare}
            actionLabel="Browse Vehicles"
            onAction={() => window.location.href = '/browse'}
          />
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => {
              const veh = inq.vehicleId;
              const seller = inq.sellerId;
              return (
                <div key={inq._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                      {veh?.images?.[0] && (
                        <img
                          src={veh.images[0]}
                          alt={veh.title}
                          className="w-12 h-12 object-cover rounded-xl border border-gray-200"
                        />
                      )}
                      <div>
                        {veh ? (
                          <Link to={`/vehicles/${veh._id}`} className="text-base font-bold text-gray-900 hover:text-blue-600">
                            {veh.title}
                          </Link>
                        ) : (
                          <span className="text-sm font-bold text-gray-700">Vehicle (Unavailable)</span>
                        )}
                        <p className="text-xs text-gray-500">Seller: <span className="font-semibold text-gray-800">{seller?.name || 'Seller'}</span> ({seller?.city || ''})</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(inq.status)}
                      <span className="text-xs text-gray-400">
                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Buyer Inquiry Message */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-1">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Your Message:</span>
                    <p className="text-sm text-gray-800 leading-relaxed">{inq.message}</p>
                  </div>

                  {/* Seller Response Box if responded */}
                  {inq.status === 'responded' && inq.response && (
                    <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Seller Reply from {seller?.name}:
                        </span>
                        {seller?.phone && (
                          <span className="text-xs text-emerald-700 font-semibold">Phone: {seller.phone}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 leading-relaxed font-medium">{inq.response}</p>
                    </div>
                  )}

                  {inq.status === 'pending' && (
                    <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg flex items-center gap-1.5 border border-amber-200">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Waiting for seller's reply. You will be notified as soon as the seller responds.</span>
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

export default BuyerInquiries;
