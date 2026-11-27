import React, { useState } from 'react';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEscapeToClose } from '../components/useEscapeToClose';

interface ReportModalProps {
  item: any;
  onClose: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  onSignIn?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ item, onClose, onToast, onSignIn }) => {
  const { isAuthenticated } = useAuth();
  useEscapeToClose(onClose);
  const [reason, setReason] = useState('Misleading information or incorrect price');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onToast('Please sign in to report content', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await request('/reports', 'POST', {
        target_type: item.kind ? 'listing' : 'provider',
        target_id: item.id,
        reason: `${reason}${details ? ': ' + details : ''}`,
      });
      onToast('Report submitted for administrator investigation. Thank you for keeping the campus safe.', 'success');
      onClose();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 480 }}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h3 style={{ margin: '0 0 10px 0', color: '#b91c1c' }}>
          🚩 Report Content / Vendor
        </h3>

        <p style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>
          Reporting <strong>"{item.name || item.title}"</strong>. Help us maintain quality and trust around LAUTECH campus.
        </p>

        {!isAuthenticated ? (
          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 8, padding: 16, fontSize: 13.5, lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 12px' }}>
              Please sign in to report this. Signing in helps the ECLAT CONNECT team follow up with you and prevents false reports.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {onSignIn && (
                <button type="button" className="btn-lime btn-sm" onClick={onSignIn}>
                  Sign in to report
                </button>
              )}
              <button type="button" className="btn-outline btn-sm" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Reason *</label>
            <select value={reason} onChange={e => setReason(e.target.value)}>
              <option value="Misleading information or incorrect price">Misleading information or incorrect price</option>
              <option value="Suspicious, fraud or non-existent business">Suspicious, fraud or non-existent business</option>
              <option value="Prohibited or harmful items">Prohibited or harmful items</option>
              <option value="Duplicate or spam listing">Duplicate or spam listing</option>
              <option value="Harassment or inappropriate communication">Harassment or inappropriate communication</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Additional Details</label>
            <textarea
              placeholder="Describe what is wrong with this listing or vendor..."
              value={details}
              onChange={e => setDetails(e.target.value)}
              style={{ minHeight: 80 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="submit"
              className="btn-lime"
              style={{ flex: 1, padding: '10px', background: '#b91c1c', color: '#fff', borderColor: '#b91c1c' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
