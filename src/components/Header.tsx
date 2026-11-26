import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Hammer,
  House,
  LogIn,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  Recycle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
  UserPlus,
  Wrench,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EclatLogo } from './EclatLogo';
import './Header.css';

export { EclatLogo };

export interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  /** Runs a keyword search from the header search bar */
  onSearch?: (query: string) => void;
  unreadCount?: number;
}

/** Marketplace sections, centred in the navigation bar */
const SECTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'Home', label: 'Home', icon: House },
  { id: 'Businesses', label: 'Businesses', icon: Store },
  { id: 'Products', label: 'Products', icon: ShoppingBag },
  { id: 'Artisans', label: 'Artisans', icon: Hammer },
  { id: 'Services', label: 'Services', icon: Wrench },
  { id: 'Pre-owned', label: 'Pre-owned', icon: Recycle },
  { id: 'Requests', label: 'Requests', icon: Megaphone },
];

const isSectionActive = (sectionId: string, currentPage: string) =>
  currentPage === sectionId || (sectionId === 'Artisans' && currentPage === 'Professionals');

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, onSearch, unreadCount = 0 }) => {
  const { user, isAuthenticated, isAdmin, isVendor, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');

  const accountRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : '';
  const initial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const portalLabel = user?.role === 'ARTISAN' ? 'Artisan portal' : 'Vendor portal';
  const unreadLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  const go = (page: string) => {
    onNavigate(page);
    setMenuOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
  };

  const handleSignOut = () => {
    logout();
    go('Home');
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || !onSearch) {
      searchInputRef.current?.focus();
      return;
    }
    onSearch(q);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  // Soft shadow once the page scrolls under the bar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Search bar: focus the field when it opens; Escape closes it and returns focus to the icon
  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        searchButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  // Account menu: close on outside click or Escape, returning focus to its button
  useEffect(() => {
    if (!accountOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAccountOpen(false);
        accountButtonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  // Mobile drawer: lock page scroll, focus the close button, close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      menuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  // Close everything when the page changes
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
    setSearchOpen(false);
  }, [currentPage]);

  return (
    <>
      <header className={`nv${scrolled ? ' is-scrolled' : ''}`}>
        <div className="nv-container nv-row">
          {/* Left: brand */}
          <div className="nv-left">
            <a
              href="/"
              className="nv-brand"
              aria-label="ECLAT CONNECT home"
              onClick={e => {
                e.preventDefault();
                go('Home');
              }}
            >
              <EclatLogo size={38} />
            </a>
          </div>

          {/* Centre: marketplace sections */}
          <nav className="nv-center" aria-label="Marketplace sections">
            <ul className="nv-links">
              {SECTIONS.map(section => {
                const active = isSectionActive(section.id, currentPage);
                return (
                  <li key={section.id}>
                    <a
                      href="/"
                      className={`nv-link${active ? ' is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={e => {
                        e.preventDefault();
                        go(section.id);
                      }}
                    >
                      {section.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right: search and notifications next to the links, post and account at the far right */}
          <div className="nv-right">
            <div className="nv-icons">
              <button
                ref={searchButtonRef}
                type="button"
                className={`nv-icon-btn${searchOpen ? ' is-active' : ''}`}
                onClick={() => setSearchOpen(open => !open)}
                aria-label={searchOpen ? 'Close search' : 'Search'}
                aria-expanded={searchOpen}
                aria-controls="nv-searchbar"
              >
                {searchOpen ? <X size={20} aria-hidden="true" /> : <Search size={20} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className={`nv-icon-btn${currentPage === 'Notifications' ? ' is-active' : ''}`}
                onClick={() => go('Notifications')}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              >
                <Bell size={20} aria-hidden="true" />
                {unreadCount > 0 && <span className="nv-badge" aria-hidden="true">{unreadLabel}</span>}
              </button>
            </div>

            <div className="nv-actions">
            <button
              type="button"
              className="nv-btn nv-btn-cta nv-hide-phone"
              onClick={() => go('Post What I Need')}
              aria-label="Post what I need"
            >
              <Plus size={18} strokeWidth={2.6} aria-hidden="true" />
              <span className="nv-cta-long">Post what I need</span>
              <span className="nv-cta-short" aria-hidden="true">Post</span>
            </button>

            {isAuthenticated && user ? (
              <div className="nv-account nv-hide-phone" ref={accountRef}>
                <button
                  ref={accountButtonRef}
                  type="button"
                  className="nv-account-btn"
                  onClick={() => setAccountOpen(open => !open)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  aria-controls="nv-account-menu"
                >
                  <span className="nv-avatar" aria-hidden="true">{initial || <UserRound size={16} />}</span>
                  <span className="nv-account-name">{firstName || 'Account'}</span>
                  <ChevronDown className="nv-chevron" size={16} aria-hidden="true" />
                </button>

                {accountOpen && (
                  <div id="nv-account-menu" className="nv-menu" role="menu" aria-label="Account">
                    <div className="nv-menu-head">
                      <span className="nv-avatar nv-avatar-lg" aria-hidden="true">{initial || <UserRound size={18} />}</span>
                      <span className="nv-menu-identity">
                        <span className="nv-menu-name">{user.name}</span>
                        <span className="nv-menu-email">{user.email}</span>
                      </span>
                    </div>
                    <button type="button" role="menuitem" className="nv-menu-item" onClick={() => go('Account')}>
                      <UserRound size={18} aria-hidden="true" /> My account
                    </button>
                    {isVendor && (
                      <button type="button" role="menuitem" className="nv-menu-item" onClick={() => go('Vendor Workspace')}>
                        <Store size={18} aria-hidden="true" /> {portalLabel}
                      </button>
                    )}
                    {isAdmin && (
                      <button type="button" role="menuitem" className="nv-menu-item" onClick={() => go('Admin')}>
                        <ShieldCheck size={18} aria-hidden="true" /> Admin console
                      </button>
                    )}
                    <div className="nv-menu-divider" role="separator" />
                    <button type="button" role="menuitem" className="nv-menu-item nv-menu-danger" onClick={handleSignOut}>
                      <LogOut size={18} aria-hidden="true" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="nv-btn nv-btn-ghost nv-hide-phone" onClick={() => go('Auth')}>
                Sign in
              </button>
            )}

            <button
              ref={menuButtonRef}
              type="button"
              className="nv-icon-btn nv-menu-toggle"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="nv-drawer"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
            </div>
          </div>
        </div>

        {/* Drop-down search bar */}
        {searchOpen && (
          <div id="nv-searchbar" className="nv-searchbar">
            <form className="nv-container nv-searchbar-form" role="search" onSubmit={submitSearch}>
              <label htmlFor="nv-search-input" className="nv-sr-only">Search ECLAT CONNECT</label>
              <div className="nv-searchbar-field">
                <Search className="nv-searchbar-icon" size={20} aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  id="nv-search-input"
                  type="search"
                  placeholder="Search for businesses, products, services or items"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoComplete="off"
                  enterKeyHint="search"
                />
              </div>
              <button type="submit" className="nv-btn nv-btn-primary">Search</button>
            </form>
          </div>
        )}
      </header>

      {/* ---------------- Mobile drawer ---------------- */}
      {menuOpen && (
        <div className="nv-overlay" onClick={() => setMenuOpen(false)}>
          <div
            id="nv-drawer"
            className="nv-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onClick={e => e.stopPropagation()}
          >
            <div className="nv-drawer-head">
              <EclatLogo size={32} />
              <button ref={drawerCloseRef} type="button" className="nv-icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <div className="nv-drawer-body">
              {isAuthenticated && user ? (
                <div className="nv-drawer-user">
                  <span className="nv-avatar nv-avatar-lg" aria-hidden="true">{initial || <UserRound size={18} />}</span>
                  <span className="nv-menu-identity">
                    <span className="nv-menu-name">{user.name}</span>
                    <span className="nv-menu-email">{user.email}</span>
                  </span>
                </div>
              ) : (
                <div className="nv-drawer-auth">
                  <button type="button" className="nv-btn nv-btn-primary" onClick={() => go('Auth')}>
                    <LogIn size={18} aria-hidden="true" /> Sign in
                  </button>
                  <button type="button" className="nv-btn nv-btn-ghost" onClick={() => go('Auth')}>
                    <UserPlus size={18} aria-hidden="true" /> Create account
                  </button>
                </div>
              )}

              <form className="nv-drawer-search" role="search" onSubmit={submitSearch}>
                <label htmlFor="nv-drawer-search" className="nv-sr-only">Search ECLAT CONNECT</label>
                <Search className="nv-drawer-search-icon" size={18} aria-hidden="true" />
                <input
                  id="nv-drawer-search"
                  type="search"
                  placeholder="Search the marketplace"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoComplete="off"
                  enterKeyHint="search"
                />
              </form>

              <p className="nv-drawer-label">Browse</p>
              <ul className="nv-drawer-list">
                {SECTIONS.map(section => {
                  const Icon = section.icon;
                  const active = isSectionActive(section.id, currentPage);
                  return (
                    <li key={section.id}>
                      <button
                        type="button"
                        className={`nv-drawer-item${active ? ' is-active' : ''}`}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => go(section.id)}
                      >
                        <Icon size={20} aria-hidden="true" /> {section.label}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {isAuthenticated && (
                <>
                  <p className="nv-drawer-label">Your account</p>
                  <ul className="nv-drawer-list">
                    <li>
                      <button type="button" className="nv-drawer-item" onClick={() => go('Account')}>
                        <UserRound size={20} aria-hidden="true" /> My account
                      </button>
                    </li>
                    <li>
                      <button type="button" className="nv-drawer-item" onClick={() => go('Notifications')}>
                        <Bell size={20} aria-hidden="true" /> Notifications
                        {unreadCount > 0 && <span className="nv-drawer-count">{unreadLabel}</span>}
                      </button>
                    </li>
                    {isVendor && (
                      <li>
                        <button type="button" className="nv-drawer-item" onClick={() => go('Vendor Workspace')}>
                          <Store size={20} aria-hidden="true" /> {portalLabel}
                        </button>
                      </li>
                    )}
                    {isAdmin && (
                      <li>
                        <button type="button" className="nv-drawer-item" onClick={() => go('Admin')}>
                          <ShieldCheck size={20} aria-hidden="true" /> Admin console
                        </button>
                      </li>
                    )}
                    <li>
                      <button type="button" className="nv-drawer-item nv-menu-danger" onClick={handleSignOut}>
                        <LogOut size={20} aria-hidden="true" /> Sign out
                      </button>
                    </li>
                  </ul>
                </>
              )}
            </div>

            <div className="nv-drawer-foot">
              <button type="button" className="nv-btn nv-btn-cta" onClick={() => go('Post What I Need')}>
                <Plus size={18} strokeWidth={2.6} aria-hidden="true" /> Post what I need
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
