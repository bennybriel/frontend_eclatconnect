import React from 'react';
import { ServiceRequest, AvailabilityStatus } from '../types';
import { request } from '../api/client';
import { AvailabilityBadge } from '../components/AvailabilityBadge';

interface MyRequestsPageProps {
  requests: ServiceRequest[];
  onRefresh: () => void;
  onNavigate: (page: string) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const MyRequestsPage: React.FC<MyRequestsPageProps> = ({
  requests,
  onRefresh,
  onNavigate,
  onToast,
}) => {
  const handleMarkFulfilled = async (requestId: string) => {
    try {
      await request(`/requests/${requestId}/close`, 'PATCH');
      onToast('Request marked as fulfilled! Check your quotes to rate and review the vendor who helped you.', 'success');
      onRefresh();
      onNavigate('Responses');
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  const handleUpdateAvailability = async (requestId: string, newStatus: AvailabilityStatus) => {
    try {
      await request(`/requests/${requestId}/availability`, 'PATCH', { availability_status: newStatus });
      const statusLabel = newStatus === 'SOLD' ? 'Sold' : newStatus === 'RESERVED' ? 'Reserved' : 'Available';
      onToast(`Item availability updated to: ${statusLabel}!`, 'success');
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>My Requests</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
            Track the status of your requests and view quotes submitted by local providers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-lime btn-sm" onClick={() => onNavigate('Post What I Need')}>
            📢 Post What I Need
          </button>
          <button className="btn-outline btn-sm" onClick={() => onNavigate('Account')}>
            Dashboard
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {requests.map(req => (
          <div key={req.id} className="item-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className="card-badge" style={{ background: req.status === 'OPEN' ? '#dbeafe' : '#f3f4f6', color: req.status === 'OPEN' ? '#1d4ed8' : '#555' }}>
                    {req.status}
                  </span>
                  {req.request_type === 'PREOWNED_SALE' && (
                    <span style={{ fontSize: 11, background: '#10b981', color: '#fff', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                      🏷️ Pre-owned Sale
                    </span>
                  )}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Item Status:</span>
                    <AvailabilityBadge
                      status={req.availability_status || 'AVAILABLE'}
                      interactive
                      size="sm"
                      onStatusChange={(newStatus) => handleUpdateAvailability(req.id, newStatus)}
                    />
                  </div>
                  <span
                    className="card-badge"
                    style={{
                      background: Number(req.response_count) > 0 ? '#dcfce7' : '#f3f4f6',
                      color: Number(req.response_count) > 0 ? '#15803d' : '#666',
                    }}
                  >
                    💬 {req.response_count || 0} Quotes Received
                  </span>
                </div>
                <h3 style={{ margin: '4px 0' }}>{req.title}</h3>
                <p className="description" style={{ margin: '6px 0', fontSize: 13.5, color: '#444' }}>
                  {req.description}
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  📍 General Area: {req.location_area || req.location} · Posted {new Date(req.created_at).toLocaleDateString()}
                </div>
                {req.private_address && (
                  <div style={{ fontSize: 12, color: '#166534', background: '#f0fdf4', padding: '3px 8px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>
                    🔒 Precise Address: <strong>{req.private_address}</strong> (Protected · Shared only with agreed provider)
                  </div>
                )}
              </div>

              {req.budget && (
                <div style={{ textAlign: 'right' }}>
                  <small style={{ color: 'var(--text-muted)' }}>Budget:</small>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-purple)' }}>
                    ₦{Number(req.budget).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
              {Number(req.response_count) > 0 && (
                <button className="btn-lime btn-sm" onClick={() => onNavigate('Responses')}>
                  View Received Quotes ({req.response_count}) →
                </button>
              )}
              {req.status === 'OPEN' ? (
                <button
                  className="btn-outline btn-sm"
                  onClick={() => handleMarkFulfilled(req.id)}
                >
                  ✓ Mark as Fulfilled
                </button>
              ) : (
                <button
                  className="btn-outline btn-sm"
                  style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', fontWeight: 600 }}
                  onClick={() => onNavigate('Responses')}
                >
                  ⭐ Review Vendor Hired for this Job
                </button>
              )}
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '0 0 16px 0' }}>
              You haven't posted any requests yet.
            </p>
            <button className="btn-lime btn-sm" onClick={() => onNavigate('Post What I Need')}>
              Post What I Need →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
