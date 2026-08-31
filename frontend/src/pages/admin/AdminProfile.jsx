import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { User, Lock, Save } from 'lucide-react';

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: '', phone: '', email: '', profileImage: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/profile');
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      const res = await api.put('/users/profile', {
        name: profile.name,
        phone: profile.phone,
        profileImage: profile.profileImage
      });
      if (res.data.success) {
        setProfile(res.data.data);
        setProfileSuccess(true);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setSubmittingPassword(true);
    setPassError('');
    setPassSuccess(false);

    try {
      const res = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res.data.success) {
        setPassSuccess(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      }
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <User className="w-8 h-8 text-blue-600" />
            Admin Profile Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Configure your personal name, support phone number, and change passwords.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
            {/* Personal Details Form */}
            <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" /> Account Details
              </h2>
              {profileError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{profileError}</div>}
              {profileSuccess && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">Account updated successfully!</div>}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  title="Email cannot be updated casually."
                  className="w-full text-sm rounded-lg border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  required
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={profile.profileImage || ''}
                  onChange={(e) => setProfile({ ...profile, profileImage: e.target.value })}
                  placeholder="URL pointing to profile image..."
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" loading={submittingProfile}>
                  <Save className="w-4 h-4 mr-1.5 inline" /> Save Profile
                </Button>
              </div>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-500" /> Security Controls
              </h2>
              {passError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{passError}</div>}
              {passSuccess && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">Password updated successfully!</div>}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={8}
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                  required
                  minLength={8}
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" loading={submittingPassword}>
                  <Lock className="w-4 h-4 mr-1.5 inline" /> Update Password
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProfile;
