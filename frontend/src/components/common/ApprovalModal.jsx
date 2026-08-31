import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import api from '../../services/api';
import { CheckCircle, AlertTriangle, XCircle, FileText, ExternalLink } from 'lucide-react';

const ApprovalModal = ({ isOpen, onClose, vehicleId, vehicleTitle, onActionComplete }) => {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Input states
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [activeTab, setActiveTab] = useState('approve'); // approve, reject, request

  useEffect(() => {
    const fetchVerificationDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/admin/vehicles/${vehicleId}/verification`);
        if (res.data.success) {
          setVerification(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch verification details:', err);
        setError('Failed to load verification checks. Admin can still manually decide.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && vehicleId) {
      fetchVerificationDetails();
    }
  }, [isOpen, vehicleId]);

  const handleAction = async (action) => {
    setSubmitting(true);
    setError('');
    try {
      const payload = { action };
      if (action === 'reject') {
        if (!rejectionReason.trim()) {
          setError('Rejection reason is required.');
          setSubmitting(false);
          return;
        }
        payload.rejectionReason = rejectionReason;
      }
      if (action === 'request-documents') {
        if (!adminNote.trim()) {
          setError('Admin instructions/note is required to request documents.');
          setSubmitting(false);
          return;
        }
        payload.adminNote = adminNote;
      }

      const res = await api.patch(`/admin/vehicles/${vehicleId}/verify-action`, payload);
      if (res.data.success) {
        const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';
        if (onActionComplete) onActionComplete(newStatus, action === 'reject' ? rejectionReason : adminNote);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit verification action.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSecureDocumentUrl = (docPath) => {
    if (!docPath) return '';
    // Append JWT token for documentGuard validation
    const token = localStorage.getItem('token');
    return `${docPath}?token=${token}`;
  };

  const renderCheckRow = (title, check) => {
    if (!check) return null;
    let icon = <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
    let bg = 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (check.status === 'warning') {
      icon = <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      bg = 'bg-amber-50 text-amber-800 border-amber-100';
    } else if (check.status === 'failed') {
      icon = <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      bg = 'bg-rose-50 text-rose-800 border-rose-100';
    }

    return (
      <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${bg}`}>
        {icon}
        <div className="flex-1">
          <span className="font-bold block uppercase tracking-wider text-[10px] mb-0.5">{title}</span>
          <span className="leading-normal">{check.details || 'No anomalies detected.'}</span>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Marketplace Vehicle Verification">
      <div className="space-y-5 max-h-[80vh] overflow-y-auto px-1">
        <div>
          <h4 className="font-bold text-gray-900 text-base">{vehicleTitle}</h4>
          <p className="text-xs text-gray-500">Perform fraud risk inspection & verify listed registration documents.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 flex justify-center"><LoadingSpinner message="Loading verification report..." /></div>
        ) : (
          <>
            {/* Risk Score Summary Banner */}
            {verification && (
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  verification.riskLevel === 'high'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : verification.riskLevel === 'medium'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                <div>
                  <h5 className="font-bold text-sm">Marketplace Fraud Risk: <span className="uppercase">{verification.riskLevel}</span></h5>
                  <p className="text-[11px] opacity-85 mt-0.5">Calculated internal risk signals based on seller history & database checks.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black">{verification.riskScore}</span>
                  <span className="text-xs font-semibold block opacity-75">Risk Score</span>
                </div>
              </div>
            )}

            {/* Document Viewer Section */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted Listing Documents</h5>
              {verification?.vehicleId ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {verification.vehicleId.rcDocument ? (
                    <a
                      href={getSecureDocumentUrl(verification.vehicleId.rcDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 transition-colors"
                    >
                      <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-600" /> RC Document</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  ) : (
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400 italic">RC Missing</div>
                  )}

                  {verification.vehicleId.insuranceDocument ? (
                    <a
                      href={getSecureDocumentUrl(verification.vehicleId.insuranceDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 transition-colors"
                    >
                      <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-600" /> Insurance Doc</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  ) : (
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400 italic">Insurance Missing</div>
                  )}

                  {verification.vehicleId.pucDocument ? (
                    <a
                      href={getSecureDocumentUrl(verification.vehicleId.pucDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 transition-colors"
                    >
                      <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-600" /> PUC Certificate</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  ) : (
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-400 italic">PUC Missing</div>
                  )}

                  {verification.vehicleId.additionalDocument ? (
                    <a
                      href={getSecureDocumentUrl(verification.vehicleId.additionalDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 transition-colors"
                    >
                      <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-600" /> Supporting Doc</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No document fields available on this listing.</p>
              )}
            </div>

            {/* Check Matrix Details */}
            {verification && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Automatic Verification Signals</h5>
                <div className="grid grid-cols-1 gap-2">
                  {renderCheckRow('Registration Verification', verification.registrationCheck)}
                  {renderCheckRow('Duplicate Listing Check', verification.duplicateCheck)}
                  {renderCheckRow('Document Presence Check', verification.documentCheck)}
                  {renderCheckRow('OCR Information Match Check', verification.dataMatchCheck)}
                  {renderCheckRow('Duplicate Image check', verification.imageCheck)}
                  {renderCheckRow('Seller Verification History', verification.sellerHistoryCheck)}
                  {renderCheckRow('User Reports check', verification.reportCheck)}
                </div>
              </div>
            )}

            {/* Verification Action Panel */}
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div className="flex border-b border-gray-100 pb-2 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('approve')}
                  className={`text-sm font-bold pb-1.5 transition-colors ${
                    activeTab === 'approve' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Verify & Approve
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('request')}
                  className={`text-sm font-bold pb-1.5 transition-colors ${
                    activeTab === 'request' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Request Documents
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reject')}
                  className={`text-sm font-bold pb-1.5 transition-colors ${
                    activeTab === 'reject' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Reject Listing
                </button>
              </div>

              {activeTab === 'approve' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Approve this vehicle listing. The vehicle status will become publicly visible, and buyers can purchase it.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full py-3 font-semibold bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                    onClick={() => handleAction('approve')}
                    isLoading={submitting}
                  >
                    Confirm & Approve Listing
                  </Button>
                </div>
              )}

              {activeTab === 'request' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Flag this listing for document updates. The seller will be notified to re-upload clear PDFs/images.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Administrative Note / Instructions *</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="e.g. Please upload a clearer copy of the RC document or Insurance receipt..."
                      rows={3}
                      className="w-full text-xs rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500 p-2.5 bg-gray-50"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full py-3 font-semibold bg-amber-600 hover:bg-amber-700 text-white border-0"
                    onClick={() => handleAction('request-documents')}
                    isLoading={submitting}
                  >
                    Request Document Corrections
                  </Button>
                </div>
              )}

              {activeTab === 'reject' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Reject this vehicle listing. The listing will be hidden and marked rejected in the seller's account.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Rejection Reason *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Registration plate mismatch with RC certificate or suspicious seller history..."
                      rows={3}
                      className="w-full text-xs rounded-xl border-gray-200 focus:border-rose-500 focus:ring-rose-500 p-2.5 bg-gray-50"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    className="w-full py-3 font-semibold"
                    onClick={() => handleAction('reject')}
                    isLoading={submitting}
                  >
                    Reject Vehicle Listing
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ApprovalModal;
