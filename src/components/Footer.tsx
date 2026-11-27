import React from 'react';
import { handleLinkClick, pathFor } from '../routing';
import { Mail, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { EclatLogo } from './EclatLogo';
import './Footer.css';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const EXPLORE_LINKS = [
  { label: 'Businesses', page: 'Businesses' },
  { label: 'Products', page: 'Products' },
  { label: 'Artisans', page: 'Artisans' },
  { label: 'Services', page: 'Services' },
  { label: 'Pre-owned items', page: 'Pre-owned' },
  { label: 'Customer requests', page: 'Requests' },
];

const ACTION_LINKS = [
  { label: 'Post what I need', page: 'Post What I Need' },
  { label: 'Sell a pre-owned item', page: 'Sell Pre-owned Item' },
  { label: 'List your business or trade', page: 'Provider Application' },
];

const AREAS = ['Under G', 'Adenike', 'Aroje', 'LAUTECH Campus', 'Takie Square', 'Sabo Market'];

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  // Real links: a normal click stays in the app; Ctrl/Cmd-click opens a new tab
  const goTo = (page: string) => (e: React.MouseEvent) => handleLinkClick(e, () => onNavigate(page));

  return (
    <footer className="fx">
      <div className="fx-inner">
        <div className="fx-grid">
          <div className="fx-brand">
            <EclatLogo light size={40} onClick={() => onNavigate('Home')} />
            <p className="fx-about">
              The local marketplace for LAUTECH and Ogbomoso. Find businesses, artisans, services and pre-owned items,
              and contact them directly.
            </p>
            <p className="fx-pill">
              <MessageCircle size={16} aria-hidden="true" /> Direct call and WhatsApp · No fees
            </p>
          </div>

          <nav className="fx-col" aria-label="Explore">
            <h2 className="fx-title">Explore</h2>
            <ul>
              {EXPLORE_LINKS.map(link => (
                <li key={link.page}>
                  <a href={pathFor(link.page)} onClick={goTo(link.page)}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="fx-col" aria-label="Get started">
            <h2 className="fx-title">Get started</h2>
            <ul>
              {ACTION_LINKS.map(link => (
                <li key={link.page}>
                  <a href={pathFor(link.page)} onClick={goTo(link.page)}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="fx-col">
            <h2 className="fx-title">Areas we cover</h2>
            <ul className="fx-areas">
              {AREAS.map(area => (
                <li key={area}>
                  <MapPin size={14} aria-hidden="true" /> {area}
                </li>
              ))}
            </ul>
          </div>

          <div className="fx-col fx-safety">
            <h2 className="fx-title">
              <ShieldCheck size={18} aria-hidden="true" /> Stay safe
            </h2>
            <p>
              Meet in public places, inspect items before paying, and never send an advance deposit to someone you haven't met.
              Report anything suspicious to the ECLAT CONNECT team.
            </p>
            <p className="fx-contact">
              <Mail size={16} aria-hidden="true" /> support@eclatconnect.com
            </p>
          </div>
        </div>

        <div className="fx-bottom">
          <p>© {new Date().getFullYear()} ECLAT CONNECT · An Eclat Group company</p>
          <nav className="fx-legal" aria-label="Legal">
            <a href="/privacy-policy" onClick={goTo('Privacy Policy')}>Privacy Policy</a>
            <a href="/terms-of-service" onClick={goTo('Terms of Service')}>Terms of Service</a>
          </nav>
        </div>
      </div>
    </footer>
  );
};
