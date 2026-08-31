import React, { useState } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Phone, MapPin, Lock, Save, CheckCircle } from 'lucide-react';

const BuyerProfile = () => {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    state: user?.state || '',
    profileImage: user?.profileImage || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ error: '', success: '' });
  const [passwordMsg, setPasswordMsg] = useState({ error: '', success: '' });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ error: '', success: '' });

    setSavingProfile(true);
    try {
      const res = await api.put('/users/profile', profileData);
      if (res.data.success) {
        updateUser(res.data.data);
        setProfileMsg({ error: '', success: 'Profile updated successfully!' });
      }
    } catch (err) {
      setProfileMsg({ error: err.response?.data?.message || 'Failed to update profile.', success: '' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ error: '', success: '' });

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordMsg({ error: 'New password and confirm new password do not match.', success: '' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put('/users/change-password', passwordData);
      if (res.data.success) {
        setPasswordMsg({ error: '', success: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      }
    } catch (err) {
      setPasswordMsg({ error: err.response?.data?.message || 'Failed to change password.', success: '' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" /> Buyer Profile & Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account details and security settings</p>
        </div>

        {/* Profile Details Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Personal Details</h3>

          {profileMsg.error && <ErrorMessage message={profileMsg.error} />}
          {profileMsg.success && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {profileMsg.success}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address (Read only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">City</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">State</label>
                <input
                  type="text"
                  value={profileData.state}
                  onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="md" isLoading={savingProfile} icon={Save}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Password Change Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-600" /> Change Security Password
          </h3>

          {passwordMsg.error && <ErrorMessage message={passwordMsg.error} />}
          {passwordMsg.success && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {passwordMsg.success}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Verify current password"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 max-w-md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">New Password (Min 8 chars) *</label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmNewPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                  placeholder="Re-type new password"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="secondary" size="md" isLoading={savingPassword} icon={Lock}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BuyerProfile;
