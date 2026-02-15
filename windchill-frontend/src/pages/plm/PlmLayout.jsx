import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Header from '../../components/organisms/Header/Header';
import ContextSwitcher from '../../components/plm/ContextSwitcher';
import FolderTree from '../../components/plm/FolderTree';
import './PlmLayout.css';

const PlmLayout = () => {
  const location = useLocation();
  const active = location.pathname.startsWith('/plm') ? 'plm' : 'dashboard';

  return (
    <div className="plm-shell">
      <Header title="Workspace" />

      <div className="plm-topnav">
        <div className="plm-topnav-inner">
          <Link className={active === 'dashboard' ? 'plm-link active' : 'plm-link'} to="/dashboard">Dashboard</Link>
          <Link className={active === 'plm' ? 'plm-link active' : 'plm-link'} to="/plm">Workspace</Link>
        </div>
      </div>

      <div className="plm-body">
        <aside className="plm-left">
          <ContextSwitcher />
          <FolderTree />
        </aside>

        <main className="plm-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PlmLayout;
