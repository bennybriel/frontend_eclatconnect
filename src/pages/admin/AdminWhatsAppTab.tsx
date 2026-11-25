import React, { useState } from 'react';
import { WhatsAppLog } from '../../types';
import { request, cleanPhone } from '../../api/client';

interface AdminWhatsAppTabProps {
  logs: WhatsAppLog[];
  onRefresh: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminWhatsAppTab: React.FC<AdminWhatsAppTabProps> = ({
  logs,
  onRefresh,
  onToast,
}) => {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND' | 'LEAD_CLICK'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'FOLLOWED_UP' | 'RESOLVED' | 'NO_ACTION_NEEDED'>('ALL');
  const [activityFilter, setActivityFilter] = useState<string>('ALL');

  // Follow-up editing state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState<string>('PENDING');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // Direct WhatsApp send modal / tool
  const [directPhone, setDirectPhone] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [sendingDirect, setSendingDirect] = useState(false);
  const [showSendBox, setShowSendBox] = useState(false);

  // Simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simPhone, setSimPhone] = useState('08012345678');
  const [simMessage, setSimMessage] = useState('MENU');
  const [simulating, setSimulating] = useState(false);
  const [botReply, setBotReply] = useState<string | null>(null);

  // Metrics computation
  const totalActivities = logs.length;
  const inboundCount = logs.filter(l => l.direction === 'INBOUND').length;
  const outboundCount = logs.filter(l => l.direction === 'OUTBOUND').length;
  const leadClicksCount = logs.filter(l => l.direction === 'LEAD_CLICK' || l.activity_type === 'DIRECT_CONTACT_CLICK').length;
  const pendingFollowups = logs.filter(l => l.follow_up_status === 'PENDING').length;
  const resolvedCount = logs.filter(l => l.follow_up_status === 'FOLLOWED_UP' || l.follow_up_status === 'RESOLVED').length;

  // Filtered logs
  const filteredLogs = logs.filter(l => {
    if (directionFilter !== 'ALL' && l.direction !== directionFilter) return false;
    if (statusFilter !== 'ALL' && (l.follow_up_status || 'PENDING') !== statusFilter) return false;
    if (activityFilter !== 'ALL' && (l.activity_type || 'GENERAL_MESSAGE') !== activityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchPhone = l.phone?.toLowerCase().includes(q);
      const matchSender = l.sender_name?.toLowerCase().includes(q);
      const matchContent = l.content?.toLowerCase().includes(q);
      const matchNotes = l.admin_notes?.toLowerCase().includes(q);
      const matchUser = l.user_name?.toLowerCase().includes(q);
      if (!matchPhone && !matchSender && !matchContent && !matchNotes && !matchUser) return false;
    }
    return true;
  });

  const handleStartFollowUp = (log: WhatsAppLog) => {
    setEditingLogId(log.id);
    setFollowUpStatus(log.follow_up_status || 'PENDING');
    setAdminNotes(log.admin_notes || '');
  };

  const handleSaveFollowUp = async (logId: string) => {
    setSavingFollowUp(true);
    try {
      await request(`/admin/whatsapp-logs/${logId}/follow-up`, 'PATCH', {
        follow_up_status: followUpStatus,
        admin_notes: adminNotes.trim(),
      });
      onToast('Follow-up record saved successfully!', 'success');
      setEditingLogId(null);
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleSendDirectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPhone.trim() || !directMessage.trim()) return;
    setSendingDirect(true);
    try {
      await request('/admin/whatsapp/send', 'POST', {
        phone: directPhone.trim(),
        message: directMessage.trim(),
      });
      onToast(`WhatsApp message dispatched to ${directPhone}!`, 'success');
      setDirectMessage('');
      setShowSendBox(false);
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSendingDirect(false);
    }
  };

  const handleSimulate = async () => {
    if (!simMessage.trim()) return;
    setSimulating(true);
    try {
      const res = await request<{ response: string }>('/whatsapp/simulate', 'POST', {
        phone: simPhone.trim(),
        name: 'Simulation User',
        message: simMessage.trim(),
      });
      setBotReply(res.response);
      onToast('Simulated WhatsApp command executed!', 'success');
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Header Overview & Metrics */}
      <div style={{ background: '#fff', padding: 22, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--brand-purple)', fontSize: 20 }}>
              💬 WhatsApp Cloud API Activity & CRM Follow-up Center
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>
              Monitor all live WhatsApp messages, conversational requests, quotes, and customer contact leads to follow up and assist users.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn-lime btn-sm"
              onClick={() => setShowSendBox(!showSendBox)}
            >
              ✉️ {showSendBox ? 'Hide Message Box' : 'Send WhatsApp Message'}
            </button>
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => setShowSimulator(!showSimulator)}
            >
              🧪 {showSimulator ? 'Close Simulator' : 'Test Simulator'}
            </button>
            <button className="btn-sm" onClick={onRefresh} style={{ background: '#eee' }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Real-time KPI Metric Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--charcoal)' }}>{totalActivities}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Total Activities</div>
          </div>
          <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 8, border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>{inboundCount}</div>
            <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>📥 Inbound Messages</div>
          </div>
          <div style={{ background: '#faf5ff', padding: 14, borderRadius: 8, border: '1px solid #e9d5ff', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#7e22ce' }}>{outboundCount}</div>
            <div style={{ fontSize: 12, color: '#6b21a8', marginTop: 2 }}>📤 Outbound Delivered</div>
          </div>
          <div style={{ background: '#eff6ff', padding: 14, borderRadius: 8, border: '1px solid #bfdbfe', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8' }}>{leadClicksCount}</div>
            <div style={{ fontSize: 12, color: '#1e40af', marginTop: 2 }}>🔗 Web Leads Clicked</div>
          </div>
          <div style={{ background: '#fffbeb', padding: 14, borderRadius: 8, border: '1px solid #fde68a', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#b45309' }}>{pendingFollowups}</div>
            <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>⚠️ Needs Follow-up</div>
          </div>
          <div style={{ background: '#f0fdfa', padding: 14, borderRadius: 8, border: '1px solid #99f6e4', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f766e' }}>{resolvedCount}</div>
            <div style={{ fontSize: 12, color: '#115e59', marginTop: 2 }}>✅ Followed Up / Done</div>
          </div>
        </div>
      </div>

      {/* 2. Direct Admin Outbound WhatsApp Sender (Collapsible) */}
      {showSendBox && (
        <form
          onSubmit={handleSendDirectWhatsApp}
          style={{ background: '#f0fdf4', padding: 20, borderRadius: 12, border: '1.5px solid #86efac' }}
        >
          <h4 style={{ margin: '0 0 10px', color: '#166534', fontSize: 15 }}>
            💬 Send Direct WhatsApp Message to Any Phone (Admin Outreach)
          </h4>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#14532d' }}>
            Send an official message directly from your registered WhatsApp phone number (<code>+234 814 472 5537</code>) to follow up with a student, artisan, or provider.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, alignItems: 'start' }}>
            <input
              placeholder="Recipient Phone (e.g. 08012345678)"
              value={directPhone}
              onChange={e => setDirectPhone(e.target.value)}
              required
              style={{ padding: '9px 12px', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 13 }}
            />
            <input
              placeholder="Type your follow-up message..."
              value={directMessage}
              onChange={e => setDirectMessage(e.target.value)}
              required
              style={{ padding: '9px 12px', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 13 }}
            />
            <button
              type="submit"
              className="btn-lime"
              style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700 }}
              disabled={sendingDirect}
            >
              {sendingDirect ? 'Sending...' : 'Send Message →'}
            </button>
          </div>
        </form>
      )}

      {/* 3. Simulator Drawer (Collapsible) */}
      {showSimulator && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>🧪 Conversational Simulator & Bot Tester</h4>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Simulate incoming user commands (e.g., <code>MENU</code>, <code>SEARCH laundry</code>, <code>REQUEST Need room fan repair | Skilled Trades | 4000 | Under G</code>, <code>LEADS</code>).
          </p>
          <div className="simulator-grid" style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input
              placeholder="Sender Phone (080...)"
              value={simPhone}
              onChange={e => setSimPhone(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, width: 160 }}
            />
            <input
              placeholder="Message (e.g. MENU or SEARCH barbing)"
              value={simMessage}
              onChange={e => setSimMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSimulate()}
              style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, flex: 1 }}
            />
            <button className="btn-lime btn-sm" onClick={handleSimulate} disabled={simulating || !simMessage.trim()}>
              {simulating ? 'Sending...' : 'Test Bot'}
            </button>
          </div>
          {botReply && (
            <div style={{ background: '#111b21', color: '#e9edef', padding: 14, borderRadius: 8, fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 13, borderLeft: '4px solid #25D366' }}>
              <div style={{ color: '#25D366', fontWeight: 'bold', marginBottom: 6 }}>📱 Bot Reply:</div>
              {botReply}
            </div>
          )}
        </div>
      )}

      {/* 4. Filters & Search Toolbar */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="🔍 Search phone, sender, message, or notes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, minWidth: 260, flex: 1 }}
        />

        <select
          value={directionFilter}
          onChange={e => setDirectionFilter(e.target.value as any)}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
        >
          <option value="ALL">All Directions</option>
          <option value="INBOUND">📥 Inbound Only</option>
          <option value="OUTBOUND">📤 Outbound Only</option>
          <option value="LEAD_CLICK">🔗 Web Leads Clicked</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
        >
          <option value="ALL">All Follow-up Statuses</option>
          <option value="PENDING">🟡 Needs Follow-up (Pending)</option>
          <option value="IN_PROGRESS">🔵 In Progress</option>
          <option value="FOLLOWED_UP">🟢 Followed Up</option>
          <option value="RESOLVED">✅ Resolved</option>
          <option value="NO_ACTION_NEEDED">⚪ No Action Needed</option>
        </select>

        <select
          value={activityFilter}
          onChange={e => setActivityFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
        >
          <option value="ALL">All Activities</option>
          <option value="REQUEST_POSTED">📢 Requests Posted</option>
          <option value="QUOTE_SUBMITTED">💬 Quotes Submitted</option>
          <option value="DIRECT_CONTACT_CLICK">🔗 Direct Contact Clicks</option>
          <option value="SEARCH_QUERY">🔍 Search Queries</option>
          <option value="GENERAL_ENQUIRY">✉️ Inquiries</option>
          <option value="MENU_INQUIRY">📋 Menu Views</option>
        </select>

        {(searchTerm || directionFilter !== 'ALL' || statusFilter !== 'ALL' || activityFilter !== 'ALL') && (
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => {
              setSearchTerm('');
              setDirectionFilter('ALL');
              setStatusFilter('ALL');
              setActivityFilter('ALL');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 5. Activities Feed & Follow-up Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: 15, color: 'var(--charcoal)' }}>
            📋 Live WhatsApp Activities ({filteredLogs.length} matching)
          </h4>
        </div>

        {filteredLogs.map(log => {
          const isPending = (log.follow_up_status || 'PENDING') === 'PENDING';
          const isResolved = log.follow_up_status === 'FOLLOWED_UP' || log.follow_up_status === 'RESOLVED';
          const isEditing = editingLogId === log.id;
          const cleanWa = cleanPhone(log.phone);

          return (
            <div
              key={log.id}
              style={{
                background: log.direction === 'LEAD_CLICK' ? '#eff6ff' : log.direction === 'INBOUND' ? '#f0fdf4' : '#faf5ff',
                padding: 16,
                borderRadius: 10,
                border: `1.5px solid ${
                  isPending
                    ? '#f59e0b'
                    : log.direction === 'LEAD_CLICK'
                    ? '#bfdbfe'
                    : log.direction === 'INBOUND'
                    ? '#bbf7d0'
                    : '#e9d5ff'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                boxShadow: isPending ? '0 2px 8px rgba(245, 158, 11, 0.15)' : 'none',
              }}
            >
              {/* Header Row: Direction, Sender, Activity Badge & Follow-up Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: log.direction === 'LEAD_CLICK' ? '#1d4ed8' : log.direction === 'INBOUND' ? '#15803d' : '#7e22ce',
                      color: '#fff',
                    }}
                  >
                    {log.direction === 'LEAD_CLICK' ? '🔗 Lead Click' : log.direction === 'INBOUND' ? '📥 Inbound' : '📤 Outbound'}
                  </span>

                  {log.activity_type && (
                    <span style={{ fontSize: 11.5, background: 'rgba(0,0,0,0.06)', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                      🏷️ {log.activity_type.replace(/_/g, ' ')}
                    </span>
                  )}

                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    📞 {log.phone}
                  </span>

                  {log.sender_name && (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      ({log.sender_name})
                    </span>
                  )}

                  {log.user_name && log.user_name !== log.sender_name && (
                    <span style={{ fontSize: 12, background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: 4 }}>
                      User: {log.user_name} ({log.user_role || 'CUSTOMER'})
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Follow-up Status Badge */}
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 12,
                      background: isPending ? '#fef3c7' : isResolved ? '#dcfce7' : '#f1f5f9',
                      color: isPending ? '#b45309' : isResolved ? '#15803d' : '#475569',
                      border: `1px solid ${isPending ? '#fcd34d' : isResolved ? '#86efac' : '#cbd5e1'}`,
                    }}
                  >
                    {log.follow_up_status === 'PENDING' || !log.follow_up_status
                      ? '🟡 Needs Follow-up'
                      : log.follow_up_status === 'IN_PROGRESS'
                      ? '🔵 In Progress'
                      : log.follow_up_status === 'FOLLOWED_UP'
                      ? '🟢 Followed Up'
                      : log.follow_up_status === 'RESOLVED'
                      ? '✅ Resolved'
                      : '⚪ No Action Needed'}
                  </span>

                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div
                style={{
                  background: '#ffffff',
                  padding: 12,
                  borderRadius: 6,
                  border: '1px solid rgba(0,0,0,0.08)',
                  fontSize: 13.5,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  color: 'var(--charcoal)',
                }}
              >
                {log.content}
              </div>

              {/* Existing Follow-up Notes (if any) */}
              {log.admin_notes && !isEditing && (
                <div style={{ background: '#fffbeb', borderLeft: '3px solid #f59e0b', padding: '8px 12px', borderRadius: 4, fontSize: 12.5, color: '#92400e' }}>
                  <strong>Admin Notes:</strong> {log.admin_notes}
                  {log.followed_up_by_name && (
                    <span style={{ fontSize: 11.5, color: '#78350f', marginLeft: 8 }}>
                      — By {log.followed_up_by_name} ({log.followed_up_at ? new Date(log.followed_up_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''})
                    </span>
                  )}
                </div>
              )}

              {/* Follow-up Edit Mode */}
              {isEditing ? (
                <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--charcoal)' }}>Update Status:</label>
                    <select
                      value={followUpStatus}
                      onChange={e => setFollowUpStatus(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: 12.5, borderRadius: 6, border: '1px solid var(--border)' }}
                    >
                      <option value="PENDING">🟡 Needs Follow-up (Pending)</option>
                      <option value="IN_PROGRESS">🔵 In Progress</option>
                      <option value="FOLLOWED_UP">🟢 Followed Up</option>
                      <option value="RESOLVED">✅ Resolved</option>
                      <option value="NO_ACTION_NEEDED">⚪ No Action Needed</option>
                    </select>
                  </div>

                  <textarea
                    placeholder="Enter follow-up notes (e.g. Called customer, confirmed transaction with artisan, resolved complaint)..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    style={{ width: '100%', minHeight: 60, padding: 8, fontSize: 12.5, borderRadius: 6, border: '1px solid var(--border)', boxSizing: 'border-box' }}
                  />

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => setEditingLogId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-lime btn-sm"
                      onClick={() => handleSaveFollowUp(log.id)}
                      disabled={savingFollowUp}
                    >
                      {savingFollowUp ? 'Saving...' : 'Save Follow-up'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Action Bar for Admin */
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {cleanWa && (
                      <a
                        href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hello, this is the ECLAT CONNECT Admin team following up on your recent request/activity.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp btn-sm"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                      >
                        💬 Open WhatsApp Chat
                      </a>
                    )}
                    {log.phone && (
                      <a
                        href={`tel:${log.phone}`}
                        className="btn-call btn-sm"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                      >
                        📞 Call Phone
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      style={{ fontSize: 12 }}
                      onClick={() => {
                        setDirectPhone(log.phone);
                        setShowSendBox(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      ✉️ Compose Cloud API Message
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      borderColor: isPending ? '#f59e0b' : 'var(--border)',
                      color: isPending ? '#b45309' : 'var(--charcoal)',
                      background: isPending ? '#fffbeb' : '#ffffff',
                    }}
                    onClick={() => handleStartFollowUp(log)}
                  >
                    ✏️ {log.admin_notes ? 'Update Follow-up Notes' : 'Mark as Followed Up / Add Notes'}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
              No WhatsApp Cloud API activities found matching the current filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
