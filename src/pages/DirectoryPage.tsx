import React, { useState } from 'react';
import { Category, Location, AvailabilityStatus } from '../types';
import { getCategoriesForType } from '../components/CategorySelect';
import { DirectContactButtons } from '../components/DirectContactButtons';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { DirectoryCardsSkeleton, SearchLoadingBanner } from '../components/SkeletonLoader';

interface DirectoryPageProps {
  pageTitle: string;
  items: any[];
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
  onSelectItem: (item: any) => void;
  onNavigate: (page: string) => void;
  favorites?: Record<string, boolean>;
  onToggleFavorite?: (item: any) => void;
  loading?: boolean;
}

export const DirectoryPage: React.FC<DirectoryPageProps> = ({
  pageTitle,
  items,
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
  onSelectItem,
  onNavigate,
  favorites = {},
  onToggleFavorite,
  loading = false,
}) => {
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | AvailabilityStatus>('ALL');

  const listingType =
    pageTitle === 'Businesses'
      ? 'BUSINESS'
      : pageTitle === 'Campus Artisans' || pageTitle === 'Artisans'
      ? 'ARTISAN'
      : pageTitle === 'Services'
      ? 'SERVICE'
      : pageTitle === 'Products' || pageTitle === 'Pre-owned Items'
      ? 'PRODUCT'
      : 'ALL';

  const relevantCategories = getCategoriesForType(categories, listingType);

  const displayedItems = items.filter(item => {
    if (pageTitle !== 'Pre-owned Items' || availabilityFilter === 'ALL') return true;
    const itemStatus = (item.availability_status || 'AVAILABLE').toUpperCase();
    return itemStatus === availabilityFilter;
  });
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>{pageTitle}</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
            {pageTitle === 'Campus Artisans' || pageTitle === 'Artisans'
              ? 'Find trusted artisans, skilled technicians, handwork professionals and repairs across LAUTECH & Ogbomoso.'
              : pageTitle === 'Businesses'
              ? 'Discover vetted local shops, stores, and merchant brands around LAUTECH & Ogbomoso.'
              : 'Browse approved listings, local providers, and items.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pageTitle === 'Pre-owned Items' ? (
            <>
              <button className="btn-outline btn-sm" onClick={() => onNavigate('Post Pre-owned Request')}>
                📢 Request a Used Item
              </button>
              <button className="btn-lime btn-sm" onClick={() => onNavigate('Sell Pre-owned Item')}>
                🏷️ Sell Pre-owned Item
              </button>
            </>
          ) : (
            <>
              <button className="btn-outline btn-sm" onClick={() => onNavigate('Post What I Need')}>
                📢 Post What I Need
              </button>
              <button className="btn-lime btn-sm" onClick={() => onNavigate('Sell Pre-owned Item')}>
                🏷️ Sell Pre-owned Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="search-box-bar" style={{ marginBottom: 24 }}>
        <div className="search-input-group">
          <span>🔍</span>
          <input
            placeholder={`Search ${pageTitle.toLowerCase()}...`}
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
            {relevantCategories.map(c => (
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

      {/* Pre-owned Availability Filter Pills */}
      {pageTitle === 'Pre-owned Items' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Availability:</span>
          {(['ALL', 'AVAILABLE', 'RESERVED', 'SOLD'] as const).map(st => (
            <button
              key={st}
              onClick={() => setAvailabilityFilter(st)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: availabilityFilter === st ? 700 : 500,
                border: '1px solid',
                borderColor: availabilityFilter === st
                  ? st === 'AVAILABLE' ? '#16a34a' : st === 'RESERVED' ? '#d97706' : st === 'SOLD' ? '#475569' : 'var(--dark-moss)'
                  : 'var(--border)',
                background: availabilityFilter === st
                  ? st === 'AVAILABLE' ? '#dcfce7' : st === 'RESERVED' ? '#fef3c7' : st === 'SOLD' ? '#f1f5f9' : 'var(--dark-moss)'
                  : '#fff',
                color: availabilityFilter === st
                  ? st === 'AVAILABLE' ? '#15803d' : st === 'RESERVED' ? '#b45309' : st === 'SOLD' ? '#475569' : '#fff'
                  : 'var(--text-dark)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {st === 'ALL' && 'All Items'}
              {st === 'AVAILABLE' && '🟢 Available Only'}
              {st === 'RESERVED' && '🟡 Reserved'}
              {st === 'SOLD' && '⚪ Sold'}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ marginTop: 20 }}>
          <SearchLoadingBanner text={`Searching ${pageTitle.toLowerCase()} near LAUTECH & Ogbomoso...`} />
          <DirectoryCardsSkeleton count={6} />
        </div>
      )}

      {/* Cards Grid */}
      {!loading && (
        <div className="cards-grid">
          {displayedItems.map(item => {
          const imgCount = item.images ? item.images.split(',').filter(Boolean).length : (item.image_url ? 1 : 0);
          const displayImage = item.image_url || (item.images ? item.images.split(',')[0].trim() : null);
          const isSold = (item.availability_status || '').toUpperCase() === 'SOLD';

          return (
            <article
              key={item.id}
              className="item-card"
              style={{ cursor: 'pointer', opacity: isSold ? 0.78 : 1 }}
              onClick={() => onSelectItem(item)}
            >
              <div>
                <div className="item-card-header">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="card-badge">
                      {item.type === 'PROFESSIONAL'
                        ? (item.custom_category || item.category || item.category_name || 'Artisan')
                        : item.type === 'BUSINESS'
                        ? (item.custom_category || item.category || item.category_name || 'Business')
                        : (item.custom_category || item.category || item.category_name || item.kind || item.type)}
                    </span>
                    {item.kind === 'PROJECT' && (
                      <span style={{ fontSize: 11, background: '#7c3aed', color: '#fff', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                        🛠️ Past Work
                      </span>
                    )}
                    {(item.request_type === 'PREOWNED_SALE' || item.condition) && (
                      <span style={{ fontSize: 11, background: '#10b981', color: '#fff', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                        🏷️ {item.condition || 'Pre-owned'}
                      </span>
                    )}
                    {(item.request_type === 'PREOWNED_SALE' || item.availability_status) && (
                      <AvailabilityBadge status={item.availability_status || 'AVAILABLE'} size="sm" />
                    )}
                  </div>
                  {item.verified ? (
                    <span className="verified-pill">✓ Verified {item.type === 'PROFESSIONAL' ? 'Artisan' : 'Provider'}</span>
                  ) : (
                    <span className="approved-pill">✓ Approved {item.type === 'PROFESSIONAL' ? 'Artisan' : 'Provider'}</span>
                  )}
                  {(Number(item.avg_rating) > 0 || Number(item.provider_rating) > 0) && (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 7px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      ★ {Number(item.avg_rating || item.provider_rating).toFixed(1)}
                      <span style={{ fontSize: 10.5, color: '#78350f', fontWeight: 500 }}>
                        ({item.review_count ?? item.provider_review_count ?? 1})
                      </span>
                    </span>
                  )}
                </div>

                <h3 style={{ margin: '8px 0 4px', fontSize: 16 }}>{item.name || item.title}</h3>

                {displayImage && (
                  <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', margin: '8px 0', background: '#f8fafc' }}>
                    <img
                      src={displayImage}
                      alt={item.name || item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {onToggleFavorite && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onToggleFavorite(item);
                        }}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'rgba(255, 255, 255, 0.92)',
                          border: 'none',
                          borderRadius: '50%',
                          width: 30,
                          height: 30,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 15,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                        }}
                        title="Save listings you are interested in so you can easily find them later."
                        aria-label="Save listings you are interested in so you can easily find them later."
                      >
                        {favorites[item.id] ? '❤️' : '🤍'}
                      </button>
                    )}
                    {imgCount > 1 && (
                      <span style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        fontSize: 10.5,
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontWeight: 600,
                        backdropFilter: 'blur(4px)'
                      }}>
                        📷 {imgCount} photos
                      </span>
                    )}
                  </div>
                )}

                {item.description && (
                  <p className="description" style={{ fontSize: 13, color: '#555', margin: '4px 0 8px' }}>
                    {item.description.length > 120 ? item.description.substring(0, 120) + '...' : item.description}
                  </p>
                )}

                {(item.price || item.budget) && (
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--brand-purple)', margin: '4px 0' }}>
                    ₦{Number(item.price || item.budget).toLocaleString()}
                  </div>
                )}

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  📍 {item.location_area || item.location}
                  {item.landmark && ` (${item.landmark})`}
                </div>

                {item.provider_name && (
                  <div style={{ fontSize: 12, color: '#333', marginTop: 4 }}>
                    🏪 Vendor: <strong>{item.provider_name}</strong>
                  </div>
                )}
              </div>

              <div onClick={e => e.stopPropagation()}>
                <DirectContactButtons
                  phone={item.phone || item.customer_phone}
                  whatsapp={item.whatsapp || item.customer_phone || item.phone}
                  listingTitle={item.name || item.title}
                />
              </div>
            </article>
          );
        })}
        </div>
      )}

      {!loading && displayedItems.length === 0 && (() => {
        const hasFilters = Boolean(q || locationFilter || categoryFilter || (pageTitle === 'Pre-owned Items' && availabilityFilter !== 'ALL'));
        const isArtisan = pageTitle === 'Campus Artisans' || pageTitle === 'Artisans' || pageTitle === 'Professionals';
        const isBusiness = pageTitle === 'Businesses';
        const isProduct = pageTitle === 'Products';
        const isPreowned = pageTitle === 'Pre-owned Items' || pageTitle === 'Pre-owned';
        const isService = pageTitle === 'Services';

        let icon = '🔍';
        let title = `No ${pageTitle.toLowerCase()} found`;
        let message = 'Try broadening your search keywords or choosing another location, or tell the ECLAT CONNECT community what you need.';
        let primaryBtn = {
          label: 'Post What I Need →',
          action: () => onNavigate('Post What I Need'),
        };
        let secondaryBtn: { label: string; action: () => void } | null = null;

        if (isBusiness) {
          icon = '🏪';
          title = 'No businesses found';
          message = hasFilters
            ? 'No businesses found matching your criteria. Try another location or category, or broaden your search.'
            : 'No businesses found – try another location or category.';
          primaryBtn = {
            label: '📢 Post What I Need →',
            action: () => onNavigate('Post What I Need'),
          };
        } else if (isProduct) {
          icon = '🛍️';
          title = 'No products found';
          message = hasFilters
            ? 'No products found matching your search. Broaden your search keywords, choose "All Locations", or post a request for the product you need.'
            : 'No products found – broaden your search.';
          primaryBtn = {
            label: '🛍️ Request This Product →',
            action: () => onNavigate('Post Product Request'),
          };
        } else if (isArtisan) {
          icon = '🛠️';
          title = 'No artisans found';
          message = hasFilters
            ? 'No campus artisans found matching your filter. View other categories, select another location, or post a request so skilled artisans can reach out.'
            : 'No artisans found – view other categories or post a request.';
          primaryBtn = {
            label: '🛠️ Post an Artisan / Service Request →',
            action: () => onNavigate('Post Service Request'),
          };
        } else if (isPreowned) {
          icon = '♻️';
          title = 'No pre-owned items found';
          message = hasFilters
            ? 'No pre-owned items found matching your filter. Request the item you need, or try changing your search or location.'
            : 'No pre-owned items found – request the item you need.';
          primaryBtn = {
            label: '♻️ Request a Pre-owned Item →',
            action: () => onNavigate('Post Pre-owned Request'),
          };
          secondaryBtn = {
            label: '🏷️ Sell a Pre-owned Item →',
            action: () => onNavigate('Sell Pre-owned Item'),
          };
        } else if (isService) {
          icon = '⚙️';
          title = 'No services found';
          message = hasFilters
            ? 'No services found matching your criteria. Try choosing another location or category, or post a request so local providers can reach out.'
            : 'No services found – try another location or category, or post a request.';
          primaryBtn = {
            label: '⚙️ Post a Service Request →',
            action: () => onNavigate('Post Service Request'),
          };
        }

        return (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
            <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--brand-purple)' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 520, margin: '8px auto 20px', lineHeight: 1.55 }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-lime" onClick={primaryBtn.action}>
                {primaryBtn.label}
              </button>
              {secondaryBtn && (
                <button className="btn-outline" onClick={secondaryBtn.action}>
                  {secondaryBtn.label}
                </button>
              )}
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
