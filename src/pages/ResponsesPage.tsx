import React from 'react';
import { RequestResponse } from '../types';
import { cleanPhone } from '../api/client';

interface ResponsesPageProps {
  responses: RequestResponse[];
  onNavigate: (page: string) => void;
  onReviewProvider?: (target: { providerId: string; providerName: string; serviceTitle?: string }) => void;
}

export const ResponsesPage: React.FC<ResponsesPageProps> = ({ responses, onNavigate, onReviewProvider }) => {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Vendor Quotes Received</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
            Offers and proposals sent by providers in response to your requests.
          </p>
        </div>
        <button className="btn-outline btn-sm" onClick={() => onNavigate('My Requests')}>
          ← My Requests
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {responses.map(resp => {
          const providerPhone = resp.provider_phone || resp.phone;
          const providerWa = resp.provider_whatsapp || resp.whatsapp || providerPhone;
          const waNumber = cleanPhone(providerWa);
          const waMessage = encodeURIComponent(
            `Hello! I received your quote of ₦${resp.price || 0} for "${resp.request_title || 'my request'}" on ECLAT CONNECT. I would like to proceed!`
          );

          return (
            <div key={resp.id} className="item-card" style={{ borderLeft: '4px solid var(--brand-purple)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="card-badge" style={{ background: '#f0fdf4', color: '#166534' }}>Quote Offer</span>
                    {resp.verified && <span className="verified-pill">✓ Verified provider</span>}
                  </div>
                  <h3 style={{ margin: '4px 0', fontSize: 17 }}>
                    🏪 {resp.provider_name}
                  </h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    For Request: <strong>"{resp.request_title || 'Your Request'}"</strong>
                  </div>
                </div>

                {resp.price && (
                  <div style={{ textAlign: 'right' }}>
                    <small style={{ color: 'var(--text-muted)' }}>Quoted Price:</small>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-purple)' }}>
                      ₦{Number(resp.price).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, margin: '12px 0', fontSize: 13.5, lineHeight: 1.6 }}>
                "{resp.message}"
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                {providerPhone && (
                  <a href={`tel:${providerPhone}`} className="btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                    📞 Call {providerPhone}
                  </a>
                )}
                {providerWa && (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://wa.me/${waNumber}?text=${waMessage}`}
                    className="btn-whatsapp btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    💬 Chat on WhatsApp
                  </a>
                )}
                {onReviewProvider && (
                  <button
                    type="button"
                    className="btn-lime btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                    onClick={() => onReviewProvider({
                      providerId: resp.provider_id,
                      providerName: resp.provider_name,
                      serviceTitle: resp.request_title,
                    })}
                  >
                    ⭐ Review Vendor
                  </button>
                )}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  Received {new Date(resp.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}

        {responses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: '0 0 16px 0' }}>
              No quotes received yet. Local providers are reviewing your posted requests.
            </p>
            <button className="btn-lime btn-sm" onClick={() => onNavigate('Requests')}>
              Browse Public Requests Feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
