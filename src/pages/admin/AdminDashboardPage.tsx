import React, { useState } from 'react';
import { Provider, User, Role, Permission, ActivityLog, WhatsAppLog, Category, Location } from '../../types';
import { AdminVendorApprovalsTab } from './AdminVendorApprovalsTab';
import { AdminUserRolesTab } from './AdminUserRolesTab';
import { AdminRolesPermissionsTab } from './AdminRolesPermissionsTab';
import { AdminActivityAuditTab } from './AdminActivityAuditTab';
import { AdminWhatsAppTab } from './AdminWhatsAppTab';
import { AdminReportsTab } from './AdminReportsTab';
import { AdminTaxonomyTab } from './AdminTaxonomyTab';
import { AdminNotificationTemplatesTab } from './AdminNotificationTemplatesTab';
import { AdminBroadcastTab } from './AdminBroadcastTab';
import { EclatLogo } from '../../components/EclatLogo';

interface AdminDashboardPageProps {
  overviewData: any;
  providers: Provider[];
  users: User[];
  roles: Role[];
  permissions: Permission[];
  activityLogs: ActivityLog[];
  whatsappLogs: WhatsAppLog[];
  reports: any[];
  categories: Category[];
  locations: Location[];
  onRefresh: () => void;
  onNavigate: (page: string) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  overviewData,
  providers,
  users,
  roles,
  permissions,
  activityLogs,
  whatsappLogs,
  reports,
  categories,
  locations,
  onRefresh,
  onNavigate,
  onToast,
}) => {
  const [tab, setTab] = useState('providers');

  const tabs = [
    { id: 'providers', label: `Vendor Approvals (${providers.filter(p => p.status === 'PENDING').length})` },
    { id: 'broadcasts', label: '📢 Broadcast (WhatsApp & Web)' },
    { id: 'notifications', label: '🔔 Notification Templates' },
    { id: 'users', label: `Users & Roles (${users.length})` },
    { id: 'roles', label: `Roles & Perms (${roles.length})` },
    { id: 'activity', label: 'Activity Audit Trail' },
    { id: 'whatsapp', label: 'WhatsApp Cloud API' },
    { id: 'overview', label: 'Metrics Overview' },
    { id: 'taxonomy', label: 'Categories & Locations' },
    { id: 'reports', label: `Reports (${reports.filter(r => r.status === 'OPEN').length})` },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <EclatLogo size={36} onClick={() => onNavigate('Home')} />
          <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 14 }}>
            <h1 style={{ margin: 0, fontSize: 22 }}>🛡️ Platform Administration</h1>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Manage vendor approvals, RBAC access, activity audit trail, and WhatsApp integrations.
            </p>
          </div>
        </div>
        <button className="btn-outline btn-sm" onClick={() => onNavigate('Account')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: 20 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Stats Tab */}
      {tab === 'overview' && overviewData && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-num">{overviewData.users || users.length}</div>
            <div className="stat-label">Registered Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--warning)' }}>
              {overviewData.pending_providers || providers.filter(p => p.status === 'PENDING').length}
            </div>
            <div className="stat-label">Pending Vendor Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--success)' }}>
              {overviewData.approved_providers || providers.filter(p => p.status === 'APPROVED').length}
            </div>
            <div className="stat-label">Approved Providers</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{overviewData.open_requests || 0}</div>
            <div className="stat-label">Open Customer Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{overviewData.active_listings || 0}</div>
            <div className="stat-label">Active Listings</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--danger)' }}>
              {overviewData.open_reports || reports.filter(r => r.status === 'OPEN').length}
            </div>
            <div className="stat-label">Open Flagged Reports</div>
          </div>
        </div>
      )}

      {/* Vendor Approvals */}
      {tab === 'providers' && (
        <AdminVendorApprovalsTab
          providers={providers}
          onRefresh={onRefresh}
          onToast={onToast}
        />
      )}

      {/* Broadcast Announcements */}
      {tab === 'broadcasts' && (
        <AdminBroadcastTab
          onToast={onToast}
        />
      )}

      {/* Users & Roles */}
      {tab === 'users' && (
        <AdminUserRolesTab
          users={users}
          roles={roles}
          onRefresh={onRefresh}
          onToast={onToast}
        />
      )}

      {/* Roles & Permissions */}
      {tab === 'roles' && (
        <AdminRolesPermissionsTab
          roles={roles}
          permissions={permissions}
          onRefresh={onRefresh}
          onToast={onToast}
        />
      )}

      {/* Activity Audit Trail */}
      {tab === 'activity' && (
        <AdminActivityAuditTab
          logs={activityLogs}
          onRefresh={onRefresh}
        />
      )}

      {/* WhatsApp Cloud API */}
      {tab === 'whatsapp' && (
        <AdminWhatsAppTab
          logs={whatsappLogs}
          onRefresh={onRefresh}
          onToast={onToast}
        />
      )}

      {/* Categories & Locations */}
      {tab === 'taxonomy' && (
        <AdminTaxonomyTab
          categories={categories}
          locations={locations}
          onRefresh={onRefresh}
          onToast={onToast}
        />
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <AdminReportsTab
          reports={reports}
          onRefresh={onRefresh}
          onToast={onToast}
        />
      )}

      {/* Notification Messages & Dynamic Copy Management */}
      {tab === 'notifications' && (
        <AdminNotificationTemplatesTab
          onToast={onToast}
        />
      )}
    </div>
  );
};
