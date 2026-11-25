import React from 'react';
import { Favorite } from '../types';
import { DirectContactButtons } from '../components/DirectContactButtons';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { DirectoryCardsSkeleton } from '../components/SkeletonLoader';

interface FavouritesPageProps {
  favorites: Favorite[];
  onRemoveFavorite: (itemId: string) => void;
  onSelectItem: (item: any) => void;
  onNavigate: (page: string) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  loading?: boolean;
}

export const FavouritesPage: React.FC<FavouritesPageProps> = ({
  favorites,
  onRemoveFavorite,
  onSelectItem,
  onNavigate,
  loading = false,
}) => {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 12px 40px' }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => onNavigate('Account')}
            style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            ← Back to Account
          </button>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>❤️</span> My Saved Favourites
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14.5, color: 'var(--text-muted)' }}>
            Save listings you are interested in so you can easily find them later.
          </p>
        </div>

        {favorites.length > 0 && (
          <span style={{ fontSize: 13, background: '#fee2e2', color: '#b91c1c', padding: '6px 14px', borderRadius: 20, fontWeight: 700 }}>
            {favorites.length} {favorites.length === 1 ? 'saved listing' : 'saved listings'}
          </span>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ marginTop: 20 }}>
          <DirectoryCardsSkeleton count={3} />
        </div>
      ) : favorites.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid var(--border)',
            padding: '50px 24px',
            textAlign: 'center',
            maxWidth: 540,
            margin: '30px auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              fontSize: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            🤍
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: 'var(--charcoal)' }}>
            No saved favourites yet
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
            Save listings you are interested in so you can easily find them later. Browse popular listings or the campus catalog and click the heart icon on any item you want to save.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-lime"
              onClick={() => onNavigate('Home')}
              style={{ padding: '10px 20px', fontSize: 14, fontWeight: 700 }}
            >
              Explore Popular Listings →
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => onNavigate('Products')}
              style={{ padding: '10px 18px', fontSize: 14, fontWeight: 600 }}
            >
              Browse Directory
            </button>
          </div>
        </div>
      ) : (
        /* Saved Favourites Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {favorites.map(fav => {
            const title = fav.current_title || fav.item_title;
            const price = fav.current_price != null ? fav.current_price : fav.item_price;
            const imageUrl = fav.current_image_url || fav.item_image_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80';
            const location = fav.current_location || fav.item_location;
            const providerName = fav.current_provider_name || fav.provider_name;
            const phone = fav.current_phone || fav.phone;
            const whatsapp = fav.current_whatsapp || fav.whatsapp;
            const description = fav.current_description || fav.description;
            const availability = fav.current_availability;

            const modalItem = {
              id: fav.listing_id || fav.item_id,
              name: title,
              title: title,
              price: price,
              location: location,
              image_url: imageUrl,
              provider_name: providerName,
              phone: phone,
              whatsapp: whatsapp,
              description: description,
              availability_status: availability,
              kind: fav.item_type || 'PRODUCT',
            };

            return (
              <article
                key={fav.id || fav.item_id}
                style={{
                  background: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Media Image with Remove Heart Button */}
                <div style={{ position: 'relative', width: '100%', height: 160, background: '#f8fafc' }}>
                  <img
                    src={imageUrl}
                    alt={title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  {availability && (
                    <div style={{ position: 'absolute', top: 8, left: 8 }}>
                      <AvailabilityBadge status={availability} size="sm" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(fav.item_id)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(255, 255, 255, 0.92)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    }}
                    title="Remove from favourites"
                    aria-label="Remove from favourites"
                  >
                    ❤️
                  </button>
                </div>

                {/* Card Content */}
                <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3
                    style={{
                      margin: '0 0 6px',
                      fontSize: 15.5,
                      fontWeight: 700,
                      color: 'var(--charcoal)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={title}
                  >
                    {title}
                  </h3>

                  {price != null && (
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#15803d', marginBottom: 6 }}>
                      ₦{price.toLocaleString()}
                    </div>
                  )}

                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>📍</span> {location || 'LAUTECH Area'}
                  </div>

                  {providerName && (
                    <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 12, fontWeight: 500 }}>
                      By <span style={{ fontWeight: 600 }}>{providerName}</span>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        style={{ flex: 1, fontSize: 12.5, padding: '7px 8px' }}
                        onClick={() => onSelectItem(modalItem)}
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        style={{ color: '#dc2626', borderColor: '#fca5a5', fontSize: 12, padding: '7px 10px' }}
                        onClick={() => onRemoveFavorite(fav.item_id)}
                        title="Remove from favourites"
                      >
                        Remove
                      </button>
                    </div>

                    {(phone || whatsapp) && (
                      <DirectContactButtons
                        phone={phone}
                        whatsapp={whatsapp}
                        listingTitle={title}
                      />
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
