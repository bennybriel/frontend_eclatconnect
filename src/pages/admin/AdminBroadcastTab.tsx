import React, { useState, useEffect } from 'react';
import { BroadcastItem } from '../../types';
import { request } from '../../api/client';

interface AdminBroadcastTabProps {
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

interface AudienceEstimates {
  target_audience: string;
  web_users_count: number;
  whatsapp_recipients_count: number;
  total_estimated_reach: number;
}

export const AdminBroadcastTab: React.FC<AdminBroadcastTabProps> = ({ onToast }) => {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<string>('ALL');
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelWhatsApp, setChannelWhatsApp] = useState(true);
  const [actionUrl, setActionUrl] = useState('');
  const [previewTab, setPreviewTab] = useState<'WHATSAPP' | 'IN_APP'>('WHATSAPP');

  // Estimates
  const [estimates, setEstimates] = useState<AudienceEstimates | null>(null);
  const [loadingEstimates, setLoadingEstimates] = useState(false);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await request<BroadcastItem[]>('/admin/broadcasts?limit=50');
      setBroadcasts(data || []);
    } catch (err: any) {
      onToast(err.message || 'Failed to load broadcast history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadAudienceEstimates = async (audience: string) => {
    setLoadingEstimates(true);
    try {
      const data = await request<AudienceEstimates>(`/admin/broadcasts/audience-estimates?audience=${encodeURIComponent(audience)}`);
      setEstimates(data);
    } catch {
      // Fallback if fails
    } finally {
      setLoadingEstimates(false);
    }
  };

  useEffect(() => {
    loadHistory();
    loadAudienceEstimates(targetAudience);
  }, []);

  const handleAudienceChange = (newAudience: string) => {
    setTargetAudience(newAudience);
    loadAudienceEstimates(newAudience);
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onToast('Please enter an announcement title', 'error');
      return;
    }
    if (!message.trim()) {
      onToast('Please enter a message body', 'error');
      return;
    }
    if (!channelInApp && !channelWhatsApp) {
      onToast('Select at least one delivery channel (In-App or WhatsApp)', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteBroadcast = async () => {
    setShowConfirmModal(false);
    setBroadcasting(true);

    const channels: string[] = [];
    if (channelInApp) channels.push('IN_APP');
    if (channelWhatsApp) channels.push('WHATSAPP');

    try {
      const res = await request<any>('/admin/broadcasts', 'POST', {
        title: title.trim(),
        message: message.trim(),
        target_audience: targetAudience,
        channels: channels,
        action_url: actionUrl.trim() || null,
      });

      onToast(res.message || 'Broadcast dispatched successfully!', 'success');
      setTitle('');
      setMessage('');
      setActionUrl('');
      loadHistory();
      loadAudienceEstimates(targetAudience);
    } catch (err: any) {
      onToast(err.message || 'Failed to dispatch broadcast', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  // Metrics
  const totalBroadcasts = broadcasts.length;
  const totalInAppDelivered = broadcasts.reduce((acc, b) => acc + (b.in_app_count || 0), 0);
  const totalWhatsAppDelivered = broadcasts.reduce((acc, b) => acc + (b.whatsapp_count || 0), 0);

  return (
    <div>
      {/* KPI Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-num">{totalBroadcasts}</div>
          <div className="stat-label">Total Broadcasts Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--brand-purple)' }}>
            {totalInAppDelivered}
          </div>
          <div className="stat-label">In-App Web Deliveries</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: '#128C7E' }}>
            {totalWhatsAppDelivered}
          </div>
          <div className="stat-label">WhatsApp Dispatches</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--brand-green)' }}>
            {estimates ? estimates.total_estimated_reach : '...'}
          </div>
          <div className="stat-label">Estimated Current Reach</div>
        </div>
      </div>

      {/* Main Broadcast Composer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Left: Composer Form */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📢</span> Broadcast New Announcement
            </h3>
            <span className="badge" style={{ background: 'var(--bg-tag)', color: 'var(--text-muted)' }}>
              Multi-Channel Direct Delivery
            </span>
          </div>

          <form onSubmit={handleOpenConfirm}>
            {/* Target Audience */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                1. Target Audience
              </label>
              <select
                className="form-control"
                value={targetAudience}
                onChange={e => handleAudienceChange(e.target.value)}
                style={{ width: '100%', padding: '10px 12px' }}
              >
                <option value="ALL">👥 All Users (Web Accounts & WhatsApp Contacts)</option>
                <option value="WHATSAPP_ONLY">💬 WhatsApp Users Only (Registered Phones & Inbound Leads)</option>
                <option value="WEB_ONLY">🌐 Web Accounts Only (All Active Registered Accounts)</option>
                <option value="PROVIDERS">🛠️ Vendors & Artisans Only (Verified Service Providers)</option>
                <option value="CUSTOMERS">🛍️ Customers Only (Non-Vendor Registered Users)</option>
              </select>

              {/* Dynamic Reach Pill */}
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>🎯 Estimated Reach:</span>
                {loadingEstimates ? (
                  <span>Calculating audience...</span>
                ) : estimates ? (
                  <>
                    <span className="badge" style={{ background: '#ede7f6', color: '#4a148c' }}>
                      🌐 {estimates.web_users_count} Web users
                    </span>
                    <span className="badge" style={{ background: '#e8f5e9', color: '#1b5e20' }}>
                      💬 {estimates.whatsapp_recipients_count} WhatsApp phones
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            {/* Delivery Channels */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                2. Select Delivery Channels
              </label>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={channelInApp}
                    onChange={e => setChannelInApp(e.target.checked)}
                  />
                  <span>🔔 <strong>Web In-App</strong> (Notification Bell)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={channelWhatsApp}
                    onChange={e => setChannelWhatsApp(e.target.checked)}
                  />
                  <span>💬 <strong>WhatsApp</strong> (Direct Cloud API)</span>
                </label>
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                3. Announcement Title / Subject
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Platform Update: New Verified Artisans in Ogbomoso"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={150}
                required
                style={{ width: '100%' }}
              />
            </div>

            {/* Message Body */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontWeight: 600, fontSize: 13 }}>
                  4. Announcement Message
                </label>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {message.length} chars
                </span>
              </div>
              <textarea
                className="form-control"
                rows={5}
                placeholder="Write your announcement message here. Supports WhatsApp markdown formatting like *bold* and _italics_..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Optional Action URL */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                5. Action Link / Call-to-Action URL (Optional)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. https://eclatconnect.com/requests or /listings"
                value={actionUrl}
                onChange={e => setActionUrl(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary"
              disabled={broadcasting || (!channelInApp && !channelWhatsApp) || !title.trim() || !message.trim()}
              style={{ width: '100%', padding: '12px', fontSize: 15, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              {broadcasting ? (
                <>⏳ Dispatching Broadcast...</>
              ) : (
                <>🚀 Review & Send Broadcast</>
              )}
            </button>
          </form>
        </div>

        {/* Right: Live Preview Panel */}
        <div className="admin-card" style={{ background: '#fdfdfd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>📱 Live Recipient Preview</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className={`btn-sm ${previewTab === 'WHATSAPP' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPreviewTab('WHATSAPP')}
                style={{ padding: '4px 10px', fontSize: 12 }}
              >
                WhatsApp Bubble
              </button>
              <button
                type="button"
                className={`btn-sm ${previewTab === 'IN_APP' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPreviewTab('IN_APP')}
                style={{ padding: '4px 10px', fontSize: 12 }}
              >
                In-App Bell Alert
              </button>
            </div>
          </div>

          {previewTab === 'WHATSAPP' ? (
            <div
              style={{
                background: '#E5DDD5',
                borderRadius: 12,
                padding: 16,
                minHeight: 280,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px 10px 10px 0',
                  padding: '12px 14px',
                  maxWidth: '90%',
                  alignSelf: 'flex-start',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: '#111',
                }}
              >
                <div style={{ fontWeight: 700, color: '#075E54', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📢</span> ECLAT CONNECT Announcement
                </div>
                {title ? (
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#128C7E' }}>
                    {title}
                  </div>
                ) : (
                  <div style={{ color: '#999', fontStyle: 'italic', marginBottom: 8 }}>
                    [Announcement Title will appear here]
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap', marginBottom: 10 }}>
                  {message || (
                    <span style={{ color: '#999', fontStyle: 'italic' }}>
                      [Your announcement message body will be formatted and delivered to WhatsApp recipients here...]
                    </span>
                  )}
                </div>
                {actionUrl ? (
                  <div style={{ color: '#007aff', wordBreak: 'break-all', marginBottom: 8 }}>
                    🔗 {actionUrl}
                  </div>
                ) : (
                  <div style={{ color: '#007aff', wordBreak: 'break-all', marginBottom: 8 }}>
                    🔗 https://eclatconnect.com
                  </div>
                )}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 6, fontSize: 11, color: '#888', fontStyle: 'italic', display: 'flex', justifyContent: 'space-between' }}>
                  <span>ECLAT CONNECT • Ogbomoso</span>
                  <span>12:00 PM ✓✓</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: 12,
                padding: 16,
                minHeight: 280,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid var(--brand-purple)',
                  borderRadius: 8,
                  padding: 16,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="badge" style={{ background: '#ede7f6', color: '#4a148c', fontWeight: 600 }}>
                    📢 Announcement
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Just now</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)', marginBottom: 6 }}>
                  {title || '[Announcement Title]'}
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {message || '[Notification body shown to user when they open their notification tray or Bell icon...]'}
                </p>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            💡 <strong>Delivery Note:</strong> When both channels are checked, registered web users receive a clean in-app bell alert, and recipients with WhatsApp phone numbers receive the message directly in their WhatsApp chat.
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>📜 Past Broadcast History</h3>
          <button className="btn-outline btn-sm" onClick={loadHistory} disabled={loadingHistory}>
            {loadingHistory ? 'Refreshing...' : '🔄 Refresh History'}
          </button>
        </div>

        {broadcasts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📢</div>
            <p style={{ margin: 0 }}>No broadcasts sent yet. Use the composer above to dispatch your first announcement!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Title & Announcement</th>
                  <th>Audience</th>
                  <th>Channels</th>
                  <th>Delivery Stats</th>
                  <th>Initiator</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(b.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <strong style={{ fontSize: 14, color: 'var(--text-main)', display: 'block', marginBottom: 4 }}>
                        {b.title}
                      </strong>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.message}
                      </p>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg-tag)', color: 'var(--text-main)', fontSize: 11 }}>
                        {b.target_audience}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {b.channels.includes('IN_APP') && (
                          <span className="badge" style={{ background: '#ede7f6', color: '#4a148c', fontSize: 11 }}>
                            🔔 In-App
                          </span>
                        )}
                        {b.channels.includes('WHATSAPP') && (
                          <span className="badge" style={{ background: '#e8f5e9', color: '#1b5e20', fontSize: 11 }}>
                            💬 WhatsApp
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>
                        <strong>{b.total_recipients} total</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {b.in_app_count} web • {b.whatsapp_count} WhatsApp
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {b.sender_name || b.sender_email || 'Administrator'}
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}>
                        ✓ {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: 520, width: '90%', padding: 24 }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🚀</span> Confirm Broadcast Dispatch
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              You are about to dispatch an official announcement across the selected channels:
            </p>

            <div style={{ background: 'var(--bg-subtle)', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 13 }}>
              <div style={{ marginBottom: 6 }}>
                <strong>Title:</strong> {title}
              </div>
              <div style={{ marginBottom: 6 }}>
                <strong>Target Audience:</strong> {targetAudience}
              </div>
              <div style={{ marginBottom: 6 }}>
                <strong>Active Channels:</strong>{' '}
                {channelInApp && <span className="badge" style={{ marginRight: 6 }}>🔔 In-App</span>}
                {channelWhatsApp && <span className="badge">💬 WhatsApp</span>}
              </div>
              <div>
                <strong>Estimated Reach:</strong>{' '}
                {estimates ? `${estimates.web_users_count} web users, ${estimates.whatsapp_recipients_count} WhatsApp contacts` : 'Estimating...'}
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>
              ⚠️ Once dispatched, the message will be sent immediately to all eligible recipients.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={broadcasting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleExecuteBroadcast}
                disabled={broadcasting}
              >
                {broadcasting ? 'Sending...' : 'Confirm & Dispatch Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
