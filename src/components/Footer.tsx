import React from 'react';
import { EclatLogo } from './EclatLogo';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="eclat-site-footer">
      <div className="footer-inner-wrap">
        {/* Main Grid: 4 Scan-Friendly Columns */}
        <div className="footer-columns-grid">
          {/* Column 1: About ECLAT CONNECT */}
          <div className="footer-col about-col">
            <div className="footer-logo-wrap" style={{ marginBottom: 14 }}>
              <EclatLogo light={true} size={38} onClick={() => onNavigate('Home')} />
            </div>
            <h4 className="footer-col-title">About ECLAT CONNECT</h4>
            <p className="footer-body-text">
              ECLAT CONNECT is a mobile-first local discovery and direct-connection platform connecting customers with businesses, products, skilled professionals and services around LAUTECH and Ogbomoso.
            </p>
            <div className="footer-badge-pill">
              <span className="badge-bullet">●</span> Direct call & WhatsApp · No middleman fees
            </div>
          </div>

          {/* Column 2: Explore Directory & Portals */}
          <div className="footer-col">
            <h4 className="footer-col-title">Explore Directory</h4>
            <ul className="footer-links-list">
              <li>
                <button type="button" className="footer-link-btn" onClick={() => onNavigate('Businesses')}>
                  <span className="link-icon">🏪</span> Businesses & Shops
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={() => onNavigate('Products')}>
                  <span className="link-icon">🛍️</span> Campus Products
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={() => onNavigate('Artisans')}>
                  <span className="link-icon">✂️</span> Skilled Professionals & Artisans
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={() => onNavigate('Services')}>
                  <span className="link-icon">🔧</span> Services & Handwork
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn" onClick={() => onNavigate('Pre-owned')}>
                  <span className="link-icon">♻️</span> Pre-owned Items
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn highlight" onClick={() => onNavigate('Requests')}>
                  <span className="link-icon">📢</span> Customer Requests
                </button>
              </li>
              <li>
                <button type="button" className="footer-link-btn highlight" onClick={() => onNavigate('Post What I Need')}>
                  <span className="link-icon">➕</span> Post What I Need
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Campus & Town Coverage */}
          <div className="footer-col">
            <h4 className="footer-col-title">Campus & Town Hubs</h4>
            <ul className="footer-hubs-list">
              <li><span className="hub-marker">📍</span> Under G (Main Campus Gate)</li>
              <li><span className="hub-marker">📍</span> Adenike & Bovas Axis</li>
              <li><span className="hub-marker">📍</span> Aroje & Teaching Hospital</li>
              <li><span className="hub-marker">📍</span> General Roundabout & State Hospital</li>
              <li><span className="hub-marker">📍</span> Stadium Road & Township Center</li>
              <li><span className="hub-marker">📍</span> Randa & Takie Palace Axis</li>
            </ul>
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="footer-action-link"
                onClick={() => onNavigate('Provider Application')}
              >
                Register Your Business or Trade →
              </button>
            </div>
          </div>

          {/* Column 4: Safety & Privacy */}
          <div className="footer-col safety-col">
            <h4 className="footer-col-title safety-title">
              <span style={{ marginRight: 6 }}>🛡️</span> Safety & Privacy
            </h4>
            <div className="safety-card-box">
              <p className="footer-body-text safety-text">
                Always take reasonable precautions when meeting buyers, sellers or service providers. Where possible, meet in safe, public locations and inspect items before completing a transaction.
              </p>
              <p className="footer-body-text safety-text" style={{ marginTop: 10 }}>
                Protect your personal information and report suspicious listings or activities to the ECLAT CONNECT administration team.
              </p>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 10 }}>
                <a
                  href="/privacy-policy"
                  className="footer-link-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('Privacy Policy');
                  }}
                  style={{ textAlign: 'left', padding: '2px 0', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>🔒</span> Privacy Policy (<code style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: 4, color: 'var(--brand-lime)' }}>/privacy-policy</code>)
                </a>
                <a
                  href="/terms-of-service"
                  className="footer-link-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('Terms of Service');
                  }}
                  style={{ textAlign: 'left', padding: '2px 0', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>📜</span> Terms of Service (<code style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: 4, color: 'var(--brand-lime)' }}>/terms-of-service</code>)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: High Contrast Metadata */}
        <div className="footer-bottom-bar">
          <div className="bottom-meta-text">
            © {new Date().getFullYear()} <strong style={{ color: 'var(--brand-lime)' }}>ECLAT CONNECT</strong> · Built for the LAUTECH & Ogbomoso Community.
          </div>
          <div className="bottom-meta-links" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <a
              href="/privacy-policy"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('Privacy Policy');
              }}
              style={{ color: 'var(--text-light-ivory)', fontSize: 12, textDecoration: 'underline' }}
            >
              /privacy-policy
            </a>
            <span>·</span>
            <a
              href="/terms-of-service"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('Terms of Service');
              }}
              style={{ color: 'var(--text-light-ivory)', fontSize: 12, textDecoration: 'underline' }}
            >
              /terms-of-service
            </a>
            <span>·</span>
            <span>Direct WhatsApp & Call</span>
            <span>·</span>
            <span>Verified Providers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
