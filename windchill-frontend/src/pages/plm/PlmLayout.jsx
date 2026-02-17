import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Header from '../../components/organisms/Header/Header';
import ContextSwitcher from '../../components/plm/ContextSwitcher';
import ContextTeamPanel from '../../components/plm/ContextTeamPanel';
import FolderTree from '../../components/plm/FolderTree';
import './PlmLayout.css';

const PlmLayout = () => {
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isWorklist = location.pathname.startsWith('/plm/worklist');
  const isChangesGroup = location.pathname.startsWith('/plm/changes');
  const isChangeTasks = location.pathname.startsWith('/plm/changes/tasks');
  const isChanges = isChangesGroup && !isChangeTasks;
  const isWorkspace = location.pathname.startsWith('/plm') && !isWorklist && !isChangesGroup;
  const isAiDemo = location.pathname.startsWith('/ai-demo');

  return (
    <div className="plm-shell">
      <Header title="Workspace" />

      <div className="plm-topnav">
        <div className="plm-topnav-inner">
          <Link className={isDashboard ? 'plm-link active' : 'plm-link'} to="/dashboard">Dashboard</Link>
          <Link className={isWorkspace ? 'plm-link active' : 'plm-link'} to="/plm">Workspace</Link>
          <Link className={isWorklist ? 'plm-link active' : 'plm-link'} to="/plm/worklist">Worklist</Link>
          <Link className={isChanges ? 'plm-link active' : 'plm-link'} to="/plm/changes">Changes</Link>
          <Link className={isChangeTasks ? 'plm-link active' : 'plm-link'} to="/plm/changes/tasks">Change Tasks</Link>
          <Link className={isAiDemo ? 'plm-link active' : 'plm-link'} to="/ai-demo" style={{color: '#667eea', fontWeight: isAiDemo ? 'bold' : 'normal'}}>⚡ AI Demo</Link>
        </div>
      </div>

      <div className="plm-body">
        <aside className="plm-left">
          <ContextSwitcher />
          <ContextTeamPanel />
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