import React from 'react';
import { request } from '../../api/client';

interface AdminReportsTabProps {
  reports: any[];
  onRefresh: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  reports,
  onRefresh,
  onToast,
}) => {
  const handleResolve = async (reportId: string) => {
    try {
      await request(`/admin/reports/${reportId}`, 'PATCH', {
        status: 'RESOLVED',
        resolution: 'Investigated and resolved by platform administrator',
      });
      onToast('Report marked as resolved', 'success');
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {reports.map(r => (
        <div key={r.id} className="item-card" style={{ background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Flagged {r.target_type}</strong>
            <span
              className="card-badge"
              style={{
                background: r.status === 'OPEN' ? '#fee2e2' : '#dcfce7',
                color: r.status === 'OPEN' ? '#991b1b' : '#166534',
              }}
            >
              {r.status}
            </span>
          </div>

          <p style={{ margin: '8px 0', color: '#b42318', fontSize: 13.5 }}>
            <strong>Reason:</strong> {r.reason}
          </p>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Reported by: {r.reporter_email} · {new Date(r.created_at).toLocaleString()}
          </div>

          {r.status === 'OPEN' && (
            <button
              className="btn-lime btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: 10 }}
              onClick={() => handleResolve(r.id)}
            >
              ✓ Mark Resolved
            </button>
          )}
        </div>
      ))}

      {reports.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: 10, border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No flagged reports in queue. Marketplace content is healthy.</p>
        </div>
      )}
    </div>
  );
};
