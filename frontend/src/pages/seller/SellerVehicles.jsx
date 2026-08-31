import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { Car, PlusCircle, Edit3, Trash2, CheckCircle, Eye } from 'lucide-react';

const SellerVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMyVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles/seller/my-listings');
      if (res.data.success) {
        setVehicles(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch seller vehicles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyVehicles();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/vehicles/${deleteId}`);
      if (res.data.success) {
        setVehicles(prev => prev.filter(v => v._id !== deleteId));
        setDeleteId(null);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete vehicle listing.');
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkAsSold = async (id) => {
    try {
      const res = await api.patch(`/vehicles/${id}/sold`);
      if (res.data.success) {
        setVehicles(prev =>
          prev.map(v => (v._id === id ? { ...v, status: 'sold' } : v))
        );
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to mark vehicle as sold.');
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="seller" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Car className="w-6 h-6 text-blue-600" /> My Vehicle Listings
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track your published vehicles</p>
          </div>

          <Link to="/seller/vehicles/add">
            <Button variant="primary" size="md" icon={PlusCircle}>
              Add Vehicle
            </Button>
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading your vehicle listings..." />
        ) : vehicles.length === 0 ? (
          <EmptyState
            title="You haven't listed any vehicles yet"
            description="Start selling by listing your first vehicle with images and specifications."
            icon={Car}
            actionLabel="Add New Vehicle"
            onAction={() => window.location.href = '/seller/vehicles/add'}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Specs</th>
                    <th className="px-6 py-4">Approval Status</th>
                    <th className="px-6 py-4">Sale Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {vehicles.map((veh) => (
                    <tr key={veh._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={veh.images?.[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80'}
                            alt={veh.title}
                            className="w-14 h-10 object-cover rounded-lg border border-gray-200"
                          />
                          <div>
                            <Link to={`/vehicles/${veh._id}`} className="font-bold text-gray-900 hover:text-blue-600 line-clamp-1">
                              {veh.title}
                            </Link>
                            <span className="text-xs text-gray-400">{veh.brand} • {veh.model}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatPrice(veh.price)}
                      </td>

                      <td className="px-6 py-4 text-gray-600 text-xs">
                        {veh.city}, {veh.state}
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500">
                        {veh.year} • {veh.kilometersDriven.toLocaleString('en-IN')} km • {veh.fuelType}
                      </td>

                      <td className="px-6 py-4">
                        {veh.verification ? (
                          <div className="space-y-1">
                            <Badge
                              variant={
                                veh.verification.status === 'verified'
                                  ? 'success'
                                  : veh.verification.status === 'documents_required'
                                  ? 'warning'
                                  : veh.verification.status === 'rejected'
                                  ? 'danger'
                                  : 'warning'
                              }
                            >
                              {veh.verification.status === 'verified'
                                ? 'Verified'
                                : veh.verification.status === 'documents_required'
                                ? 'Docs Required'
                                : veh.verification.status === 'rejected'
                                ? 'Rejected'
                                : 'Under Review'}
                            </Badge>
                            
                            {veh.verification.status === 'rejected' && veh.verification.rejectionReason && (
                              <div className="text-[10px] text-red-500 font-semibold max-w-[150px] leading-tight break-words">
                                Reason: {veh.verification.rejectionReason}
                              </div>
                            )}

                            {veh.verification.status === 'documents_required' && veh.verification.adminNote && (
                              <div className="text-[10px] text-amber-600 font-semibold max-w-[150px] leading-tight break-words">
                                Note: {veh.verification.adminNote}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <Badge variant={veh.approvalStatus === 'approved' ? 'success' : veh.approvalStatus === 'pending' ? 'warning' : 'danger'}>
                              {veh.approvalStatus || 'pending'}
                            </Badge>
                            {veh.approvalStatus === 'rejected' && veh.rejectionReason && (
                              <div className="text-[10px] text-red-500 font-semibold mt-1 max-w-[150px] leading-tight break-words">
                                Reason: {veh.rejectionReason}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={veh.status === 'sold' ? 'red' : veh.status === 'reserved' ? 'amber' : 'green'}>
                          {veh.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        <Link to={`/vehicles/${veh._id}`}>
                          <button className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100" title="View Public Page">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>

                        <Link to={`/seller/vehicles/${veh._id}/edit`}>
                          <button className="p-1.5 text-gray-500 hover:text-amber-600 rounded-lg hover:bg-gray-100" title="Edit Listing">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </Link>

                        {veh.status !== 'sold' && (
                          <button
                            onClick={() => handleMarkAsSold(veh._id)}
                            className="p-1.5 text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-gray-100"
                            title="Mark as Sold"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteId(veh._id)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-gray-100"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Vehicle Listing"
          message="Are you sure you want to delete this vehicle listing? It will be removed permanently from the marketplace."
          confirmText="Yes, Delete Listing"
          isLoading={deleting}
        />
      </main>
    </div>
  );
};

export default SellerVehicles;
