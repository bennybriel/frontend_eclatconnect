import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Provider } from '../types';

interface AccountPageProps {
  myProviders: Provider[];
  myRequestsCount: number;
  unreadCount: number;
  favoritesCount?: number;
  onNavigate: (page: string) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  myProviders,
  myRequestsCount,
  unreadCount,
  favoritesCount = 0,
  onNavigate,
  onToast,
}) => {
  const { user, isAdmin, isVendor, logout } = useAuth();

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Sign in to view your account</h2>
        <button className="btn-lime" onClick={() => onNavigate('Auth')} style={{ marginTop: 14 }}>
          Sign In Now
        </button>
      </div>
    );
  }

  const primaryProvider = myProviders[0] || null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Profile Card */}
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--brand-purple)',
                color: 'var(--brand-lime)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>{user.name}</h2>
                <span className="card-badge" style={{ background: '#f3e8ff', color: '#6b21a8', fontWeight: 600 }}>
                  {user.role}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {user.email} {user.phone && `· 📞 ${user.phone}`}
              </div>
            </div>
          </div>

          <button
            className="btn-outline btn-sm"
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            onClick={() => {
              logout();
              onToast('You have signed out.', 'info');
              onNavigate('Home');
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Workspace Quick Links */}
      <h3 style={{ margin: '0 0 14px 0' }}>Activity Modules & Portals</h3>
      <div className="quick-tiles-grid">
        <button className="quick-tile" onClick={() => onNavigate('My Requests')}>
          <div className="quick-tile-header">
            <span className="quick-tile-title">📋 My Requests</span>
            <span>→</span>
          </div>
          <span className="quick-tile-desc">View your open requests & quotes ({myRequestsCount})</span>
        </button>

        <button className="quick-tile" onClick={() => onNavigate('Responses')}>
          <div className="quick-tile-header">
            <span className="quick-tile-title">💬 Quotes Received</span>
            <span>→</span>
          </div>
          <span className="quick-tile-desc">Inspect incoming offers from approved providers</span>
        </button>

        <button className="quick-tile" onClick={() => onNavigate('My Reviews')}>
          <div className="quick-tile-header">
            <span className="quick-tile-title">⭐ My Reviews & Ratings</span>
            <span>→</span>
          </div>
          <span className="quick-tile-desc">Feedback & ratings you left for campus businesses</span>
        </button>

        <button className="quick-tile" onClick={() => onNavigate('Favourites')}>
          <div className="quick-tile-header">
            <span className="quick-tile-title">❤️ Saved Favourites</span>
            <span>→</span>
          </div>
          <span className="quick-tile-desc">Save listings you are interested in so you can easily find them later ({favoritesCount})</span>
        </button>

        <button className="quick-tile" onClick={() => onNavigate('Notifications')}>
          <div className="quick-tile-header">
            <span className="quick-tile-title">🔔 Notifications</span>
            <span>→</span>
          </div>
          <span className="quick-tile-desc">Alerts and multi-channel updates ({unreadCount} unread)</span>
        </button>

        {(isVendor || primaryProvider) && (
          <button
            className="quick-tile"
            style={{ borderColor: 'var(--brand-purple)', background: '#faf5ff' }}
            onClick={() => onNavigate('Vendor Workspace')}
          >
            <div className="quick-tile-header">
              <span className="quick-tile-title" style={{ color: 'var(--brand-purple)', fontWeight: 700 }}>
                {user?.role === 'ARTISAN' ? '🛠️ Artisan Portal & Dashboard' : '🏪 Vendor Portal & Dashboard'}
              </span>
              <span>→</span>
            </div>
            <span className="quick-tile-desc">Executive dashboard overview, products, services, leads & workspace settings</span>
          </button>
        )}

        {(isVendor || primaryProvider) && (
          <button className="quick-tile" onClick={() => onNavigate('Provider Application')}>
            <div className="quick-tile-header">
              <span className="quick-tile-title">📝 Provider Application</span>
              <span>→</span>
            </div>
            <span className="quick-tile-desc">
              {primaryProvider
                ? `Edit Profile (${primaryProvider.status})`
                : user?.role === 'ARTISAN'
                ? 'Register your artisan craft & trade'
                : 'Register your business / store'}
            </span>
          </button>
        )}

        {(isVendor || primaryProvider) && (
          <button className="quick-tile" onClick={() => onNavigate('New Listing')}>
            <div className="quick-tile-header">
              <span className="quick-tile-title">+ Publish New Listing</span>
              <span>→</span>
            </div>
            <span className="quick-tile-desc">Add a product or service to the campus catalog</span>
          </button>
        )}

        {isAdmin && (
          <button
            className="quick-tile"
            style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a' }}
            onClick={() => onNavigate('Admin')}
          >
            <div className="quick-tile-header">
              <span className="quick-tile-title" style={{ color: '#92400e' }}>
                🛡️ Administrator Console
              </span>
              <span>→</span>
            </div>
            <span className="quick-tile-desc">Approvals, user access, audit trail & WhatsApp</span>
          </button>
        )}
      </div>
    </div>
  );
};
