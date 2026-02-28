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
  const [selectedPart,    setSelectedPart]    = useState(null);
  const [aiActionTrigger, setAiActionTrigger] = useState(null);

  const isDashboard     = location.pathname.startsWith('/dashboard');
  const isWorklist      = location.pathname.startsWith('/plm/worklist');
  const isChangesGroup  = location.pathname.startsWith('/plm/changes');
  const isChangeTasks   = location.pathname.startsWith('/plm/changes/tasks');
  const isChanges       = isChangesGroup && !isChangeTasks;
  const isAiDemo        = location.pathname.startsWith('/plm/ai-demo');
  const isNotifications = location.pathname.startsWith('/plm/notifications');
  const isDocuments     = location.pathname.startsWith('/plm/documents');
  const isProducts      = location.pathname.startsWith('/plm/products');
  const isProjects      = location.pathname.startsWith('/plm/projects');
  const isLibrary       = location.pathname.startsWith('/plm/library');
  const isAuditLog      = location.pathname.startsWith('/plm/audit-log');

  const isWorkspace = location.pathname.startsWith('/plm')
    && !isWorklist && !isChangesGroup && !isAiDemo
    && !isNotifications && !isDocuments
    && !isProducts && !isProjects && !isLibrary && !isAuditLog;

  const getCurrentPage = () => {
    if (isWorkspace)     return 'workspace';
    if (isWorklist)      return 'worklist';
    if (isChanges)       return 'changes';
    if (isChangeTasks)   return 'change-tasks';
    if (isAiDemo)        return 'ai-demo';
    if (isNotifications) return 'notifications';
    if (isDocuments)     return 'documents';
    if (isProducts)      return 'products';
    if (isProjects)      return 'projects';
    if (isLibrary)       return 'library';
    if (isAuditLog)      return 'audit-log';
    return 'unknown';
  };

  const handleChatAction = (action, params) => {
    switch (action) {
      case 'RUN_IMPACT_ANALYSIS': handleImpactAnalysis(params); break;
      case 'SEARCH_PART':         handlePartSearch(params);     break;
      case 'NAVIGATE_TO_ECN':     navigate('/plm/changes');     break;
      case 'NAVIGATE_TO_PARTS':   navigate('/plm/parts');       break;
      default: break;
    }
  };

  const handleImpactAnalysis = (params) => {
    const { part_number, change_type } = params;
    if (!isAiDemo) {
      sessionStorage.setItem('pendingAiAction', JSON.stringify({ action: 'RUN_IMPACT_ANALYSIS', params: { part_number, change_type } }));
      navigate('/plm/ai-demo');
    } else {
      setAiActionTrigger({ part_number, change_type, timestamp: Date.now() });
    }
  };

  const handlePartSearch = (params) => navigate(`/plm/parts?search=${params.part_number}`);

  useEffect(() => {
    if (isAiDemo) {
      const pending = sessionStorage.getItem('pendingAiAction');
      if (pending) {
        try {
          const { action, params } = JSON.parse(pending);
          sessionStorage.removeItem('pendingAiAction');
          setTimeout(() => {
            if (action === 'RUN_IMPACT_ANALYSIS') setAiActionTrigger({ ...params, timestamp: Date.now() });
          }, 500);
        } catch { sessionStorage.removeItem('pendingAiAction'); }
      }
    }
  }, [isAiDemo]);

  return (
    <div className="plm-shell">
      <Header title="Workspace" />

      <div className="plm-topnav" style={{ overflowX: 'auto' }}>
        <div className="plm-topnav-inner" style={{ minWidth: 'max-content' }}>
          <Link className={isDashboard     ? 'plm-link active' : 'plm-link'} to="/dashboard">Dashboard</Link>
          <Link className={isWorkspace     ? 'plm-link active' : 'plm-link'} to="/plm">Workspace</Link>
          <Link className={isWorklist      ? 'plm-link active' : 'plm-link'} to="/plm/worklist">Worklist</Link>
          <Link className={isChanges       ? 'plm-link active' : 'plm-link'} to="/plm/changes">Changes</Link>
          <Link className={isChangeTasks   ? 'plm-link active' : 'plm-link'} to="/plm/changes/tasks">Change Tasks</Link>
          <Link className={isDocuments     ? 'plm-link active' : 'plm-link'} to="/plm/documents">📄 Documents</Link>
          <Link className={isProducts      ? 'plm-link active' : 'plm-link'} to="/plm/products">📦 Products</Link>
          <Link className={isProjects      ? 'plm-link active' : 'plm-link'} to="/plm/projects">🗂️ Projects</Link>
          <Link className={isLibrary       ? 'plm-link active' : 'plm-link'} to="/plm/library">📚 Library</Link>
          <Link className={isNotifications ? 'plm-link active' : 'plm-link'} to="/plm/notifications">🔔 Notifications</Link>
          <Link className={isAuditLog      ? 'plm-link active' : 'plm-link'} to="/plm/audit-log">📋 Audit Log</Link>
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
