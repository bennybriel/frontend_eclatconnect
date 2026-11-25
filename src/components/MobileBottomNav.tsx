import React from 'react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentPage, onNavigate }) => {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`bottom-nav-item ${currentPage === 'Home' ? 'active' : ''}`}
        onClick={() => onNavigate('Home')}
      >
        <span className="bottom-nav-icon">🏠</span>
        <span className="bottom-nav-label">Home</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${currentPage === 'Products' || currentPage === 'Businesses' ? 'active' : ''}`}
        onClick={() => onNavigate('Products')}
      >
        <span className="bottom-nav-icon">🔍</span>
        <span className="bottom-nav-label">Search</span>
      </button>

      {/* Prominent Center Post Button */}
      <button
        type="button"
        className="bottom-nav-item center-post-btn"
        onClick={() => onNavigate('Post What I Need')}
        aria-label="Post What I Need"
      >
        <div className="center-post-circle">
          <span>+</span>
        </div>
        <span className="bottom-nav-label" style={{ color: 'var(--brand-purple)', fontWeight: 700 }}>
          Post
        </span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${currentPage === 'Requests' ? 'active' : ''}`}
        onClick={() => onNavigate('Requests')}
      >
        <span className="bottom-nav-icon">💬</span>
        <span className="bottom-nav-label">Requests</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${currentPage === 'Account' || currentPage === 'Auth' ? 'active' : ''}`}
        onClick={() => onNavigate(isAuthenticated ? 'Account' : 'Auth')}
      >
        <span className="bottom-nav-icon">👤</span>
        <span className="bottom-nav-label">Account</span>
      </button>
    </nav>
  );
};
