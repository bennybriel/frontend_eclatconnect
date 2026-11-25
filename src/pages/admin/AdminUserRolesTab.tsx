import React, { useState } from 'react';
import { User, Role } from '../../types';
import { request } from '../../api/client';

interface AdminUserRolesTabProps {
  users: User[];
  roles: Role[];
  onRefresh: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminUserRolesTab: React.FC<AdminUserRolesTabProps> = ({
  users,
  roles,
  onRefresh,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    if (!newRoleId) return;
    setAssigningUserId(userId);
    try {
      await request(`/admin/users/${userId}/roles`, 'PATCH', {
        roles: [newRoleId],
        role_id: newRoleId,
      });
      onToast('User role updated successfully', 'success');
      onRefresh();
    } catch (err: any) {
      onToast(err.message || 'Failed to update role', 'error');
    } finally {
      setAssigningUserId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const rName = u.role || ((u as any).roles && (u as any).roles[0]?.name) || '';
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      rName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0 }}>Registered Users & Role Governance</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            All users register in the system. Administrators can assign and update roles dynamically.
          </p>
        </div>
        <input
          placeholder="Search user by name, email or phone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: 280, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
        />
      </div>

      <div className="table-responsive">
        <table style={{ width: '100%', minWidth: 540, borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: 'var(--warm-ivory)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px' }}>User Name</th>
              <th style={{ padding: '10px 12px' }}>Email & Phone</th>
              <th style={{ padding: '10px 12px' }}>Role</th>
              <th style={{ padding: '10px 12px' }}>Activation Status</th>
              <th style={{ padding: '10px 12px' }}>Assign Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => {
              const displayRole = u.role || ((u as any).roles && (u as any).roles[0]?.name) || 'CUSTOMER';
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{u.name}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {u.id.substring(0, 8)}...</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div>{u.email}</div>
                    {u.phone && <small style={{ color: 'var(--text-muted)' }}>📞 {u.phone}</small>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      className="card-badge"
                      style={{
                        background: displayRole === 'ADMINISTRATOR' || displayRole === 'ADMIN' ? '#fef3c7' : displayRole === 'VENDOR' ? '#dcfce7' : '#e0f2fe',
                        color: displayRole === 'ADMINISTRATOR' || displayRole === 'ADMIN' ? '#92400e' : displayRole === 'VENDOR' ? '#166534' : '#0369a1',
                        fontWeight: 600,
                      }}
                    >
                      {displayRole}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {u.activated === false ? (
                      <span className="card-badge" style={{ background: '#fef3c7', color: '#92400e', width: 'fit-content' }}>
                        ⏳ Awaiting Email Link Activation
                      </span>
                    ) : (
                      <span className="card-badge" style={{ background: '#dcfce7', color: '#166534', width: 'fit-content' }}>
                        ✓ Activated
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select
                      disabled={assigningUserId === u.id}
                      defaultValue=""
                      onChange={e => {
                        if (e.target.value) {
                          handleRoleChange(u.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12.5 }}
                    >
                      <option value="">Change Role...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.user_category ? `(${r.user_category})` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
