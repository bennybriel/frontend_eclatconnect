import React, { useState } from 'react';
import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEscapeToClose } from '../components/useEscapeToClose';

export interface ReviewTarget {
  providerId: string;
  providerName: string;
  serviceTitle?: string;
}

interface ReviewModalProps {
  target: ReviewTarget;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  target,
  onClose,
  onSuccess,
  onToast,
}) => {
  const { user } = useAuth();
  useEscapeToClose(onClose);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [interactionConfirmed, setInteractionConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ratingDescriptions: Record<number, string> = {
    5: '5 Stars - Excellent (Highly Recommended)',
    4: '4 Stars - Very Good (Satisfied)',
    3: '3 Stars - Good (Average service)',
    2: '2 Stars - Fair (Needs improvement)',
    1: '1 Star - Poor (Dissatisfied)',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!interactionConfirmed) {
      onToast('Please confirm your interaction with this provider before reviewing.', 'error');
      return;
    }

    if (!comment.trim()) {
      onToast('Please provide brief comments or feedback on your experience.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await request('/reviews', 'POST', {
        provider_id: target.providerId,
        rating,
        comment: comment.trim(),
        interaction_confirmed: interactionConfirmed,
      });

      onToast(`⭐ Review posted successfully! Thank you for rating ${target.providerName}.`, 'success');
      onSuccess();
    } catch (err: any) {
      onToast(err.message || 'Could not submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 540 }}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>⭐</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: 'var(--brand-purple)' }}>
              Rate & Review Provider
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Share honest feedback after using this provider
            </div>
          </div>
        </div>

        {/* Provider & Service Context Box */}
        <div
          style={{
            background: 'var(--warm-ivory)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '14px 16px',
            margin: '16px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🏪</span>
            <strong style={{ fontSize: 15, color: 'var(--charcoal)' }}>
              {target.providerName}
            </strong>
          </div>
          {target.serviceTitle && (
            <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
              <strong>Completed Service:</strong> "{target.serviceTitle}"
            </div>
          )}
          <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>You received a quote from this provider on ECLAT CONNECT</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating Picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, marginBottom: 8, color: 'var(--charcoal)' }}>
              How was your experience? *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                    fontSize: 30,
                    lineHeight: 1,
                    padding: '2px 4px',
                    color: (hoverRating || rating) >= star ? '#eab308' : '#cbd5e1',
                    transition: 'transform 0.1s ease, color 0.15s ease',
                  }}
                  title={`${star} Star`}
                >
                  ★
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#854d0e', marginTop: 6 }}>
              {ratingDescriptions[hoverRating || rating]}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, marginBottom: 6, color: 'var(--charcoal)' }}>
              Detailed Feedback & Review *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Tell other community members about the service quality, punctuality, pricing, communication, or overall satisfaction..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 13.5,
                borderRadius: 8,
                border: '1px solid var(--border)',
                lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Interaction Confirmation */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: 12.5,
              cursor: 'pointer',
              marginBottom: 20,
              background: '#f8fafc',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            <input
              type="checkbox"
              checked={interactionConfirmed}
              onChange={e => setInteractionConfirmed(e.target.checked)}
              required
              style={{ marginTop: 2 }}
            />
            <span style={{ color: '#334155', lineHeight: 1.4 }}>
              I confirm that I have directly interacted with, hired, or purchased from <strong>{target.providerName}</strong>.
            </span>
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <button type="button" className="btn-outline btn-sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-lime btn-sm"
              disabled={submitting}
              style={{ fontWeight: 700 }}
            >
              {submitting ? 'Submitting Review...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
