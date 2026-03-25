import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/organisms/Header/Header';
import ContextSwitcher from '../../components/plm/ContextSwitcher';
import FolderTree from '../../components/plm/FolderTree';
import NavigatorPanel from '../../components/plm/NavigatorPanel';
import AIChatBot from '../../components/ai/AIChatBot';
import './PlmLayout.css';

const PlmLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [aiActionTrigger, setAiActionTrigger] = useState(null);
  const [navCollapsed, setNavCollapsed] = useState(false);

  const isAiDemo = location.pathname.startsWith('/plm/ai-demo');
  const isWorkspace = location.pathname.startsWith('/plm')
    && !location.pathname.startsWith('/plm/worklist')
    && !location.pathname.startsWith('/plm/changes')
    && !location.pathname.startsWith('/plm/ai-demo')
    && !location.pathname.startsWith('/plm/notifications')
    && !location.pathname.startsWith('/plm/documents')
    && !location.pathname.startsWith('/plm/products')
    && !location.pathname.startsWith('/plm/projects')
    && !location.pathname.startsWith('/plm/library')
    && !location.pathname.startsWith('/plm/audit-log')
    && !location.pathname.startsWith('/plm/team');

  const getCurrentPage = () => {
    const p = location.pathname;
    if (p.startsWith('/plm/worklist'))    return 'worklist';
    if (p.startsWith('/plm/changes/tasks')) return 'change-tasks';
    if (p.startsWith('/plm/changes'))     return 'changes';
    if (p.startsWith('/plm/ai-demo'))     return 'ai-demo';
    if (p.startsWith('/plm/notifications')) return 'notifications';
    if (p.startsWith('/plm/documents'))   return 'documents';
    if (p.startsWith('/plm/products'))    return 'products';
    if (p.startsWith('/plm/projects'))    return 'projects';
    if (p.startsWith('/plm/library'))     return 'library';
    if (p.startsWith('/plm/audit-log'))   return 'audit-log';
    return 'workspace';
  };

  const handleChatAction = (action, params) => {
    switch (action) {
      case 'RUN_IMPACT_ANALYSIS': handleImpactAnalysis(params); break;
      case 'SEARCH_PART':         navigate(`/plm/parts?search=${params.part_number}`); break;
      case 'NAVIGATE_TO_ECN':     navigate('/plm/changes');   break;
      case 'NAVIGATE_TO_PARTS':   navigate('/plm/parts');     break;
      default: break;
    }
  };

  const handleImpactAnalysis = (params) => {
    if (!isAiDemo) {
      sessionStorage.setItem('pendingAiAction', JSON.stringify({ action: 'RUN_IMPACT_ANALYSIS', params }));
      navigate('/plm/ai-demo');
    } else {
      setAiActionTrigger({ ...params, timestamp: Date.now() });
    }
  };

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
    <div className="wc-shell">
      {/* ── Top bar (navy, 48px) ── */}
      <Header title="Windchill PLM" />

      {/* ── Main body: Navigator + Content ── */}
      <div className="wc-shell__body">
        {/* ── Left Navigator ── */}
        <aside className={`wc-shell__nav ${navCollapsed ? 'collapsed' : ''}`}>
          <ContextSwitcher />
          <NavigatorPanel />
          {!navCollapsed && isWorkspace && <FolderTree />}
          <button
            className="wc-shell__nav-toggle"
            onClick={() => setNavCollapsed(c => !c)}
            title={navCollapsed ? 'Expand Navigator' : 'Collapse Navigator'}
          >
            {navCollapsed ? '›' : '‹'}
          </button>
        </aside>

        {/* ── Page content ── */}
        <main className="wc-shell__main">
          <Outlet context={{ aiActionTrigger }} />
        </main>
      </div>

      <AIChatBot onAction={handleChatAction} currentPage={getCurrentPage()} />
    </div>
  );
};

export default PlmLayout;
