import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Calendar, MapPin, User, CheckCircle, Clock, Send } from 'lucide-react';

const Inquiries = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' or 'received'
  const [sentInquiries, setSentInquiries] = useState([]);
  const [receivedInquiries, setReceivedInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inline reply text state keyed by inquiry ID
  const [replyTexts, setReplyTexts] = useState({});
  const [sendingReplies, setSendingReplies] = useState({});

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const [sentRes, receivedRes] = await Promise.all([
        api.get('/inquiries/buyer').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/inquiries/seller').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (sentRes.data.success) setSentInquiries(sentRes.data.data || []);
      if (receivedRes.data.success) setReceivedInquiries(receivedRes.data.data || []);
    } catch (e) {
      console.error('Failed to load inquiries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleSendReply = async (inquiryId) => {
    const text = replyTexts[inquiryId];
    if (!text || !text.trim()) return;

    setSendingReplies(prev => ({ ...prev, [inquiryId]: true }));
    try {
      const res = await api.post(`/inquiries/${inquiryId}/reply`, {
        text: text.trim()
      });
      if (res.data.success) {
        // Clear input text
        setReplyTexts(prev => ({ ...prev, [inquiryId]: '' }));
        
        // Update updated inquiry in both lists
        const updatedInq = res.data.data;
        setSentInquiries(prev => prev.map(inq => inq._id === inquiryId ? updatedInq : inq));
        setReceivedInquiries(prev => prev.map(inq => inq._id === inquiryId ? updatedInq : inq));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setSendingReplies(prev => ({ ...prev, [inquiryId]: false }));
    }
  };

  const getInquiryMessages = (inq) => {
    if (inq.messages && inq.messages.length > 0) {
      return inq.messages;
    }
    // Fallback for legacy inquiries
    const msgs = [{ senderId: inq.buyerId._id || inq.buyerId, text: inq.message, createdAt: inq.createdAt }];
    if (inq.response) {
      msgs.push({ senderId: inq.sellerId._id || inq.sellerId, text: inq.response, createdAt: inq.updatedAt });
    }
    return msgs;
  };

  const getStatusBadge = (status) => {
    if (status === 'responded') return <Badge variant="green">Responded</Badge>;
    if (status === 'closed') return <Badge variant="gray">Closed</Badge>;
    return <Badge variant="amber">Pending Response</Badge>;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="user" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" /> My Inquiries
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage inquiries you've sent as a buyer or received for your listed vehicles</p>
          </div>

          {/* Tabs selector */}
          <div className="flex bg-gray-200 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'sent' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inquiries I Sent ({sentInquiries.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'received' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inquiries I Received ({receivedInquiries.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading inquiries..." />
        ) : activeTab === 'sent' ? (
          /* Sent Inquiries Tab (Buyer Mode) */
          sentInquiries.length === 0 ? (
            <EmptyState
              title="No inquiries sent yet"
              description="When you click 'Contact Seller' on any vehicle page, your inquiries will appear here."
              icon={MessageSquare}
              actionLabel="Browse Vehicles"
              onAction={() => window.location.href = '/browse'}
            />
          ) : (
            <div className="space-y-4">
              {sentInquiries.map((inq) => {
                const veh = inq.vehicleId;
                const seller = inq.sellerId;
                return (
                  <div key={inq._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
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

                    {/* Chat Messages Log */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3 max-h-80 overflow-y-auto">
                      {getInquiryMessages(inq).map((msg, idx) => {
                        const isMsgFromBuyer = (msg.senderId._id || msg.senderId) === inq.buyerId._id;
                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isMsgFromBuyer ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                isMsgFromBuyer
                                  ? 'bg-blue-600 text-white rounded-tr-none'
                                  : 'bg-gray-200 text-gray-800 rounded-tl-none'
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                              {isMsgFromBuyer ? 'You' : (seller?.name || 'Seller')} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reply Input Form */}
                    {inq.status !== 'closed' && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendReply(inq._id);
                        }}
                        className="flex items-center gap-2 mt-4"
                      >
                        <input
                          type="text"
                          required
                          value={replyTexts[inq._id] || ''}
                          onChange={(e) => setReplyTexts({ ...replyTexts, [inq._id]: e.target.value })}
                          placeholder="Type a message to follow up..."
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          isLoading={sendingReplies[inq._id]}
                          icon={Send}
                        >
                          Send
                        </Button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Received Inquiries Tab (Seller Mode) */
          receivedInquiries.length === 0 ? (
            <EmptyState
              title="No inquiries received yet"
              description="When other users contact you about your vehicle listings, their messages will appear here."
              icon={MessageSquare}
            />
          ) : (
            <div className="space-y-4">
              {receivedInquiries.map((inq) => {
                const veh = inq.vehicleId;
                const buyer = inq.buyerId;
                return (
                  <div key={inq._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">
                          Inquiry for: <span className="text-indigo-600">{veh?.title || 'Vehicle'}</span>
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

                    {/* Chat Messages Log */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3 max-h-80 overflow-y-auto">
                      {getInquiryMessages(inq).map((msg, idx) => {
                        const isMsgFromBuyer = (msg.senderId._id || msg.senderId) === inq.buyerId._id;
                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isMsgFromBuyer ? 'items-start' : 'items-end'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                isMsgFromBuyer
                                  ? 'bg-gray-200 text-gray-800 rounded-tl-none'
                                  : 'bg-emerald-600 text-white rounded-tr-none'
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                              {isMsgFromBuyer ? (buyer?.name || 'Buyer') : 'You'} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reply Input Form */}
                    {inq.status !== 'closed' && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendReply(inq._id);
                        }}
                        className="flex items-center gap-2 mt-4"
                      >
                        <input
                          type="text"
                          required
                          value={replyTexts[inq._id] || ''}
                          onChange={(e) => setReplyTexts({ ...replyTexts, [inq._id]: e.target.value })}
                          placeholder="Type a message to reply..."
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          isLoading={sendingReplies[inq._id]}
                          icon={Send}
                        >
                          Send
                        </Button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Inquiries;
