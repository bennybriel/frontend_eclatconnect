import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EclatLogo } from './EclatLogo';

export { EclatLogo };

export interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, unreadCount = 0 }) => {
  const { user, isAuthenticated, isAdmin, isVendor, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { id: 'Home', label: 'Home' },
    { id: 'Businesses', label: 'Businesses' },
    { id: 'Products', label: 'Products' },
    { id: 'Artisans', label: 'Artisans' },
    { id: 'Services', label: 'Services' },
    { id: 'Pre-owned', label: 'Pre-owned' },
    { id: 'Requests', label: 'Requests' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (p: string) => {
    onNavigate(p);
    setMobileMenuOpen(false);
    setAccountDropdownOpen(false);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          {/* Brand Logo with Official Design */}
          <EclatLogo onClick={() => handleNav('Home')} />

          {/* Desktop Navigation Links */}
          <nav className="header-nav">
            {navLinks.map(link => {
              const isActive = currentPage === link.id || (link.id === 'Artisans' && currentPage === 'Professionals');
              return (
                <button
                  key={link.id}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNav(link.id)}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop & Tablet Right Actions */}
          <div className="header-actions">
            {/* 1. Search Icon Button */}
            <button
              type="button"
              className="icon-action-btn search-action-btn"
              onClick={() => handleNav('Products')}
              title="Search items and services"
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* 2. Notification Bell Icon with Count */}
            <button
              type="button"
              className="icon-action-btn notif-action-btn"
              onClick={() => handleNav('Notifications')}
              title="Notifications"
              aria-label="Notifications"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && (
                <span className="notif-badge-pill">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* 3. Desktop "My Account ▾" Dropdown */}
            <div className="desktop-account-menu" ref={dropdownRef}>
              <button
                type="button"
                className="my-account-btn"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              >
                <span>👤</span>
                <span className="my-account-label">
                  {isAuthenticated && user ? user.name.split(' ')[0] : 'My Account'}
                </span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>▾</span>
              </button>

              {accountDropdownOpen && (
                <div className="account-dropdown-menu">
                  {isAuthenticated && user ? (
                    <>
                      <div className="dropdown-user-header">
                        <div style={{ fontWeight: 700, color: 'var(--brand-purple)' }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                        <span className="card-badge" style={{ marginTop: 4, display: 'inline-block', fontSize: 11 }}>
                          {user.role}
                        </span>
                      </div>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item" onClick={() => handleNav('Account')}>
                        <span>👤</span> Profile & Settings
                      </button>
                      {isVendor && (
                        <button className="dropdown-item" onClick={() => handleNav('Vendor Workspace')}>
                          <span>{user?.role === 'ARTISAN' ? '🛠️' : '🏪'}</span> {user?.role === 'ARTISAN' ? 'Artisan Portal' : 'Vendor Portal'}
                        </button>
                      )}
                      {isAdmin && (
                        <button className="dropdown-item" onClick={() => handleNav('Admin')}>
                          <span>🛡️</span> Platform Admin
                        </button>
                      )}
                      <div className="dropdown-divider" />
                      <button
                        className="dropdown-item dropdown-item-danger"
                        onClick={() => {
                          logout();
                          handleNav('Home');
                        }}
                      >
                        <span>🚪</span> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="dropdown-item" onClick={() => handleNav('Auth')}>
                        <span>🔑</span> Sign In
                      </button>
                      <button className="dropdown-item" onClick={() => handleNav('Auth')}>
                        <span>✨</span> Create Account
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 4. Mobile Avatar Quick Button (visible on mobile only) */}
            <button
              type="button"
              className="icon-action-btn mobile-avatar-btn"
              onClick={() => handleNav(isAuthenticated ? 'Account' : 'Auth')}
              aria-label="User Account"
            >
              👤
            </button>

            {/* 5. Mobile Hamburger Toggle Button */}
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE MENU DRAWER (EXACT MATCH TO RIGHT PHONE MOCKUP)    */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="mobile-drawer-content"
            onClick={e => e.stopPropagation()}
            aria-label="Mobile Navigation Drawer"
          >
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <EclatLogo onClick={() => handleNav('Home')} />
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="mobile-drawer-list">
              <button
                type="button"
                className={`drawer-item ${currentPage === 'Home' ? 'active-pill' : ''}`}
                onClick={() => handleNav('Home')}
              >
                <span className="drawer-item-icon">🏠</span>
                <span className="drawer-item-label">Home</span>
              </button>

              <button
                type="button"
                className={`drawer-item ${currentPage === 'Businesses' ? 'active-pill' : ''}`}
                onClick={() => handleNav('Businesses')}
              >
                <span className="drawer-item-icon">🏪</span>
                <span className="drawer-item-label">Businesses</span>
              </button>

              <button
                type="button"
                className={`drawer-item ${currentPage === 'Products' ? 'active-pill' : ''}`}
                onClick={() => handleNav('Products')}
              >
                <span className="drawer-item-icon">🛍️</span>
                <span className="drawer-item-label">Products</span>
              </button>

              <button
                type="button"
                className={`drawer-item ${currentPage === 'Artisans' || currentPage === 'Professionals' ? 'active-pill' : ''}`}
                onClick={() => handleNav('Artisans')}
              >
                <span className="drawer-item-icon">✂️</span>
                <span className="drawer-item-label">Artisans</span>
              </button>

              <button
                type="button"
                className={`drawer-item ${currentPage === 'Services' ? 'active-pill' : ''}`}
                onClick={() => handleNav('Services')}
              >
                <span className="drawer-item-icon">⚡</span>
                <span className="drawer-item-label">Services</span>
              </button>

              <button
                type="button"
                className={`drawer-item ${currentPage === 'Pre-owned' ? 'active-pill' : ''}`}
                onClick={() => handleNav('Pre-owned')}
              >
                <span className="drawer-item-icon">♻️</span>
                <span className="drawer-item-label">Pre-owned Items</span>
              </button>

              <button
                type="button"
                className={`drawer-item ${currentPage === 'Requests' ? 'active-pill' : ''}`}
                onClick={() => handleNav('Requests')}
              >
                <span className="drawer-item-icon">💬</span>
                <span className="drawer-item-label">Requests</span>
              </button>

              <div className="drawer-divider" />

              {/* Account Section in Drawer */}
              <button
                type="button"
                className={`drawer-item ${currentPage === 'Account' ? 'active-pill' : ''}`}
                onClick={() => handleNav(isAuthenticated ? 'Account' : 'Auth')}
              >
                <span className="drawer-item-icon">👤</span>
                <span className="drawer-item-label">My Account</span>
              </button>

              <button
                type="button"
                className={`drawer-item ${currentPage === 'Notifications' ? 'active-pill' : ''}`}
                onClick={() => handleNav('Notifications')}
              >
                <span className="drawer-item-icon">🔔</span>
                <span className="drawer-item-label">Notifications</span>
                {unreadCount > 0 && (
                  <span className="drawer-badge">{unreadCount}</span>
                )}
              </button>

              {isVendor && (
                <button
                  type="button"
                  className={`drawer-item ${currentPage === 'Vendor Workspace' ? 'active-pill' : ''}`}
                  onClick={() => handleNav('Vendor Workspace')}
                >
                  <span className="drawer-item-icon">{user?.role === 'ARTISAN' ? '🛠️' : '🏪'}</span>
                  <span className="drawer-item-label">{user?.role === 'ARTISAN' ? 'Artisan Portal' : 'Vendor Portal'}</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  className={`drawer-item ${currentPage === 'Admin' ? 'active-pill' : ''}`}
                  onClick={() => handleNav('Admin')}
                >
                  <span className="drawer-item-icon">🛡️</span>
                  <span className="drawer-item-label">Admin Portal</span>
                </button>
              )}

              <button
                type="button"
                className="drawer-item"
                onClick={() => handleNav(isAuthenticated ? 'Account' : 'Auth')}
              >
                <span className="drawer-item-icon">⚙️</span>
                <span className="drawer-item-label">Settings</span>
              </button>

              {isAuthenticated ? (
                <button
                  type="button"
                  className="drawer-item drawer-item-signout"
                  onClick={() => {
                    logout();
                    handleNav('Home');
                  }}
                >
                  <span className="drawer-item-icon">🚪</span>
                  <span className="drawer-item-label">Sign Out</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="drawer-item"
                  style={{ color: 'var(--brand-purple)', fontWeight: 700 }}
                  onClick={() => handleNav('Auth')}
                >
                  <span className="drawer-item-icon">🔑</span>
                  <span className="drawer-item-label">Sign In / Register</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
