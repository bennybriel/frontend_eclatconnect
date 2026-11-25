import React from 'react';
import { Provider } from '../../types';
import { request } from '../../api/client';

interface AdminVendorApprovalsTabProps {
  providers: Provider[];
  onRefresh: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminVendorApprovalsTab: React.FC<AdminVendorApprovalsTabProps> = ({
  providers,
  onRefresh,
  onToast,
}) => {
  const handleUpdateStatus = async (providerId: string, newStatus: string, reason?: string) => {
    try {
      await request(`/admin/providers/${providerId}/status`, 'PATCH', {
        status: newStatus,
        reason: reason || `Application ${newStatus} by administrator`,
      });
      onToast(`Provider status updated to ${newStatus}`, 'success');
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  const handleToggleVerified = async (providerId: string, currentVerified: boolean) => {
    try {
      await request(`/admin/providers/${providerId}/verify`, 'PATCH', {
        verified: !currentVerified,
      });
      onToast(`Verification badge ${!currentVerified ? 'enabled' : 'removed'}`, 'success');
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {providers.map(p => (
        <div key={p.id} className="item-card" style={{ background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span
                  className="card-badge"
                  style={{
                    background: p.status === 'APPROVED' ? '#dcfce7' : p.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                    color: p.status === 'APPROVED' ? '#166534' : p.status === 'PENDING' ? '#92400e' : '#991b1b',
                    fontWeight: 600,
                  }}
                >
                  {p.status === 'APPROVED' ? 'Approved' : p.status}
                </span>
                <span className="card-badge">{p.type === 'PROFESSIONAL' ? 'Artisan' : 'Business'}</span>
                {p.verified ? (
                  <span className="verified-pill">✓ Verified {p.type === 'PROFESSIONAL' ? 'Artisan' : 'Provider'}</span>
                ) : (
                  <span className="approved-pill">✓ Approved {p.type === 'PROFESSIONAL' ? 'Artisan' : 'Provider'}</span>
                )}
              </div>

              <h3 style={{ margin: '4px 0', fontSize: 17 }}>{p.name}</h3>
              <div style={{ fontSize: 13, color: '#444' }}>
                🏷️ {p.category_name || p.category} · 📍 {p.location_area || p.location} {p.landmark ? `(${p.landmark})` : ''}
              </div>
              <p style={{ margin: '6px 0', fontSize: 13, color: '#555' }}>{p.description}</p>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                📞 Phone: {p.phone} | 💬 WhatsApp: {p.whatsapp || p.phone} · Applied {new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {p.status !== 'APPROVED' && (
                <button
                  className="btn-lime btn-sm"
                  onClick={() => handleUpdateStatus(p.id, 'APPROVED')}
                >
                  ✓ Approve Provider
                </button>
              )}
              {p.status !== 'MORE_INFO' && (
                <button
                  className="btn-outline btn-sm"
                  onClick={() => handleUpdateStatus(p.id, 'MORE_INFO', 'Please upload or provide official business certificate')}
                >
                  Request Info
                </button>
              )}
              {p.status !== 'REJECTED' && (
                <button
                  className="btn-outline btn-sm"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleUpdateStatus(p.id, 'REJECTED', 'Does not meet local marketplace criteria')}
                >
                  Reject
                </button>
              )}
              <button
                className="btn-outline btn-sm"
                onClick={() => handleToggleVerified(p.id, p.verified)}
              >
                {p.verified ? 'Remove Verification' : 'Grant Verification'}
              </button>
            </div>
          </div>
        </div>
      ))}

      {providers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No provider applications in the queue.</p>
        </div>
      )}
    </div>
  );
};
