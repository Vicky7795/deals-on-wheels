import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { AlertTriangle } from 'lucide-react';

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [suspendUser, setSuspendUser] = useState(false);
  const [deleteListing, setDeleteListing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/admin/reports?status=${statusFilter}` : '/admin/reports';
      const res = await api.get(url);
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load admin reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    setUpdating(true);
    try {
      const res = await api.patch(`/admin/reports/${reportId}`, {
        status: newStatus,
        adminNote,
        suspendUser,
        deleteListing
      });
      if (res.data.success) {
        setReports(reports.map(r => r._id === reportId ? { ...r, status: newStatus, adminNote } : r));
        setSelectedReport(null);
        setAdminNote('');
        setSuspendUser(false);
        setDeleteListing(false);
        alert(`Report marked as ${newStatus} successfully.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update report status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeVariant = (s) => {
    if (s === 'resolved') return 'success';
    if (s === 'reviewing') return 'primary';
    if (s === 'pending') return 'warning';
    return 'danger';
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-blue-600" />
            Marketplace Complaints & Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review user-submitted reports regarding suspicious vehicles, incorrect pricing, or user behavior.</p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-48"
          >
            <option value="">All Reports</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <DataTable
            headers={['Reporter', 'Reported Item / User', 'Reason', 'Description', 'Status', 'Actions']}
            data={reports}
            emptyMessage="No complaints or reports found."
            renderRow={(r) => (
              <tr key={r._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {r.reporterId?.name || 'Unknown'}
                  <div className="text-xs text-gray-400">{r.reporterId?.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {r.vehicleId ? (
                    <div>
                      Listing: <span className="font-bold text-gray-900">{r.vehicleId.title}</span>
                    </div>
                  ) : r.reportedUserId ? (
                    <div>
                      User: <span className="font-bold text-gray-900">{r.reportedUserId.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">None</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                  {r.reason}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 line-clamp-1 max-w-[200px]" title={r.description}>
                  {r.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge variant={getStatusBadgeVariant(r.status)}>{r.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Button variant="secondary" size="small" onClick={() => setSelectedReport(r)}>
                    Review Report
                  </Button>
                </td>
              </tr>
            )}
          />
        )}

        {/* Review Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-6 relative border border-gray-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
              <div>
                <h3 className="text-lg font-black text-gray-900">Review Dispute Report</h3>
                <p className="text-xs text-gray-500">Submit resolution actions for Report ID: {selectedReport._id}</p>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div>
                    <span className="font-bold text-gray-500 text-xs uppercase tracking-wider block">Dispute Subject</span>
                    {selectedReport.vehicleId?.title ? `Listing: ${selectedReport.vehicleId.title}` : `User: ${selectedReport.reportedUserId?.name}`}
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 text-xs uppercase tracking-wider block">Reporter Reason</span>
                    <span className="font-bold text-gray-900">{selectedReport.reason}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 text-xs uppercase tracking-wider block">Reporter Description</span>
                    <p className="mt-1">{selectedReport.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Administrative Note</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add an internal audit note for this dispute resolution..."
                      rows={3}
                      className="w-full text-sm rounded-lg border-gray-300"
                    />
                  </div>

                  <div className="space-y-2 bg-yellow-50/50 p-3 border border-yellow-100 rounded-xl">
                    <span className="font-bold text-yellow-800 text-xs uppercase tracking-wider block mb-1">Security Enforcement Actions</span>
                    {selectedReport.reportedUserId && (
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          checked={suspendUser}
                          onChange={(e) => setSuspendUser(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        Suspend reported user ({selectedReport.reportedUserId.name})
                      </label>
                    )}
                    {selectedReport.vehicleId && (
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mt-2">
                        <input
                          type="checkbox"
                          checked={deleteListing}
                          onChange={(e) => setDeleteListing(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        Remove reported vehicle listing ({selectedReport.vehicleId.title})
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setSelectedReport(null)} disabled={updating}>
                  Close
                </Button>
                {selectedReport.status === 'pending' && (
                  <Button
                    variant="secondary"
                    disabled={updating}
                    onClick={() => handleUpdateStatus(selectedReport._id, 'reviewing')}
                  >
                    Start Review
                  </Button>
                )}
                <Button
                  variant="danger"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedReport._id, 'rejected')}
                >
                  Reject Dispute
                </Button>
                <Button
                  variant="primary"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedReport._id, 'resolved')}
                >
                  Resolve & Enforce
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminReports;
