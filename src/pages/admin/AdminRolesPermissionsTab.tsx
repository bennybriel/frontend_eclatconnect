import React, { useState } from 'react';
import { Role, Permission } from '../../types';
import { request } from '../../api/client';

interface AdminRolesPermissionsTabProps {
  roles: Role[];
  permissions: Permission[];
  onRefresh: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminRolesPermissionsTab: React.FC<AdminRolesPermissionsTabProps> = ({
  roles,
  permissions,
  onRefresh,
  onToast,
}) => {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [userCategory, setUserCategory] = useState<'CUSTOMER' | 'VENDOR' | 'ADMINISTRATOR'>('CUSTOMER');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    setSubmitting(true);
    try {
      await request('/admin/roles', 'POST', {
        name: roleName.trim().toUpperCase(),
        description: description.trim(),
        user_category: userCategory,
        permission_ids: selectedPerms,
      });
      onToast(`Role ${roleName.toUpperCase()} created successfully!`, 'success');
      setRoleName('');
      setDescription('');
      setSelectedPerms([]);
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
      {/* Existing Roles */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Configured System & Custom Roles</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roles.map(r => (
            <div key={r.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--warm-ivory)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{r.name}</strong>
                <span className="card-badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                  {r.user_category} {r.is_system && '· System'}
                </span>
              </div>
              <p style={{ margin: '6px 0 8px', fontSize: 13, color: '#444' }}>{r.description || 'No description provided'}</p>
              {r.permissions && r.permissions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {r.permissions.map(p => (
                    <span key={p} style={{ fontSize: 10.5, background: '#fff', padding: '2px 6px', borderRadius: 4, border: '1px solid #ddd' }}>
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create New Role Form */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Create New Role</h3>
        <form onSubmit={handleCreateRole}>
          <div className="form-group">
            <label>Role Name *</label>
            <input
              required
              placeholder="e.g. MODERATOR or SENIOR_VENDOR"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>User Category *</label>
            <select value={userCategory} onChange={e => setUserCategory(e.target.value as any)}>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="VENDOR">VENDOR</option>
              <option value="ADMINISTRATOR">ADMINISTRATOR</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              placeholder="Responsibilities and purpose of this role"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Assign Permissions ({selectedPerms.length} selected)</label>
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8, background: '#fafafa' }}>
              {permissions.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, margin: '4px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(p.id)}
                    onChange={() => togglePerm(p.id)}
                  />
                  <span><strong>{p.name}</strong> <small style={{ color: '#666' }}>({p.category})</small></span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-lime btn-sm" disabled={submitting} style={{ width: '100%', padding: '10px' }}>
            {submitting ? 'Creating Role...' : 'Create Role →'}
          </button>
        </form>
      </div>
    </div>
  );
};
