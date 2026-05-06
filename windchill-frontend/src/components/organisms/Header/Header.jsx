import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import NotificationBell from './NotificationBell';
import Breadcrumb from '../../plm/Breadcrumb';
import GlobalSearch from '../../plm/GlobalSearch';
import './Header.css';

/**
 * Enterprise PLM-style 56px top bar.
 * Slot layout:  [Brand]  [Breadcrumb — flex 1]  [Admin chip | Bell | Theme | Avatar]
 */
const Header = ({ title }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('wc-theme');
    return saved === 'dark';
  });
  const menuRef = useRef(null);

  // Apply saved theme on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = () => { logout(); window.location.href = '/login'; };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('wc-theme', next ? 'dark' : 'light');
  };

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || user.username?.[0] || '')).toUpperCase()
    : '?';

  return (
    <header className="wc-header">

      {/* Brand */}
      <div className="wc-header-brand">
        <span className="wc-logo-mark">W</span>
        <span className="wc-logo-text">PLM Learning Workspace</span>
      </div>

      {/* Breadcrumb — fills centre */}
      <div className="wc-header-breadcrumb">
        <Breadcrumb />
      </div>

      {/* Global Search */}
      <GlobalSearch />

      {/* Right controls */}
      <div className="wc-header-right">
        {user?.role === 'ADMIN' && (
          <a className="wc-nav-chip" href="/admin/users">Admin</a>
        )}
        <NotificationBell />

        {/* Dark mode toggle */}
        <button
          className="wc-theme-toggle"
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        <div className="wc-user-menu" ref={menuRef}>
          <button
            className="wc-avatar"
            onClick={() => setUserMenuOpen(o => !o)}
            title={user?.username}
          >
            {initials}
          </button>

          {userMenuOpen && (
            <div className="wc-user-dropdown">
              <div className="wc-user-info">
                <span className="wc-user-full">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName || ''}`.trim()
                    : user?.username}
                </span>
                <span className="wc-user-role">{user?.role}</span>
              </div>
              <hr className="wc-dropdown-sep" />
              <button className="wc-dropdown-item wc-dropdown-logout" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
