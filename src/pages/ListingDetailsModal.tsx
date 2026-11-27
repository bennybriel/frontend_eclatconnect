import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  Info,
  Landmark,
  Link2,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Star,
  Store,
  X,
} from 'lucide-react';
import { DirectContactButtons } from '../components/DirectContactButtons';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { TrustBadge } from '../components/TrustBadge';
import { useEscapeToClose } from '../components/useEscapeToClose';
import { isRequestItem, isPreownedSale } from '../utils/trust';
import { copyText, listingUrl, shareListing, whatsappShareUrl } from '../utils/share';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Review, AvailabilityStatus } from '../types';
import './ListingDetailsModal.css';

interface ListingDetailsModalProps {
  item: any;
  onClose: () => void;
  onReport: (item: any) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  isFavorite?: boolean;
  onToggleFavorite?: (item: any) => void;
  /** Other listings from the same section, shown as "More like this" */
  related?: any[];
  onSelectRelated?: (item: any) => void;
}

const ratingDescriptions: Record<number, string> = {
  5: 'Excellent',
  4: 'Very good',
  3: 'Good',
  2: 'Fair',
  1: 'Poor',
};

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  item,
  onClose,
  onReport,
  onToast,
  isFavorite = false,
  onToggleFavorite,
  related = [],
  onSelectRelated,
}) => {
  const { user, isAuthenticated } = useAuth();
  useEscapeToClose(onClose);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [interactionConfirmed, setInteractionConfirmed] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const providerId = item.provider_id || (item.type ? item.id : null);
  const isOwner = user && (item.owner_id === user.id || item.user_id === user.id || item.customer_id === user.id);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(item.availability_status || 'AVAILABLE');
  const name: string = item.name || item.title || 'Listing';

  // Move focus into the dialog when it opens, and back to the page when it closes
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  // Opening another listing from "More like this" starts at the top
  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0 });
    setAvailabilityStatus(item.availability_status || 'AVAILABLE');
  }, [item]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        interaction_confirmed: interactionConfirmed,
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

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null;
  // The listing's own rating, for when the review list is empty or still loading
  const listedRating = Number(item.avg_rating || item.provider_rating || 0);
  const listedCount = item.review_count ?? item.provider_review_count;
  const shownRating = avgRating || (listedRating > 0 ? listedRating.toFixed(1) : null);
  const shownCount = reviews.length > 0 ? reviews.length : Number(listedCount || 0);

  // ---- Gallery ----
  const allImages: string[] = useMemo(() => {
    const list: string[] = [];
    if (item.images) {
      String(item.images).split(',').forEach((s: string) => {
        const trimmed = s.trim();
        if (trimmed && !list.includes(trimmed)) list.push(trimmed);
      });
    }
    if (item.image_url && !list.includes(item.image_url)) list.unshift(item.image_url);
    return list;
  }, [item.images, item.image_url]);

  const [imageIndex, setImageIndex] = useState(0);
  useEffect(() => setImageIndex(0), [allImages]);
  const step = (delta: number) => setImageIndex(i => (i + delta + allImages.length) % allImages.length);

  // Swipe between photos on a phone
  const touchStart = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null || allImages.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };

  // ---- Sharing ----
  const handleShare = async () => {
    const result = await shareListing(item);
    if (result === 'copied') onToast('Link copied. Paste it anywhere to share this listing.', 'success');
    if (result === 'failed') onToast('Could not share from this browser. Try the WhatsApp button.', 'error');
  };
  const handleCopy = async () => {
    const ok = await copyText(listingUrl(item));
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 2000);
    else onToast('Could not copy the link from this browser.', 'error');
  };

  const isProjectShowcase = item.kind === 'PROJECT';
  const isPreowned = item.request_type === 'PREOWNED_SALE' || !!item.condition;
  const isWantedRequest = isRequestItem(item) && !isPreownedSale(item);
  const price = Number(item.price || item.budget);
  const area = item.location_area || item.location;
  const hasContact = !isWantedRequest && Boolean(item.phone || item.whatsapp || item.customer_phone);
  const category = item.category || item.category_name || item.custom_category || item.kind || item.type;
  const moreLikeThis = related.filter(r => String(r.id) !== String(item.id)).slice(0, 6);
  const contactHeading =
    item.type === 'PROFESSIONAL' ? 'Talk to the artisan' : isPreownedSale(item) ? 'Talk to the seller' : 'Talk to the provider';

  return (
    <div className="ld-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="ld"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ld-title"
        tabIndex={-1}
      >
        <button type="button" className="ld-close" onClick={onClose} aria-label="Close">
          <X size={20} aria-hidden="true" />
        </button>

        <div className="ld-layout">
          {/* ================= Gallery ================= */}
          <div className="ld-gallery">
            <div className="ld-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              {allImages.length > 0 ? (
                <img key={allImages[imageIndex]} src={allImages[imageIndex]} alt={name} className="ld-photo" />
              ) : (
                <span className="ld-initial" aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>
              )}
              {allImages.length > 1 && (
                <>
                  <button type="button" className="ld-nav ld-nav-prev" onClick={() => step(-1)} aria-label="Previous photo">
                    <ChevronLeft size={20} aria-hidden="true" />
                  </button>
                  <button type="button" className="ld-nav ld-nav-next" onClick={() => step(1)} aria-label="Next photo">
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                  <span className="ld-counter">{imageIndex + 1} / {allImages.length}</span>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="ld-thumbs" role="group" aria-label="Photos">
                {allImages.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    className={`ld-thumb${idx === imageIndex ? ' is-on' : ''}`}
                    onClick={() => setImageIndex(idx)}
                    aria-label={`Photo ${idx + 1}`}
                    aria-pressed={idx === imageIndex}
                  >
                    <img src={img} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= Details ================= */}
          <div className="ld-info">
            <div className="ld-tags">
              {category && <span className="ld-cat">{category}</span>}
              <TrustBadge item={item} />
              {isProjectShowcase && <span className="ld-tag">Past work</span>}
              {isPreowned && <span className="ld-tag is-green">{item.condition || 'Pre-owned'}</span>}
              {(isPreowned || (item.kind === 'PRODUCT' && !isRequestItem(item) && item.availability_status)) && (
                <AvailabilityBadge
                  status={availabilityStatus}
                  size="md"
                  interactive={Boolean(isOwner)}
                  onStatusChange={isOwner ? handleAvailabilityChange : undefined}
                />
              )}
            </div>

            <h2 id="ld-title" className="ld-title">{name}</h2>

            <div className="ld-facts">
              {shownRating && (
                <span className="ld-rating">
                  <Star size={15} aria-hidden="true" /> {shownRating}
                  {shownCount > 0 && <span>({shownCount} review{shownCount > 1 ? 's' : ''})</span>}
                </span>
              )}
              {area && (
                <span className="ld-fact">
                  <MapPin size={15} aria-hidden="true" /> {area}
                </span>
              )}
              {item.landmark && (
                <span className="ld-fact">
                  <Landmark size={15} aria-hidden="true" /> {item.landmark}
                </span>
              )}
            </div>

            {price > 0 && (
              <p className="ld-price">
                {isWantedRequest && <span>Budget</span>}₦{price.toLocaleString()}
              </p>
            )}

            {isPreowned && availabilityStatus === 'RESERVED' && (
              <p className="ld-notice is-amber">
                <Info size={17} aria-hidden="true" />
                <span><strong>Reserved.</strong> Another buyer has a hold on it. You can still message the seller in case the deal falls through.</span>
              </p>
            )}
            {isPreowned && availabilityStatus === 'SOLD' && (
              <p className="ld-notice">
                <Info size={17} aria-hidden="true" />
                <span><strong>Sold.</strong> This item is no longer available.</span>
              </p>
            )}

            <p className="ld-desc">{item.description || 'No description provided.'}</p>

            {item.provider_name && item.provider_name !== name && (
              <p className="ld-by">
                <Store size={16} aria-hidden="true" /> Offered by <strong>{item.provider_name}</strong>
              </p>
            )}

            {/* Contact: the main action */}
            {hasContact && (
              <div className="ld-contact">
                <p className="ld-contact-title">{contactHeading}</p>
                <DirectContactButtons
                  phone={item.phone || item.customer_phone}
                  whatsapp={item.whatsapp || item.customer_phone || item.phone}
                  listingTitle={name}
                  size="md"
                  fullWidth={true}
                />
                <p className="ld-contact-note">
                  <ShieldCheck size={15} aria-hidden="true" />
                  Meet in a public place and check before you pay. ECLAT CONNECT never asks for a deposit.
                </p>
              </div>
            )}

            {isWantedRequest && (
              <p className="ld-notice is-royal">
                <MessageCircle size={17} aria-hidden="true" />
                <span>This is a request from a community member. Providers can reply with a quote from the <strong>Requests</strong> page.</span>
              </p>
            )}

            {/* Share, save and report */}
            <div className="ld-actions">
              <a className="ld-action ld-action-wa" href={whatsappShareUrl(item)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={17} aria-hidden="true" /> Share on WhatsApp
              </a>
              <button type="button" className="ld-action" onClick={handleShare}>
                <Share2 size={17} aria-hidden="true" /> Share
              </button>
              <button type="button" className="ld-action" onClick={handleCopy}>
                <Link2 size={17} aria-hidden="true" /> {copied ? 'Link copied' : 'Copy link'}
              </button>
              {onToggleFavorite && (
                <button
                  type="button"
                  className={`ld-action${isFavorite ? ' is-saved' : ''}`}
                  onClick={() => onToggleFavorite(item)}
                  aria-pressed={isFavorite}
                >
                  <Heart size={17} aria-hidden="true" /> {isFavorite ? 'Saved' : 'Save'}
                </button>
              )}
              <button type="button" className="ld-action ld-action-report" onClick={() => onReport(item)}>
                <Flag size={16} aria-hidden="true" /> Report
              </button>
            </div>
          </div>
        </div>

        {/* ================= Reviews ================= */}
        {providerId && (
          <section className="ld-section" aria-labelledby="ld-reviews-title">
            <div className="ld-section-head">
              <h3 id="ld-reviews-title">Reviews {reviews.length > 0 && <span>({reviews.length})</span>}</h3>
              {loadingReviews && <span className="ld-muted">Refreshing…</span>}
            </div>

            {reviews.length > 0 && avgRating && (
              <div className="ld-score">
                <span className="ld-score-num">{avgRating}</span>
                <div>
                  <span className="ld-stars" aria-label={`${avgRating} out of 5`}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={16} className={s <= Math.round(Number(avgRating)) ? 'is-on' : ''} aria-hidden="true" />
                    ))}
                  </span>
                  <span className="ld-muted">Based on {reviews.length} review{reviews.length > 1 ? 's' : ''} from ECLAT CONNECT users</span>
                </div>
              </div>
            )}

            {reviews.length > 0 ? (
              <ul className="ld-reviews">
                {reviews.map(r => (
                  <li key={r.id} className="ld-review">
                    <div className="ld-review-head">
                      <span className="ld-avatar" aria-hidden="true">{(r.customer_name || 'C').charAt(0).toUpperCase()}</span>
                      <span className="ld-review-name">{r.customer_name || 'Community member'}</span>
                      <span className="ld-stars" aria-label={`${r.rating} out of 5`}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={13} className={s <= r.rating ? 'is-on' : ''} aria-hidden="true" />
                        ))}
                      </span>
                    </div>
                    {r.comment && <p className="ld-review-text">“{r.comment}”</p>}
                    <span className="ld-muted">
                      {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ld-muted">No reviews yet. Used this provider? Be the first to review them.</p>
            )}

            {isOwner ? (
              <p className="ld-notice">
                <Info size={17} aria-hidden="true" />
                <span>You are viewing your own profile. Reviewing yourself is turned off.</span>
              </p>
            ) : isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="ld-form">
                <p className="ld-form-title">Used this provider? Leave a review</p>
                <div className="ld-picker">
                  <span>Your rating:</span>
                  <span className="ld-picker-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={(hoverRating || rating) >= star ? 'is-on' : ''}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        aria-pressed={rating === star}
                      >
                        <Star size={22} aria-hidden="true" />
                      </button>
                    ))}
                  </span>
                  <span className="ld-muted">{ratingDescriptions[hoverRating || rating]}</span>
                </div>
                <textarea
                  placeholder="How was it? Promptness, communication, price, quality…"
                  required
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <label className="ld-check">
                  <input type="checkbox" checked={interactionConfirmed} onChange={e => setInteractionConfirmed(e.target.checked)} required />
                  <span>I bought from or hired this provider.</span>
                </label>
                <button type="submit" className="ld-submit" disabled={submittingReview}>
                  {submittingReview ? 'Posting…' : 'Post review'}
                </button>
              </form>
            ) : (
              <p className="ld-notice">
                <BadgeCheck size={17} aria-hidden="true" />
                <span>Sign in to rate this provider and help the next student.</span>
              </p>
            )}
          </section>
        )}

        {/* ================= More like this ================= */}
        {moreLikeThis.length > 0 && onSelectRelated && (
          <section className="ld-section" aria-labelledby="ld-more-title">
            <div className="ld-section-head">
              <h3 id="ld-more-title">More like this</h3>
            </div>
            <ul className="ld-more">
              {moreLikeThis.map(r => {
                const rName = r.name || r.title || 'Listing';
                const rImg = r.image_url || (r.images ? String(r.images).split(',')[0].trim() : null);
                const rPrice = Number(r.price || r.budget);
                return (
                  <li key={r.id}>
                    <button type="button" className="ld-more-card" onClick={() => onSelectRelated(r)}>
                      <span className="ld-more-media">
                        {rImg ? <img src={rImg} alt="" loading="lazy" /> : <span>{rName.trim().charAt(0).toUpperCase()}</span>}
                      </span>
                      <span className="ld-more-name">{rName}</span>
                      <span className="ld-more-meta">
                        {rPrice > 0 ? `₦${rPrice.toLocaleString()}` : r.location_area || r.location || ''}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};
