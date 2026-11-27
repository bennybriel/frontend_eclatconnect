import React from 'react';
import { NotificationItem } from '../types';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BadgeCheck, Bell, MessageSquareQuote, Star } from 'lucide-react';
import { FlowBrand } from '../components/FlowBrand';
import '../styles/flows.css';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  onRefresh: () => void;
  onNavigate: (page: string) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onRefresh,
  onNavigate,
  onToast,
}) => {
  const { user, isAdmin, isVendor } = useAuth();
  const handleMarkRead = async (id: string) => {
    try {
      await request(`/me/notifications/${id}/read`, 'PATCH');
      onRefresh();
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read_at);
    // Mark all unread notifications in parallel instead of one after another
    await Promise.all(
      unread.map(item => request(`/me/notifications/${item.id}/read`, 'PATCH').catch(() => null))
    );
    onToast('All notifications marked as read', 'success');
    onRefresh();
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const handleActionClick = (n: NotificationItem) => {
    if (!n.read_at) {
      handleMarkRead(n.id);
    }
    if (n.link_type === 'REQUEST') {
      onNavigate('Requests');
    } else if (n.link_type === 'RESPONSE') {
      onNavigate('Responses');
    } else if (n.link_type === 'PROVIDER') {
      onNavigate('Businesses');
    } else if (n.link_type === 'REVIEW') {
      onNavigate('My Reviews');
    } else {
      onNavigate('Account');
    }
  };

  const getEventBadge = (eventKey?: string) => {
    if (!eventKey) return null;
    if (eventKey.includes('RESPONSE')) {
      return <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>💬 Quote / Offer</span>;
    }
    if (eventKey.includes('REQUEST')) {
      return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>📢 Request Update</span>;
    }
    if (eventKey.includes('APPROVED') || eventKey.includes('ACTIVATED')) {
      return <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>✓ Verified Status</span>;
    }
    if (eventKey.includes('REVIEW')) {
      return <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>⭐ Customer Review</span>;
    }
    if (eventKey.includes('WELCOME')) {
      return <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>🎉 Welcome</span>;
    }
    return null;
  };

  if (!user) {
    const samples = [
      { icon: <MessageSquareQuote size={18} />, title: 'New quote on your request', text: 'A provider replied with a price' },
      { icon: <BadgeCheck size={18} />, title: 'Your profile was approved', text: 'You can now be found by customers' },
      { icon: <Star size={18} />, title: 'You got a new review', text: 'See what a customer said' },
    ];
    return (
      <section className="fl" aria-labelledby="fl-notif-title">
        <div className="fl-gate">
          <FlowBrand
            kicker="Stay in the loop"
            title={
              <>
                Never miss a <span className="fl-script">reply.</span>
              </>
            }
            photo={false}
          >
            <ul className="fl-samples" aria-label="Examples of notifications">
              {samples.map((s, i) => (
                <li key={s.title} className="fl-sample" style={{ '--fl-i': i } as React.CSSProperties}>
                  <span className="fl-sample-icon" aria-hidden="true">{s.icon}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <span>{s.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </FlowBrand>

          <div className="fl-main">
            <div className="fl-main-inner">
              <span className="fl-bell" aria-hidden="true">
                <Bell size={34} />
                <span className="fl-bell-dot" />
              </span>
              <h1 className="fl-title" id="fl-notif-title">Sign in to see your notifications</h1>
              <p className="fl-sub">
                Quotes on your requests, replies from providers and updates to your profile all show up here.
              </p>
              <div className="fl-actions">
                <button type="button" className="fl-btn fl-btn-lime fl-btn-block" onClick={() => onNavigate('Auth')}>
                  Sign in <ArrowRight size={18} />
                </button>
                <button type="button" className="fl-btn fl-btn-outline fl-btn-block" onClick={() => onNavigate('Auth')}>
                  Create a free account
                </button>
              </div>
              <p className="fl-legal">
                Just looking?{' '}
                <button type="button" className="fl-link" onClick={() => onNavigate('Home')}>
                  Browse the marketplace
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Notifications</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
            Multi-channel alerts for quotes received, vendor approvals, and request updates.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isAdmin && (
            <button className="btn-outline btn-sm" onClick={() => onNavigate('Admin')}>
              ⚙️ Manage Notification Messages
            </button>
          )}
          {unreadCount > 0 && (
            <button className="btn-outline btn-sm" onClick={handleMarkAllRead}>
              ✓ Mark All Read
            </button>
          )}
          <button className="btn-outline btn-sm" onClick={() => onNavigate('Account')}>
            Dashboard
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notifications.map(n => (
          <div
            key={n.id}
            className="item-card"
            style={{
              background: n.read_at ? '#fff' : '#f0fdf4',
              borderColor: n.read_at ? 'var(--border)' : '#86efac',
              padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  {getEventBadge(n.event_key)}
                  <span className="card-badge" style={{ background: '#f3f4f6', color: '#555', fontSize: 11 }}>
                    {n.channel || 'IN_APP'}
                  </span>
                  {!n.read_at && (
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '1px 6px', borderRadius: 10 }}>
                      New
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 14, color: '#222', lineHeight: 1.6, margin: '4px 0 8px', whiteSpace: 'pre-line' }}>
                  {n.message}
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    🕒 {new Date(n.created_at).toLocaleString()}
                  </small>

                  {n.link_type && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(n)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--brand-purple)',
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      {n.link_type === 'REQUEST' ? 'View Request Details →' :
                       n.link_type === 'RESPONSE' ? 'View Quotes & Offers →' :
                       n.link_type === 'PROVIDER' ? 'View Provider Profile →' :
                       n.link_type === 'REVIEW' ? 'View Reviews →' : 'View Details →'}
                    </button>
                  )}
                </div>
              </div>

              {!n.read_at && (
                <button
                  className="btn-outline btn-sm"
                  style={{ whiteSpace: 'nowrap', fontSize: 12 }}
                  onClick={() => handleMarkRead(n.id)}
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}

        {notifications.length === 0 && (() => {
          const isUserAdmin = isAdmin || user?.role === 'ADMIN' || user?.role === 'ADMINISTRATOR';
          const isUserProvider = isVendor || user?.role === 'VENDOR' || user?.role === 'ARTISAN';

          let emptyDescription = 'You will receive updates when providers respond to your requests.';
          if (isUserAdmin) {
            emptyDescription = 'You will receive updates about provider applications, reports and platform activity.';
          } else if (isUserProvider) {
            emptyDescription = 'You will receive updates about customer requests, enquiries and your listings.';
          }

          return (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--brand-purple)', fontSize: 18 }}>No Notifications Yet</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14.5, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
                {emptyDescription}
              </p>
              <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {isUserAdmin ? (
                  <>
                    <button className="btn-lime" onClick={() => onNavigate('Admin')}>
                      Go to Admin Dashboard →
                    </button>
                  </>
                ) : isUserProvider ? (
                  <>
                    <button className="btn-lime" onClick={() => onNavigate('Requests')}>
                      Explore Customer Requests →
                    </button>
                    <button className="btn-outline" onClick={() => onNavigate('Vendor Workspace')}>
                      Vendor Workspace →
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-lime" onClick={() => onNavigate('Post What I Need')}>
                      Post What I Need →
                    </button>
                    <button className="btn-outline" onClick={() => onNavigate('Home')}>
                      Browse Marketplace →
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
