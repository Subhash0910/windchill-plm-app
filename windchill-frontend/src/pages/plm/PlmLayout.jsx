import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/organisms/Header/Header';
import ContextSwitcher from '../../components/plm/ContextSwitcher';
import ContextTeamPanel from '../../components/plm/ContextTeamPanel';
import FolderTree from '../../components/plm/FolderTree';
import AIChatBot from '../../components/ai/AIChatBot';
import './PlmLayout.css';

const PlmLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPart, setSelectedPart] = useState(null);
  const [aiActionTrigger, setAiActionTrigger] = useState(null);

  const isDashboard     = location.pathname.startsWith('/dashboard');
  const isWorklist      = location.pathname.startsWith('/plm/worklist');
  const isChangesGroup  = location.pathname.startsWith('/plm/changes');
  const isChangeTasks   = location.pathname.startsWith('/plm/changes/tasks');
  const isChanges       = isChangesGroup && !isChangeTasks;
  const isAiDemo        = location.pathname.startsWith('/plm/ai-demo');
  const isNotifications = location.pathname.startsWith('/plm/notifications');
  const isTeam          = location.pathname.startsWith('/plm/team');

  // Workspace = any /plm route that isn't one of the named sections
  const isWorkspace = location.pathname.startsWith('/plm')
    && !isWorklist
    && !isChangesGroup
    && !isAiDemo
    && !isNotifications
    && !isTeam;

  const getCurrentPage = () => {
    if (isWorkspace)      return 'workspace';
    if (isWorklist)       return 'worklist';
    if (isChanges)        return 'changes';
    if (isChangeTasks)    return 'change-tasks';
    if (isAiDemo)         return 'ai-demo';
    if (isNotifications)  return 'notifications';
    if (isTeam)           return 'team';
    return 'unknown';
  };

  const handleChatAction = (action, params) => {
    console.log('🤖 AI Action:', action, params);
    switch (action) {
      case 'RUN_IMPACT_ANALYSIS': handleImpactAnalysis(params); break;
      case 'SEARCH_PART':         handlePartSearch(params);     break;
      case 'NAVIGATE_TO_ECN':     navigate('/plm/changes');     break;
      case 'NAVIGATE_TO_PARTS':   navigate('/plm/parts');       break;
      default: console.log('Unknown action:', action);
    }
  };

  const handleImpactAnalysis = (params) => {
    const { part_number, change_type } = params;
    if (!isAiDemo) {
      sessionStorage.setItem('pendingAiAction', JSON.stringify({
        action: 'RUN_IMPACT_ANALYSIS',
        params: { part_number, change_type },
      }));
      navigate('/plm/ai-demo');
    } else {
      setAiActionTrigger({ part_number, change_type, timestamp: Date.now() });
    }
  };

  const handlePartSearch = (params) => {
    navigate(`/plm/parts?search=${params.part_number}`);
  };

  useEffect(() => {
    if (isAiDemo) {
      const pending = sessionStorage.getItem('pendingAiAction');
      if (pending) {
        try {
          const { action, params } = JSON.parse(pending);
          sessionStorage.removeItem('pendingAiAction');
          setTimeout(() => {
            if (action === 'RUN_IMPACT_ANALYSIS')
              setAiActionTrigger({ ...params, timestamp: Date.now() });
          }, 500);
        } catch (e) {
          sessionStorage.removeItem('pendingAiAction');
        }
      }
    }
  }, [isAiDemo]);

  return (
    <div className="plm-shell">
      <Header title="Workspace" />

      <div className="plm-topnav">
        <div className="plm-topnav-inner">
          <Link className={isDashboard     ? 'plm-link active' : 'plm-link'} to="/dashboard">Dashboard</Link>
          <Link className={isWorkspace     ? 'plm-link active' : 'plm-link'} to="/plm">Workspace</Link>
          <Link className={isWorklist      ? 'plm-link active' : 'plm-link'} to="/plm/worklist">Worklist</Link>
          <Link className={isChanges       ? 'plm-link active' : 'plm-link'} to="/plm/changes">Changes</Link>
          <Link className={isChangeTasks   ? 'plm-link active' : 'plm-link'} to="/plm/changes/tasks">Change Tasks</Link>
          <Link className={isNotifications ? 'plm-link active' : 'plm-link'} to="/plm/notifications">🔔 Notifications</Link>
          <Link className={isTeam          ? 'plm-link active' : 'plm-link'} to="/plm/team">👥 Team</Link>
          <Link
            className={isAiDemo ? 'plm-link active' : 'plm-link'}
            to="/plm/ai-demo"
            style={{ color: '#667eea', fontWeight: isAiDemo ? 'bold' : 'normal' }}
          >
            ⚡ AI Demo
          </Link>
        </div>
      </div>

      <div className="plm-body">
        <aside className="plm-left">
          <ContextSwitcher />
          <ContextTeamPanel />
          <FolderTree />
        </aside>

        <main className="plm-main">
          <Outlet context={{ aiActionTrigger }} />
        </main>
      </div>

      <AIChatBot
        onAction={handleChatAction}
        selectedPart={selectedPart}
        currentPage={getCurrentPage()}
      />
    </div>
  );
};

export default PlmLayout;
