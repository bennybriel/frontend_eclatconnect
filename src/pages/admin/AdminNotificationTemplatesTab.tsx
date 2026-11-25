import React, { useState, useEffect } from 'react';
import { NotificationTemplate } from '../../types';
import { request } from '../../api/client';

interface AdminNotificationTemplatesTabProps {
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminNotificationTemplatesTab: React.FC<AdminNotificationTemplatesTabProps> = ({
  onToast,
}) => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'CUSTOMER' | 'PROVIDER' | 'ADMINISTRATOR' | 'GENERAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastRole, setBroadcastRole] = useState('ALL');
  const [broadcasting, setBroadcasting] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await request<NotificationTemplate[]>('/admin/notification-templates');
      setTemplates(data);
      const initial: Record<string, string> = {};
      data.forEach(t => {
        initial[t.event_key] = t.message_template;
      });
      setEditedMessages(initial);
    } catch (err: any) {
      onToast(err.message || 'Failed to load notification templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleMessageChange = (key: string, val: string) => {
    setEditedMessages(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (tpl: NotificationTemplate) => {
    const newMsg = editedMessages[tpl.event_key];
    if (!newMsg || !newMsg.trim()) {
      onToast('Message cannot be empty', 'error');
      return;
    }

    setSavingKey(tpl.event_key);
    try {
      await request(`/admin/notification-templates/${tpl.event_key}`, 'PUT', {
        message_template: newMsg.trim(),
      });
      onToast(`✓ Updated message for "${tpl.event_name}" successfully!`, 'success');
      loadTemplates();
    } catch (err: any) {
      onToast(err.message || 'Failed to save template', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Are you sure you want to reset all notification messages to their official developer handover defaults?')) {
      return;
    }

    setLoading(true);
    try {
      await request('/admin/notification-templates/reset', 'POST');
      onToast('✓ All notification templates reset to official defaults!', 'success');
      loadTemplates();
    } catch (err: any) {
      onToast(err.message || 'Failed to reset templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) {
      onToast('Broadcast message is required', 'error');
      return;
    }

    setBroadcasting(true);
    try {
      await request('/admin/notifications/broadcast', 'POST', {
        message: broadcastMsg.trim(),
        target_role: broadcastRole,
      });
      onToast('✓ Broadcast notification dispatched successfully!', 'success');
      setBroadcastModalOpen(false);
      setBroadcastMsg('');
    } catch (err: any) {
      onToast(err.message || 'Failed to dispatch broadcast', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    if (selectedRole !== 'ALL' && t.target_role !== selectedRole) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.event_name.toLowerCase().includes(q);
      const matchKey = t.event_key.toLowerCase().includes(q);
      const matchMsg = (editedMessages[t.event_key] || t.message_template).toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      if (!matchName && !matchKey && !matchMsg && !matchDesc) return false;
    }
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>👤 Customer</span>;
      case 'PROVIDER':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>🏪 Provider</span>;
      case 'ADMINISTRATOR':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>🛡️ Administrator</span>;
      default:
        return <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>🌐 General / Platform</span>;
    }
  };

  return (
    <div>
      {/* Top Header & Global Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: 'var(--brand-purple)' }}>
            📢 Notification Messages & Dynamic Copy
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
            Update and customize official notification templates for customers, providers, and administrators.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={handleResetAll}
            disabled={loading}
            title="Reset all message copies to handover defaults"
          >
            ↺ Reset All to Defaults
          </button>
          <button
            type="button"
            className="btn-lime btn-sm"
            style={{ fontWeight: 700 }}
            onClick={() => setBroadcastModalOpen(true)}
          >
            📣 Broadcast System Alert
          </button>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setSelectedRole('ALL')}
          className={`btn-sm ${selectedRole === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
        >
          All Templates ({templates.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('CUSTOMER')}
          className={`btn-sm ${selectedRole === 'CUSTOMER' ? 'btn-primary' : 'btn-outline'}`}
        >
          👤 Customer ({templates.filter(t => t.target_role === 'CUSTOMER').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('PROVIDER')}
          className={`btn-sm ${selectedRole === 'PROVIDER' ? 'btn-primary' : 'btn-outline'}`}
        >
          🏪 Provider ({templates.filter(t => t.target_role === 'PROVIDER').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('ADMINISTRATOR')}
          className={`btn-sm ${selectedRole === 'ADMINISTRATOR' ? 'btn-primary' : 'btn-outline'}`}
        >
          🛡️ Administrator ({templates.filter(t => t.target_role === 'ADMINISTRATOR').length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('GENERAL')}
          className={`btn-sm ${selectedRole === 'GENERAL' ? 'btn-primary' : 'btn-outline'}`}
        >
          🎉 Welcome & WhatsApp ({templates.filter(t => t.target_role === 'GENERAL').length})
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 Search templates by event name, event code, or message text..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}
        />
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          Loading notification templates...
        </div>
      )}

      {/* Templates Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: 16 }}>
        {filteredTemplates.map(tpl => {
          const currentText = editedMessages[tpl.event_key] ?? tpl.message_template;
          const isDirty = currentText !== tpl.message_template;
          const isSaving = savingKey === tpl.event_key;

          return (
            <div
              key={tpl.id || tpl.event_key}
              style={{
                background: '#fff',
                border: isDirty ? '1.5px solid var(--brand-purple)' : '1px solid var(--border)',
                borderRadius: 12,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isDirty ? '0 4px 12px rgba(88, 28, 135, 0.08)' : '0 2px 4px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 15, color: '#111827' }}>{tpl.event_name}</strong>
                    {getRoleBadge(tpl.target_role)}
                  </div>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>
                    {tpl.event_key}
                  </span>
                </div>

                {tpl.description && (
                  <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--text-muted)' }}>
                    Trigger: {tpl.description}
                  </p>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: 4 }}>
                    Notification Message Copy:
                  </label>
                  <textarea
                    rows={tpl.event_key === 'WELCOME_MESSAGE' ? 6 : 3}
                    value={currentText}
                    onChange={e => handleMessageChange(tpl.event_key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      fontFamily: 'inherit',
                      background: isDirty ? '#fcfaff' : '#f9fafb',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11.5, color: '#9ca3af' }}>
                    <span>{currentText.length} characters</span>
                    {tpl.updated_at && (
                      <span>Last updated: {new Date(tpl.updated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f3f4f6', paddingTop: 12, marginTop: 4 }}>
                {isDirty && (
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => handleMessageChange(tpl.event_key, tpl.message_template)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  className={isDirty ? 'btn-lime btn-sm' : 'btn-outline btn-sm'}
                  style={{ fontWeight: isDirty ? 700 : 500 }}
                  onClick={() => handleSave(tpl)}
                  disabled={isSaving || !isDirty}
                >
                  {isSaving ? 'Saving...' : isDirty ? '💾 Save Changes' : '✓ Saved'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <h3>No templates found matching your search</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Try clearing filters or resetting search keywords.</p>
        </div>
      )}

      {/* Broadcast System Alert Modal */}
      {broadcastModalOpen && (
        <div className="modal-backdrop" onClick={() => setBroadcastModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <button className="modal-close" onClick={() => setBroadcastModalOpen(false)}>×</button>
            <h3 style={{ margin: '0 0 8px', color: 'var(--brand-purple)' }}>📣 Broadcast System Notification</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>
              Send an official in-app broadcast alert to users or administrators.
            </p>

            <form onSubmit={handleSendBroadcast}>
              <div className="form-group">
                <label>Target Audience</label>
                <select value={broadcastRole} onChange={e => setBroadcastRole(e.target.value)}>
                  <option value="ALL">All Platform Users</option>
                  <option value="ADMINISTRATOR">Administrators Only</option>
                  <option value="PROVIDER">Vendors & Artisans</option>
                  <option value="CUSTOMER">Customers & Residents</option>
                </select>
              </div>

              <div className="form-group">
                <label>Alert Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type important platform announcement or maintenance notification..."
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn-outline btn-sm" onClick={() => setBroadcastModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-lime btn-sm" disabled={broadcasting} style={{ fontWeight: 700 }}>
                  {broadcasting ? 'Dispatching...' : 'Send Broadcast Now →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
