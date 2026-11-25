import React, { useState, useEffect } from 'react';
import { DirectContactButtons } from '../components/DirectContactButtons';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Review, AvailabilityStatus } from '../types';

interface ListingDetailsModalProps {
  item: any;
  onClose: () => void;
  onReport: (item: any) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  isFavorite?: boolean;
  onToggleFavorite?: (item: any) => void;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  item,
  onClose,
  onReport,
  onToast,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [interactionConfirmed, setInteractionConfirmed] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  const providerId = item.provider_id || (item.type ? item.id : null);
  const isOwner = user && (item.owner_id === user.id || item.user_id === user.id || item.customer_id === user.id);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(item.availability_status || 'AVAILABLE');

  const handleAvailabilityChange = async (newStatus: AvailabilityStatus) => {
    setAvailabilityStatus(newStatus);
    try {
      if (item.request_type) {
        await request(`/requests/${item.id}/availability`, 'PATCH', { availability_status: newStatus });
      } else {
        await request(`/listings/${item.id}/availability`, 'PATCH', { availability_status: newStatus });
      }
      const label = newStatus === 'SOLD' ? 'Sold' : newStatus === 'RESERVED' ? 'Reserved' : 'Available';
      onToast(`Item availability updated to: ${label}!`, 'success');
      item.availability_status = newStatus;
    } catch (err: any) {
      onToast(err.message, 'error');
    }
  };

