import React from 'react';
import { ArrowRight, Compass, Home, Megaphone } from 'lucide-react';
import { handleLinkClick, pathFor } from '../routing';
import './NotFoundPage.css';

interface NotFoundPageProps {
  onNavigate: (page: string) => void;
}

/** Shown for any address the app does not know, instead of quietly showing the home page */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  const sections = ['Businesses', 'Products', 'Artisans', 'Services', 'Pre-owned', 'Requests'];
  return (
    <section className="nf" aria-labelledby="nf-title">
      <span className="nf-icon" aria-hidden="true"><Compass size={34} strokeWidth={2} /></span>
      <p className="nf-code">404</p>
      <h1 id="nf-title" className="nf-title">We couldn't find that page</h1>
      <p className="nf-note">
        The link may be old or mistyped. Try one of these, or go back to the home page.
      </p>
      <div className="nf-actions">
        <a className="nf-btn nf-btn-lime" href={pathFor('Home')} onClick={e => handleLinkClick(e, () => onNavigate('Home'))}>
          <Home size={17} aria-hidden="true" /> Go to the home page
        </a>
        <a className="nf-btn nf-btn-outline" href={pathFor('Post What I Need')} onClick={e => handleLinkClick(e, () => onNavigate('Post What I Need'))}>
          <Megaphone size={17} aria-hidden="true" /> Post what I need
        </a>
      </div>
      <nav className="nf-links" aria-label="Marketplace sections">
        {sections.map(page => (
          <a key={page} href={pathFor(page)} onClick={e => handleLinkClick(e, () => onNavigate(page))}>
            {page} <ArrowRight size={14} aria-hidden="true" />
          </a>
        ))}
      </nav>
    </section>
  );
};
