import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../atoms/Button/Button';
import NotificationBell from './NotificationBell';
import './Header.css';

const Header = ({ title }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <h1 className="header-title">Windchill PLM</h1>
          {title && <span className="header-subtitle">{title}</span>}
        </div>
        <div className="header-right">
          {user && (
            <>
              {user.role === 'ADMIN' && (
                <a className="header-link" href="/admin/users">Users</a>
              )}
              <NotificationBell />
              <span className="user-name">{user.firstName || user.username}</span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
