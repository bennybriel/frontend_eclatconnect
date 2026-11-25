import React, { useState, useEffect } from 'react';
import { Review } from '../types';
import { request } from '../api/client';

interface MyReviewsPageProps {
  onNavigate: (page: string) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const MyReviewsPage: React.FC<MyReviewsPageProps> = ({
  onNavigate,
  onToast,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await request<Review[]>('/me/reviews');
      setReviews(data);
    } catch (err: any) {
      onToast(err.message || 'Could not load your reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    setDeletingId(id);
    try {
      await request(`/reviews/${id}`, 'DELETE');
      onToast('Review deleted successfully.', 'info');
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      onToast(err.message || 'Could not delete review', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 12px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: 'var(--brand-purple)' }}>⭐ My Reviews & Ratings</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
            Reviews and feedback you have shared with campus vendors and artisans.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline btn-sm" onClick={() => onNavigate('Businesses')}>
            Explore Businesses
          </button>
          <button className="btn-secondary btn-sm" onClick={() => onNavigate('Account')}>
            ← Account
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          Loading your reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>✍️</div>
          <h3 style={{ margin: '0 0 8px 0' }}>No Reviews Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 460, margin: '0 auto 20px auto' }}>
            When you purchase from a local business or hire an artisan, leave a verified review to help fellow community members find top-rated services!
          </p>
          <button className="btn-lime" onClick={() => onNavigate('Businesses')}>
            Browse Campus Providers
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map(r => (
            <div
              key={r.id}
              className="item-card"
              style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="card-badge" style={{ background: 'rgba(76, 1, 106, 0.08)', color: 'var(--brand-purple)', fontWeight: 600 }}>
                      {r.provider_type || 'PROVIDER'}
                    </span>
                    {r.category_name && (
                      <span className="card-badge">{r.category_name}</span>
                    )}
                    <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                      ✓ Verified Review
                    </span>
                  </div>

                  <h3 style={{ margin: '2px 0 6px 0', fontSize: 17, color: 'var(--charcoal)' }}>
                    {r.provider_name || 'Campus Provider'}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: '#eab308', fontSize: 16 }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#854d0e' }}>
                      {r.rating}.0 / 5.0
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      • {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {r.comment && (
                    <p style={{ margin: '6px 0 0 0', fontSize: 13.5, color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '10px 14px', borderRadius: 6, borderLeft: '3px solid var(--brand-purple)' }}>
                      "{r.comment}"
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <button
                    className="btn-outline btn-sm"
                    style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '4px 10px', fontSize: 12 }}
                    disabled={deletingId === r.id}
                    onClick={() => handleDelete(r.id)}
                  >
                    {deletingId === r.id ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
