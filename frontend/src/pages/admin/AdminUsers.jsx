import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { Users, Search, AlertCircle } from 'lucide-react';

const AdminUsers = ({ roleFilter = '' }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState(roleFilter || '');
  const [status, setStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (role) queryParams.append('role', role);
      if (status) queryParams.append('status', status);
      if (search) queryParams.append('search', search);

      const res = await api.get(`/admin/users?${queryParams.toString()}`);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [role, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    setUpdating(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, accountStatus: newStatus } : u));
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser({ ...selectedUser, accountStatus: newStatus });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeVariant = (stat) => {
    if (stat === 'active') return 'success';
    if (stat === 'suspended') return 'warning';
    return 'danger';
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            {roleFilter ? `${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)} Management` : 'User Accounts'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Suspend, activate, block, or review registered platform members.</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 pl-10 pr-4 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </form>

          <div className="flex w-full md:w-auto gap-4">
            {!roleFilter && (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full md:w-40"
              >
                <option value="">All Roles</option>
                <option value="user">Users Only</option>
                <option value="admin">Admins Only</option>
              </select>
            )}

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full md:w-40"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="blocked">Blocked</option>
            </select>

            <Button variant="secondary" onClick={fetchUsers}>Filter</Button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <DataTable
            headers={['Name', 'Email & Phone', 'Listings', 'Purchases', 'Reports', 'Status', 'Registered Date', 'Actions']}
            data={users}
            emptyMessage="No users found matching your filters."
            renderRow={(u) => (
              <tr key={u._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {u.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div>{u.email}</div>
                  <div className="text-xs text-gray-400">{u.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                  {u.listingsCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                  {u.purchasesCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-rose-600">
                  {u.reportsCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge variant={getStatusBadgeVariant(u.accountStatus)}>{u.accountStatus}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => setSelectedUser(u)}
                  >
                    View Details
                  </Button>
                  {u.accountStatus !== 'active' && (
                    <Button
                      variant="primary"
                      size="small"
                      disabled={updating === u._id}
                      onClick={() => handleUpdateStatus(u._id, 'active')}
                    >
                      Activate
                    </Button>
                  )}
                  {u.accountStatus === 'active' && (
                    <Button
                      variant="warning"
                      size="small"
                      disabled={updating === u._id}
                      onClick={() => handleUpdateStatus(u._id, 'suspended')}
                    >
                      Suspend
                    </Button>
                  )}
                  {u.accountStatus !== 'blocked' && (
                    <Button
                      variant="danger"
                      size="small"
                      disabled={updating === u._id}
                      onClick={() => handleUpdateStatus(u._id, 'blocked')}
                    >
                      Block
                    </Button>
                  )}
                </td>
              </tr>
            )}
          />
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 relative border border-gray-100">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
              <div>
                <h3 className="text-lg font-black text-gray-900">User Profile Details</h3>
                <p className="text-xs text-gray-500">Registered platform profile specifications.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedUser.name}</h4>
                    <span className="text-xs text-gray-400 capitalize">{selectedUser.role} Account</span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 border-y border-gray-100 text-sm py-2">
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500 font-semibold">Email</span>
                    <span className="text-gray-900">{selectedUser.email}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500 font-semibold">Phone</span>
                    <span className="text-gray-900">{selectedUser.phone}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500 font-semibold">City/State</span>
                    <span className="text-gray-900">{selectedUser.city || 'N/A'}, {selectedUser.state || 'N/A'}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500 font-semibold">Account Status</span>
                    <Badge variant={getStatusBadgeVariant(selectedUser.accountStatus)}>{selectedUser.accountStatus}</Badge>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500 font-semibold">Total Listings</span>
                    <span className="text-gray-900 font-bold">{selectedUser.listingsCount || 0}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500 font-semibold">Active / Sold</span>
                    <span className="text-gray-900 font-bold">
                      {selectedUser.activeListingsCount || 0} active / {selectedUser.soldListingsCount || 0} sold
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500 font-semibold">Total Purchases</span>
                    <span className="text-gray-900 font-bold">{selectedUser.purchasesCount || 0}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500 font-semibold">Reports Generated</span>
                    <span className="text-gray-900 font-bold text-rose-600">{selectedUser.reportsCount || 0}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-gray-500 font-semibold">Registered Since</span>
                    <span className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status warning/summary */}
                {selectedUser.accountStatus !== 'active' && (
                  <div className="p-3.5 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Suspended/blocked users cannot publish new listings or perform write operations on the marketplace.</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsers;
