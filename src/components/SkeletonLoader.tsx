import React from 'react';

interface DirectorySkeletonProps {
  count?: number;
}

export const DirectoryCardsSkeleton: React.FC<DirectorySkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="cards-grid" aria-busy="true" aria-label="Loading content...">
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={`skel-dir-${i}`}
          className="item-card"
          style={{ pointerEvents: 'none', minHeight: 380, justifyContent: 'space-between' }}
        >
          <div>
            {/* Badges & Verified Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="eclat-skeleton-box" style={{ width: 90, height: 22, borderRadius: 6 }} />
              <div className="eclat-skeleton-box" style={{ width: 80, height: 20, borderRadius: 6 }} />
            </div>

            {/* Title */}
            <div className="eclat-skeleton-box" style={{ width: '85%', height: 22, marginBottom: 12 }} />

            {/* Media Image */}
            <div className="eclat-skeleton-box" style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 12 }} />

            {/* Description lines */}
            <div className="eclat-skeleton-box" style={{ width: '100%', height: 14, marginBottom: 6 }} />
            <div className="eclat-skeleton-box" style={{ width: '65%', height: 14, marginBottom: 14 }} />

            {/* Price */}
            <div className="eclat-skeleton-box" style={{ width: 110, height: 24, marginBottom: 10 }} />

            {/* Location & Landmark */}
            <div className="eclat-skeleton-box" style={{ width: 140, height: 14 }} />
          </div>

          {/* Contact Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
            <div className="eclat-skeleton-box" style={{ height: 38, borderRadius: 8 }} />
            <div className="eclat-skeleton-box" style={{ height: 38, borderRadius: 8 }} />
          </div>
        </article>
      ))}
    </div>
  );
};

export const RequestsCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="cards-grid" aria-busy="true" aria-label="Loading requests...">
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={`skel-req-${i}`}
          className="item-card"
          style={{ pointerEvents: 'none', minHeight: 260, justifyContent: 'space-between' }}
        >
          <div>
            {/* Header badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="eclat-skeleton-box" style={{ width: 100, height: 22, borderRadius: 6 }} />
              <div className="eclat-skeleton-box" style={{ width: 85, height: 22, borderRadius: 6 }} />
            </div>

            {/* Title */}
            <div className="eclat-skeleton-box" style={{ width: '80%', height: 22, marginBottom: 10 }} />

            {/* Description */}
            <div className="eclat-skeleton-box" style={{ width: '100%', height: 14, marginBottom: 6 }} />
            <div className="eclat-skeleton-box" style={{ width: '90%', height: 14, marginBottom: 12 }} />

            {/* Budget */}
            <div className="eclat-skeleton-box" style={{ width: 130, height: 20, marginBottom: 8 }} />

            {/* Location */}
            <div className="eclat-skeleton-box" style={{ width: 150, height: 14 }} />
          </div>

          {/* Button */}
          <div style={{ marginTop: 16 }}>
            <div className="eclat-skeleton-box" style={{ width: '100%', height: 38, borderRadius: 8 }} />
          </div>
        </article>
      ))}
    </div>
  );
};

export const SearchLoadingBanner: React.FC<{ text?: string }> = ({ text = 'Searching & updating results...' }) => {
  return (
    <div className="eclat-loading-banner" role="status">
      <span className="eclat-loading-ring" />
      <span>{text}</span>
    </div>
  );
};
