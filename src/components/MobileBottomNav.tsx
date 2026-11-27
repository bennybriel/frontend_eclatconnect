import React from 'react';
import { House, Megaphone, Plus, Search, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const BROWSE_PAGES = ['Products', 'Businesses', 'Artisans', 'Professionals', 'Services', 'Pre-owned'];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentPage, onNavigate }) => {
  const { isAuthenticated } = useAuth();

  const items: { label: string; icon: LucideIcon; target: string; active: boolean }[] = [
    { label: 'Home', icon: House, target: 'Home', active: currentPage === 'Home' },
    { label: 'Browse', icon: Search, target: 'Products', active: BROWSE_PAGES.includes(currentPage) },
    { label: 'Requests', icon: Megaphone, target: 'Requests', active: currentPage === 'Requests' },
    {
      label: 'Account',
      icon: UserRound,
      target: isAuthenticated ? 'Account' : 'Auth',
      active: currentPage === 'Account' || currentPage === 'Auth',
    },
  ];

  const renderItem = (item: (typeof items)[number]) => {
    const Icon = item.icon;
    return (
      <button
        key={item.label}
        type="button"
        className={`bottom-nav-item${item.active ? ' active' : ''}`}
        aria-current={item.active ? 'page' : undefined}
        onClick={() => onNavigate(item.target)}
      >
        <Icon className="bottom-nav-svg" size={22} strokeWidth={item.active ? 2.4 : 2} aria-hidden="true" />
        <span className="bottom-nav-label">{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Main">
      {items.slice(0, 2).map(renderItem)}

      {/* Main action: post a request */}
      <button
        type="button"
        className="bottom-nav-item center-post-btn"
        onClick={() => onNavigate('Post What I Need')}
        aria-label="Post what I need"
      >
        <span className="center-post-circle">
          <Plus size={24} strokeWidth={2.6} aria-hidden="true" />
        </span>
        <span className="bottom-nav-label">Post</span>
      </button>

      {items.slice(2).map(renderItem)}
    </nav>
  );
};
