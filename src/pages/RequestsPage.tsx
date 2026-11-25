import React from 'react';
import { Category, Location, ServiceRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { RequestsCardsSkeleton, SearchLoadingBanner } from '../components/SkeletonLoader';

interface RequestsPageProps {
  requests: ServiceRequest[];
  categories: Category[];
  locations: Location[];
  q: string;
  locationFilter: string;
  categoryFilter: string;
  onSearchChange: (q: string) => void;
  onLocationChange: (loc: string) => void;
  onCategoryChange: (cat: string) => void;
  onFilterSubmit: () => void;
  onResetFilters?: () => void;
  onNavigate: (page: string, params?: any) => void;
  onRespondToRequest: (req: ServiceRequest) => void;
  loading?: boolean;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({
  requests,
  categories,
  locations,
  q,
  locationFilter,
  categoryFilter,
  onSearchChange,
  onLocationChange,
  onCategoryChange,
  onFilterSubmit,
  onResetFilters,
  onNavigate,
  onRespondToRequest,
  loading = false,
}) => {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Customer Requests</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
            Active requests for products, services, skilled professionals, and pre-owned goods across LAUTECH &amp; Ogbomoso.
          </p>
        </div>
        <button className="btn-lime" onClick={() => onNavigate('Post What I Need')}>
          📢 Post What I Need
        </button>
      </div>

      {/* Filter Bar */}
      <div className="search-box-bar" style={{ marginBottom: 24 }}>
        <div className="search-input-group">
          <span>🔍</span>
          <input
            placeholder="Search requests..."
            value={q}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onFilterSubmit()}
          />
        </div>

        <div className="search-select-group">
          <span>📍</span>
          <select value={locationFilter} onChange={e => onLocationChange(e.target.value)}>
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.area}
              </option>
            ))}
          </select>
        </div>

        <div className="search-select-group">
          <span>🏷️</span>
          <select value={categoryFilter} onChange={e => onCategoryChange(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={onFilterSubmit} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {loading ? (
            <>
              <span className="eclat-loading-ring-lime" />
              <span>Filtering...</span>
            </>
          ) : (
            'Filter'
          )}
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ marginTop: 20 }}>
          <SearchLoadingBanner text="Searching and updating customer requests..." />
          <RequestsCardsSkeleton count={4} />
        </div>
      )}

      {/* Requests Grid */}
      {!loading && (
        <div className="cards-grid">
          {requests.map(req => (
          <article key={req.id} className="item-card">
            <div>
              <div className="item-card-header">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="card-badge">{req.custom_category || req.category || req.category_name || 'Request'}</span>
                  {req.request_type === 'SERVICE' && (
                    <span className="card-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>🛠️ Service</span>
                  )}
                  {req.request_type === 'PRODUCT' && (
                    <span className="card-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>🛍️ Product</span>
                  )}
                  {req.request_type === 'PREOWNED_REQUEST' && (
                    <span className="card-badge" style={{ background: '#fef3c7', color: '#b45309' }}>♻️ Pre-owned Wanted</span>
                  )}
                  {req.condition && (
                    <span className="card-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{req.condition}</span>
                  )}
                </div>
                <span className="card-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                  💬 {req.response_count || 0} Quotes
                </span>
              </div>

              <h3 style={{ margin: '8px 0 4px', fontSize: 16 }}>{req.title}</h3>

              {req.image_url && (
                <img
                  src={req.image_url}
                  alt={req.title}
                  style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6, margin: '8px 0' }}
                />
              )}

              <p className="description" style={{ fontSize: 13, color: '#555', margin: '4px 0 8px' }}>
                {req.description}
              </p>

              {req.budget && (
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-purple)', margin: '4px 0' }}>
                  💰 Budget: ₦{Number(req.budget).toLocaleString()}
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <span>📍 General Area: <strong>{req.location_area || req.location}</strong></span>
                <span style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                  🔒 Address Protected
                </span>
              </div>

              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                Expires: {new Date(req.expires_at).toLocaleDateString()}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              {user && user.id === req.customer_id ? (
                <button
                  className="btn-outline btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => onNavigate('Responses')}
                >
                  View Received Quotes ({req.response_count || 0}) →
                </button>
              ) : (
                <button
                  className="btn-lime btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => onRespondToRequest(req)}
                >
                  💰 Submit Quote / Offer
                </button>
              )}
            </div>
          </article>
        ))}
        </div>
      )}

      {!loading && requests.length === 0 && (() => {
        const hasFilters = Boolean(q || locationFilter || categoryFilter);
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📢</div>
            <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--brand-purple)' }}>
              {hasFilters ? 'No matching requests found' : 'No open requests right now'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 460, margin: '8px auto 20px', lineHeight: 1.5 }}>
              {hasFilters
                ? 'Try broadening your search or choosing another location, or tell the ECLAT CONNECT community what you need.'
                : 'Tell the ECLAT CONNECT community what you need.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-lime" onClick={() => onNavigate('Post What I Need')}>
                Post What I Need →
              </button>
              {hasFilters && onResetFilters && (
                <button className="btn-outline" onClick={onResetFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
