import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { Settings } from 'lucide-react';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    platformName: 'Deals on Wheels',
    commissionPercentage: 1.0,
    maxImageCount: 5,
    listingRules: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: name === 'commissionPercentage' || name === 'maxImageCount' ? Number(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const res = await api.put('/admin/settings', settings);
      if (res.data.success) {
        setSettings(res.data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-600" />
            Platform Configuration Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Configure global parameters, commission percentages, maximum listing image sizes, and support channels.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-2xl space-y-6">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">Settings saved successfully!</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Platform Name</label>
                <input
                  type="text"
                  name="platformName"
                  value={settings.platformName}
                  onChange={handleChange}
                  required
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  name="commissionPercentage"
                  value={settings.commissionPercentage}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Max Listing Photos</label>
                <input
                  type="number"
                  name="maxImageCount"
                  value={settings.maxImageCount}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Support Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleChange}
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Support Contact Number</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={settings.contactPhone}
                  onChange={handleChange}
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Listing Auditing Guidelines</label>
                <textarea
                  name="listingRules"
                  value={settings.listingRules}
                  onChange={handleChange}
                  rows={4}
                  className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button type="submit" loading={submitting}>
                Save Configurations
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default AdminSettings;
