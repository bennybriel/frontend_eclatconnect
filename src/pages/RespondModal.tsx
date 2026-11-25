import React, { useState } from 'react';
import { Provider, ServiceRequest } from '../types';
import { request } from '../api/client';

interface RespondModalProps {
  serviceRequest: ServiceRequest;
  myProviders: Provider[];
  onClose: () => void;
  onSuccess: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const RespondModal: React.FC<RespondModalProps> = ({
  serviceRequest,
  myProviders,
  onClose,
  onSuccess,
  onToast,
}) => {
  const approved = myProviders.filter(p => p.status === 'APPROVED');
  const [providerId, setProviderId] = useState(approved[0]?.id || myProviders[0]?.id || '');
  const [price, setPrice] = useState(serviceRequest.budget ? String(serviceRequest.budget) : '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) {
      onToast('You must select an approved provider profile to submit offers', 'error');
      return;
    }

    if (!message.trim()) {
      onToast('Please enter proposal details / message', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await request('/responses', 'POST', {
        request_id: serviceRequest.id,
        provider_id: providerId,
        price: price ? Number(price) : undefined,
        message: message.trim(),
      });
      onToast('Your quote has been sent to the customer across WhatsApp, SMS and Email!', 'success');
      onSuccess();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2 style={{ margin: '0 0 10px 0', color: 'var(--brand-purple)' }}>
          Submit Quote to Customer
        </h2>

        <div style={{ background: 'var(--warm-ivory)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          <div><strong>Request:</strong> {serviceRequest.title}</div>
          <div><strong>General Area:</strong> 📍 {serviceRequest.location_area || serviceRequest.location || 'LAUTECH Area'}</div>
          {serviceRequest.budget && (
            <div><strong>Customer Budget:</strong> ₦{Number(serviceRequest.budget).toLocaleString()}</div>
          )}
          <div style={{ marginTop: 6, fontSize: 11.5, color: '#6b7280' }}>
            🔒 Note: Exact hostel, lodge or street address is kept private and will be provided directly by the customer once this quote is accepted.
          </div>
        </div>

        {approved.length === 0 ? (
          <div style={{ background: '#fef3c7', padding: 14, borderRadius: 8, color: '#92400e', marginBottom: 16, fontSize: 13 }}>
            ⚠️ <strong>Vendor Approval Required:</strong> You need an approved business profile to submit live quotes. Your profile is currently pending review.
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Your Approved Profile *</label>
            <select required value={providerId} onChange={e => setProviderId(e.target.value)}>
              <option value="">Choose profile</option>
              {myProviders.map(p => (
                <option key={p.id} value={p.id} disabled={p.status !== 'APPROVED'}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Offered Price in ₦ (Optional)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 4500"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Proposal Message & Turnaround Time *</label>
            <textarea
              required
              placeholder="Explain how you can help, materials provided, when you can arrive, and your warranty..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{ minHeight: 90 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="submit"
              className="btn-lime"
              style={{ flex: 1, padding: '12px' }}
              disabled={submitting || approved.length === 0}
            >
              {submitting ? 'Sending Offer...' : 'Send Quote to Customer →'}
            </button>
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
