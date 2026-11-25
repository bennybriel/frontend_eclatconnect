import React, { useState } from 'react';
import { ActivityLog } from '../../types';

interface AdminActivityAuditTabProps {
  logs: ActivityLog[];
  onRefresh: () => void;
}

export const AdminActivityAuditTab: React.FC<AdminActivityAuditTabProps> = ({ logs, onRefresh }) => {
  const [filterModule, setFilterModule] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l => {
    if (filterModule && l.module !== filterModule) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.actor_email && l.actor_email.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.ip_address && l.ip_address.includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0 }}>System-Wide Activity & Audit Trail</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Every mutating API request, authentication attempt, WhatsApp interaction, and admin operation is logged here.
          </p>
        </div>
        <button className="btn-sm" onClick={onRefresh} style={{ background: '#f3f4f6' }}>
          🔄 Refresh Log
        </button>
      </div>

      {/* Filter Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
        <input
          placeholder="Filter by action or actor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
        />
        <select
          value={filterModule}
          onChange={e => setFilterModule(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
        >
          <option value="">All Modules</option>
          <option value="AUTH">AUTH</option>
          <option value="REQUEST">REQUEST</option>
          <option value="LISTINGS">LISTINGS</option>
          <option value="ADMIN">ADMIN</option>
          <option value="WHATSAPP">WHATSAPP</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="BLOCKED">BLOCKED</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(log => (
          <div
            key={log.id}
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: log.status === 'FAILED' ? '#fef2f2' : '#fafafa',
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div>
                <strong>{log.action}</strong>
                <span className="card-badge" style={{ marginLeft: 8, fontSize: 11 }}>{log.module}</span>
                <span className="card-badge" style={{ background: '#eee', color: '#555', fontSize: 11 }}>
                  {log.actor_role || 'ANONYMOUS'}
                </span>
              </div>
              <span
                className="card-badge"
                style={{
                  background: log.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2',
                  color: log.status === 'SUCCESS' ? '#166534' : '#991b1b',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {log.status}
              </span>
            </div>

            <div style={{ color: '#444', margin: '4px 0' }}>
              {log.details || 'No additional details provided'}
            </div>

            <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Actor: {log.actor_email || log.actor_id || 'System/Guest'}</span>
              <span>IP: {log.ip_address || '127.0.0.1'}</span>
              <span>Timestamp: {new Date(log.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            No activity logs match the selected filters.
          </p>
        )}
      </div>
    </div>
  );
};
