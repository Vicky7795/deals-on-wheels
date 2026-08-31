import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ApprovalModal from '../../components/common/ApprovalModal';
import api from '../../services/api';
import { Car, Search, ClipboardCheck } from 'lucide-react';

const AdminVehicles = ({ pendingOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [approvalStatus, setApprovalStatus] = useState(pendingOnly ? 'pending' : '');
  const [status, setStatus] = useState('');
  const [activeReviewVehicle, setActiveReviewVehicle] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (approvalStatus) queryParams.append('approvalStatus', approvalStatus);
      if (status) queryParams.append('status', status);
      if (search) queryParams.append('search', search);

      const res = await api.get(`/admin/vehicles?${queryParams.toString()}`);
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch admin vehicles list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [approvalStatus, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleActionComplete = () => {
    fetchVehicles();
    setActiveReviewVehicle(null);
  };

  const getApprovalBadge = (stat) => {
    if (stat === 'approved') return 'success';
    if (stat === 'pending') return 'warning';
    return 'danger';
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            {pendingOnly ? <ClipboardCheck className="w-8 h-8 text-yellow-500" /> : <Car className="w-8 h-8 text-blue-600" />}
            {pendingOnly ? 'Pending Vehicle Approvals' : 'All Vehicle Listings'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pendingOnly
              ? 'Review new and resubmitted seller listings for marketplace publication.'
              : 'Monitor, approve, reject, or delete listings across the marketplace.'}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by title, brand, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 pl-10 pr-4 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </form>

          <div className="flex w-full md:w-auto gap-4">
            {!pendingOnly && (
              <select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
                className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full md:w-40"
              >
                <option value="">All Review Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full md:w-40"
            >
              <option value="">All Sale Statuses</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>

            <Button variant="secondary" onClick={fetchVehicles}>Filter</Button>
          </div>
        </div>

        {/* Vehicles Table */}
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <DataTable
            headers={['Listing Details', 'Seller Details', 'Price', 'Review Status', 'Sale Status', 'Actions']}
            data={vehicles}
            emptyMessage={pendingOnly ? "No pending vehicle approvals found." : "No vehicle listings found."}
            renderRow={(v) => (
              <tr key={v._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  <div className="flex items-center gap-3">
                    <img
                      src={v.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341'}
                      alt={v.title}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                    />
                    <div>
                      <div className="font-bold text-gray-900 line-clamp-1">{v.title}</div>
                      <div className="text-xs text-gray-400">
                        {v.year} • {v.kilometersDriven?.toLocaleString()} km • {v.vehicleType}
                      </div>
                      <div className="text-[10px] text-blue-600 font-mono mt-0.5 uppercase tracking-wide">
                        Reg: {v.registrationNumber || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="font-semibold text-gray-800">{v.sellerId?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-400">{v.sellerId?.email || ''}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {formatPrice(v.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge variant={getApprovalBadge(v.approvalStatus)}>{v.approvalStatus}</Badge>
                  {v.approvalStatus === 'rejected' && v.rejectionReason && (
                    <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={v.rejectionReason}>
                      Reason: {v.rejectionReason}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                  <span className="font-medium text-gray-700">{v.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <Link to={`/vehicles/${v._id}`}>
                      <Button variant="secondary" size="small">View Details</Button>
                    </Link>
                    {v.approvalStatus === 'pending' && (
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => setActiveReviewVehicle(v)}
                      >
                        Review Listing
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
        )}

        {/* Approval review Modal */}
        {activeReviewVehicle && (
          <ApprovalModal
            isOpen={!!activeReviewVehicle}
            onClose={() => setActiveReviewVehicle(null)}
            vehicleId={activeReviewVehicle._id}
            vehicleTitle={activeReviewVehicle.title}
            onActionComplete={handleActionComplete}
          />
        )}
      </main>
    </div>
  );
};

export default AdminVehicles;