  const loadReviews = async () => {
    if (!providerId) return;
    setLoadingReviews(true);
    try {
      const data = await request<Review[]>(`/public/providers/${providerId}/reviews`);
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [providerId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return;

    if (!interactionConfirmed) {
      onToast('Please confirm your interaction with this provider before reviewing.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      await request('/reviews', 'POST', {
        provider_id: providerId,
        rating,
        comment,
        interaction_confirmed: true,
      });
      onToast('Review submitted successfully! Thank you for rating this provider.', 'success');
      setComment('');
      loadReviews();
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const allImages: string[] = React.useMemo(() => {
    const list: string[] = [];
    if (item.images) {
      item.images.split(',').forEach((s: string) => {
        const trimmed = s.trim();
        if (trimmed && !list.includes(trimmed)) list.push(trimmed);
      });
    }
    if (item.image_url && !list.includes(item.image_url)) {
      list.unshift(item.image_url);
    }
    return list;
  }, [item.images, item.image_url]);

  const [selectedImage, setSelectedImage] = useState<string>(allImages[0] || item.image_url || '');

  useEffect(() => {
    if (allImages.length > 0) {
      setSelectedImage(allImages[0]);
    }
  }, [allImages]);

  const ratingDescriptions: Record<number, string> = {
    5: '5 Stars - Excellent',
    4: '4 Stars - Very Good',
    3: '3 Stars - Good',
    2: '2 Stars - Fair',
    1: '1 Star - Poor',
  };

  const isProjectShowcase = item.kind === 'PROJECT';
  const isPreowned = item.request_type === 'PREOWNED_SALE' || !!item.condition;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <span className="card-badge">{item.category || item.category_name || item.kind || item.type}</span>
          {isProjectShowcase && (
            <span style={{ fontSize: 11.5, background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', color: '#fff', padding: '3px 9px', borderRadius: 6, fontWeight: 700 }}>
              🛠️ Artisan Skill Showcase / Past Work
            </span>
          )}
          {isPreowned && (
            <span style={{ fontSize: 11.5, background: 'linear-gradient(135deg, #10b981, #047857)', color: '#fff', padding: '3px 9px', borderRadius: 6, fontWeight: 700 }}>
              🏷️ Pre-owned Campus Item
            </span>
          )}
          {(isPreowned || item.availability_status) && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {isOwner && <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Status:</span>}
              <AvailabilityBadge
                status={availabilityStatus}
                size="md"
                interactive={Boolean(isOwner)}
                onStatusChange={isOwner ? handleAvailabilityChange : undefined}
              />
            </div>
          )}
          {item.condition && (
            <span style={{ fontSize: 11.5, background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: 6, fontWeight: 600, border: '1px solid #cbd5e1' }}>
              Condition: {item.condition}
            </span>
          )}
          {item.verified ? (
            <span className="verified-pill">✓ Verified Provider</span>
          ) : (
            <span className="approved-pill">✓ Approved Provider</span>
          )}
          {avgRating && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              ★ {avgRating} ({reviews.length} review{reviews.length > 1 ? 's' : ''})
            </span>
          )}
        </div>

        <h2 style={{ margin: '0 0 10px 0', color: 'var(--brand-purple)', fontSize: 22 }}>
          {item.name || item.title}
        </h2>

        {/* Pre-owned Availability Status Notice */}
        {isPreowned && availabilityStatus === 'RESERVED' && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🟡</span>
            <div>
              <strong>This item is currently Reserved.</strong> Another buyer has placed a hold on it. You can still message the seller in case the deal falls through.
            </div>
          </div>
        )}
        {isPreowned && availabilityStatus === 'SOLD' && (
          <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚪</span>
            <div>
              <strong>This item has been Sold.</strong> The pre-owned item is no longer available for purchase.
            </div>
          </div>
        )}

        {/* Multi-Image Gallery */}
        {allImages.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              width: '100%',
              height: 290,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <img
                src={selectedImage || allImages[0]}
                alt={item.name || item.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Thumbnail Row if more than 1 image */}
            {allImages.length > 1 && (
              <div style={{
                display: 'flex',
                gap: 8,
                marginTop: 10,
                overflowX: 'auto',
                paddingBottom: 4
              }}>
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      overflow: 'hidden',
                      padding: 0,
                      cursor: 'pointer',
                      border: selectedImage === img ? '2.5px solid var(--primary)' : '1px solid #e2e8f0',
                      opacity: selectedImage === img ? 1 : 0.65,
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                      background: '#fff'
                    }}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(item.price || item.budget) && (
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-purple)', marginBottom: 12 }}>
            ₦{Number(item.price || item.budget).toLocaleString()}
          </div>
        )}

        <p style={{ lineHeight: 1.6, color: '#333', fontSize: 14.5 }}>
          {item.description || 'No description provided.'}
        </p>

        <div style={{ background: 'var(--warm-ivory)', padding: 14, borderRadius: 8, margin: '16px 0', fontSize: 13.5 }}>
          <div>📍 <strong>Location:</strong> {item.location_area || item.location}</div>
          {item.landmark && <div style={{ marginTop: 4 }}>🏛️ <strong>Landmark:</strong> {item.landmark}</div>}
          {item.provider_name && <div style={{ marginTop: 4 }}>🏪 <strong>Vendor:</strong> {item.provider_name}</div>}
        </div>

        {/* Contact Actions */}
        <div style={{ margin: '16px 0' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>
            {item.type === 'PROFESSIONAL'
              ? 'Connect with Artisan:'
              : item.request_type === 'PREOWNED_SALE'
              ? 'Connect with Seller:'
              : 'Connect with Provider:'}
          </h4>
          <DirectContactButtons
            phone={item.phone || item.customer_phone}
            whatsapp={item.whatsapp || item.customer_phone || item.phone}
            listingTitle={item.name || item.title}
            size="md"
            fullWidth={true}
          />
        </div>

        {/* Reviews Section */}
        {providerId && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h4 style={{ margin: 0, fontSize: 16 }}>⭐ Customer Reviews ({reviews.length})</h4>
              {loadingReviews && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Refreshing...</span>}
            </div>

            {/* Overall Rating Banner */}
            {reviews.length > 0 && avgRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fefce8', border: '1px solid #fef08a', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#854d0e', lineHeight: 1 }}>{avgRating}</div>
                <div>
                  <div style={{ color: '#eab308', fontSize: 16 }}>
                    {'★'.repeat(Math.round(Number(avgRating)))}{'☆'.repeat(5 - Math.round(Number(avgRating)))}
                  </div>
                  <div style={{ fontSize: 12, color: '#713f12', marginTop: 2 }}>
                    Based on {reviews.length} verified campus review{reviews.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--brand-purple)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                          {(r.customer_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.customer_name || 'Verified Customer'}</span>
                        <span style={{ fontSize: 10.5, background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>✓ Verified</span>
                      </div>
                      <span style={{ color: '#eab308', fontSize: 14 }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    {r.comment && <div style={{ marginTop: 8, color: '#334155', lineHeight: 1.4 }}>"{r.comment}"</div>}
                    <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                      {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                No customer reviews yet. Be the first to review this provider!
              </p>
            )}

            {/* Submit / Update Review Form */}
            {isOwner ? (
              <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 8, fontSize: 13, color: '#475569' }}>
                ℹ️ You are viewing your own business profile. Self-reviews are disabled.
              </div>
            ) : isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: 16, borderRadius: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--brand-purple)' }}>
                  ✍️ Used this Vendor or Professional? Leave a Review:
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Share your verified rating and feedback after interacting with, hiring, or purchasing from this provider.
                </div>

                {/* Interactive Star Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Your Rating:</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 22,
                          lineHeight: 1,
                          padding: 0,
                          color: (hoverRating || rating) >= star ? '#eab308' : '#cbd5e1',
                          transition: 'color 0.15s ease',
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                    ({ratingDescriptions[hoverRating || rating]})
                  </span>
                </div>

                <textarea
                  placeholder="Share details of your experience with this vendor (e.g. promptness, communication, pricing, quality)..."
                  required
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  style={{ width: '100%', minHeight: 70, padding: 10, fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', marginBottom: 10, boxSizing: 'border-box' }}
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={interactionConfirmed}
                    onChange={e => setInteractionConfirmed(e.target.checked)}
                    required
                  />
                  <span>I confirm I had a direct interaction or purchase with this campus vendor.</span>
                </label>

                <button type="submit" className="btn-lime btn-sm" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                </button>
              </form>
            ) : (
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, textAlign: 'center', border: '1px dashed var(--border)' }}>
                <span>Sign in to post a review and rate this campus vendor.</span>
              </div>
            )}
          </div>
        )}

        {/* Footer with Report & Favorite */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {onToggleFavorite && (
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => onToggleFavorite(item)}
                style={{
                  borderColor: isFavorite ? '#dc2626' : 'var(--border)',
                  color: isFavorite ? '#dc2626' : 'var(--charcoal)',
                  background: isFavorite ? '#fef2f2' : '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                }}
                title="Save listings you are interested in so you can easily find them later."
              >
                <span>{isFavorite ? '❤️' : '🤍'}</span>
                <span>{isFavorite ? 'Saved in Favourites' : 'Save to Favourites'}</span>
              </button>
            )}
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => onReport(item)}
              style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
            >
              🚩 Report
            </button>
          </div>
          <button className="btn-lime btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
