import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { Bell, CheckCheck, Check } from 'lucide-react';

const SellerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="seller" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" /> Notifications
            </h1>
            <p className="text-sm text-gray-500 mt-1">Updates regarding your vehicle inquiries and sales orders</p>
          </div>

          {notifications.some(n => !n.isRead) && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} icon={CheckCheck}>
              Mark All as Read
            </Button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner message="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You're all caught up! New inquiry and sale alerts will appear here."
            icon={Bell}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  !notif.isRead ? 'bg-blue-50/50 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm text-gray-900">{notif.message}</p>
                  <span className="text-xs text-gray-400 block">
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkRead(notif._id)}
                    className="text-xs text-blue-600 font-semibold border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1 flex-shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SellerNotifications;
