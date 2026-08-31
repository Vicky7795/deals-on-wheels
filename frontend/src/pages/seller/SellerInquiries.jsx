import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';

const SellerInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Response modal state
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);

  const fetchSellerInquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inquiries/seller');
      if (res.data.success) {
        setInquiries(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load seller inquiries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerInquiries();
  }, []);

  const handleRespondSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInquiry || !responseText.trim()) return;

    setResponding(true);
    try {
      const res = await api.post(`/inquiries/${selectedInquiry._id}/respond`, {
        response: responseText.trim()
      });
      if (res.data.success) {
        setInquiries(prev =>
          prev.map(inq =>
            inq._id === selectedInquiry._id
              ? { ...inq, status: 'responded', response: responseText.trim() }
              : inq
          )
        );
        setSelectedInquiry(null);
        setResponseText('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send response.');
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="seller" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-600" /> Customer Inquiries
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review and reply to prospective buyer messages for your vehicle listings</p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading customer inquiries..." />
        ) : inquiries.length === 0 ? (
          <EmptyState
            title="No inquiries received yet"
            description="When buyers contact you about your vehicle listings, their messages will appear here for you to respond."
            icon={MessageSquare}
          />
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => {
              const veh = inq.vehicleId;
              const buyer = inq.buyerId;
              return (
                <div key={inq._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Inquiry for: <span className="text-blue-600">{veh?.title || 'Vehicle'}</span>
                      </h3>
                      <p className="text-xs text-gray-500">
                        From Buyer: <span className="font-bold text-gray-800">{buyer?.name}</span> ({buyer?.email} | {buyer?.phone})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={inq.status === 'responded' ? 'green' : 'amber'}>
                        {inq.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Inquiry content */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buyer Message:</span>
                    <p className="text-sm text-gray-900 leading-relaxed font-medium">"{inq.message}"</p>
                  </div>

                  {/* Previous Response */}
                  {inq.response && (
                    <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 space-y-1">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Your Response:
                      </span>
                      <p className="text-sm text-gray-900 leading-relaxed font-medium">{inq.response}</p>
                    </div>
                  )}

                  {/* Reply Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      variant={inq.status === 'responded' ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => {
                        setSelectedInquiry(inq);
                        setResponseText(inq.response || '');
                      }}
                      icon={Send}
                    >
                      {inq.status === 'responded' ? 'Update Response' : 'Reply to Buyer'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Response Modal */}
        <Modal
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          title={`Reply to ${selectedInquiry?.buyerId?.name || 'Buyer'}`}
        >
          <form onSubmit={handleRespondSubmit} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-600">
              <span className="font-bold">Original Message:</span> "{selectedInquiry?.message}"
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Your Reply Message *</label>
              <textarea
                rows={4}
                required
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response to the buyer regarding price, test drive availability, or vehicle condition..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="md" onClick={() => setSelectedInquiry(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={responding} icon={Send}>
                Send Response
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default SellerInquiries;
