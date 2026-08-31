import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import api from '../../services/api';

const ReportModal = ({ isOpen, onClose, vehicleId, reportedUserId, onReportSubmitted }) => {
  const [reason, setReason] = useState('Misleading Listing');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a short description.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/reports', {
        reportedUserId,
        vehicleId,
        reason,
        description
      });
      setSuccess(true);
      if (onReportSubmitted) onReportSubmitted();
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Listing / Behavior">
      {success ? (
        <div className="py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
            ✓
          </div>
          <h4 className="text-lg font-bold text-gray-900">Report Submitted</h4>
          <p className="text-sm text-gray-500 mt-1">Thank you. The admin has been notified and will investigate.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason for Report</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm shadow-sm"
            >
              <option value="Misleading Listing">Misleading Listing / Specs</option>
              <option value="Suspicious Pricing">Suspicious Pricing / Fraud</option>
              <option value="Inappropriate Content">Inappropriate Images / Content</option>
              <option value="Seller Behavior">Unresponsive or Rude Seller</option>
              <option value="Other">Other Issues</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Detailed Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Provide exact details of the issue..."
              className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm shadow-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" loading={submitting}>
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ReportModal;
