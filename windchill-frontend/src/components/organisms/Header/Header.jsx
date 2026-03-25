import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import NotificationBell from './NotificationBell';
import Breadcrumb from '../../plm/Breadcrumb';
import './Header.css';

/**
 * Windchill-style 48px navy top bar.
 * Slot layout:  [Brand]  [Breadcrumb — flex 1]  [Admin chip | Bell | Avatar]
 */
const Header = ({ title }) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = () => { logout(); window.location.href = '/login'; };

  const initials = user
    ? ((user.firstName?.[0] || '') + (user.lastName?.[0] || user.username?.[0] || '')).toUpperCase()
    : '?';

  return (
    <header className="wc-header">

      {/* Brand */}
      <div className="wc-header-brand">
        <span className="wc-logo-mark">W</span>
        <span className="wc-logo-text">Windchill PLM</span>
      </div>

      {/* Breadcrumb — fills centre */}
      <div className="wc-header-breadcrumb">
        <Breadcrumb />
      </div>

      {/* Right controls */}
      <div className="wc-header-right">
        {user?.role === 'ADMIN' && (
          <a className="wc-nav-chip" href="/admin/users">Admin</a>
        )}
        <NotificationBell />

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
