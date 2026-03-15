import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import '../../windchill-theme.css';
import './PlmLayout.css';
import AIChatBot from '../../components/ai/AIChatBot';

const NAV_ITEMS = [
  { label: 'Product Library',  path: '/plm/parts',         icon: '⛲' },
  { label: 'Changes',          path: '/plm/changes',        icon: '📝' },
  { label: 'Change Tasks',     path: '/plm/changes/tasks',  icon: '🔧' },
  { label: 'Documents',        path: '/plm/documents',      icon: '📄' },
  { label: 'Products',         path: '/plm/products',       icon: '📦' },
  { label: 'Projects',         path: '/plm/projects',       icon: '🗂' },
  { label: 'Library',          path: '/plm/library',        icon: '📚' },
  { label: 'Worklist',         path: '/plm/worklist',       icon: '✅' },
  { label: 'Reports',          path: '/plm/audit-log',      icon: '📊' },
];

const SIDEBAR_ITEMS = [
  { label: 'Parts',            path: '/plm/parts',          icon: '⛲', section: null },
  { label: 'BOM Structure',    path: null,                  icon: '📋', action: 'bom', section: null },
  { label: 'Where Used',       path: null,                  icon: '⇧', action: 'whereused', section: null },
  { label: 'Search',           path: '/plm/search',         icon: '🔍', section: null },
  { label: 'Folder Browser',   path: '/plm/folders',        icon: '🗄', section: null },
  { label: '---', section: 'CHANGES' },
  { label: 'Change Requests',  path: '/plm/changes',        icon: '📝', section: 'CHANGES' },
  { label: 'Change Tasks',     path: '/plm/changes/tasks',  icon: '🔧', section: 'CHANGES' },
  { label: '---', section: 'WORKSPACE' },
  { label: 'Worklist',         path: '/plm/worklist',       icon: '✅', section: 'WORKSPACE' },
  { label: 'Notifications',    path: '/plm/notifications',  icon: '🔔', section: 'WORKSPACE' },
  { label: 'Team',             path: '/plm/team',           icon: '👥', section: 'WORKSPACE' },
  { label: '---', section: 'ADMIN' },
  { label: 'Audit Log',        path: '/plm/audit-log',      icon: '📋', section: 'ADMIN' },
];

const PlmLayout = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [aiActionTrigger, setAiActionTrigger] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isActive = (path) => path && location.pathname.startsWith(path);

  const getCurrentPage = () => {
    const p = location.pathname;
    if (p.startsWith('/plm/bom'))           return 'bom';
    if (p.startsWith('/plm/where-used'))    return 'where-used';
    if (p.startsWith('/plm/search'))        return 'search';
    if (p.startsWith('/plm/folders'))       return 'folders';
    if (p.startsWith('/plm/worklist'))      return 'worklist';
    if (p.startsWith('/plm/changes/tasks')) return 'change-tasks';
    if (p.startsWith('/plm/changes'))       return 'changes';
    if (p.startsWith('/plm/ai-demo'))       return 'ai-demo';
    if (p.startsWith('/plm/notifications')) return 'notifications';
    if (p.startsWith('/plm/documents'))     return 'documents';
    if (p.startsWith('/plm/products'))      return 'products';
    if (p.startsWith('/plm/projects'))      return 'projects';
    if (p.startsWith('/plm/library'))       return 'library';
    if (p.startsWith('/plm/audit-log'))     return 'audit-log';
    return 'workspace';
  };

  const handleChatAction = (action, params) => {
    switch (action) {
      case 'RUN_IMPACT_ANALYSIS': handleImpactAnalysis(params); break;
      case 'SEARCH_PART':         navigate(`/plm/search?q=${params.part_number}`); break;
      case 'NAVIGATE_TO_ECN':     navigate('/plm/changes');  break;
      case 'NAVIGATE_TO_PARTS':   navigate('/plm/parts');    break;
      default: break;
    }
  };

  const handleImpactAnalysis = (params) => {
    const isAiDemo = location.pathname.startsWith('/plm/ai-demo');
    if (!isAiDemo) {
      sessionStorage.setItem('pendingAiAction', JSON.stringify({ action: 'RUN_IMPACT_ANALYSIS', params }));
      navigate('/plm/ai-demo');
    } else {
      setAiActionTrigger({ ...params, timestamp: Date.now() });
    }
  };

  useEffect(() => {
    const isAiDemo = location.pathname.startsWith('/plm/ai-demo');
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
  }, [location.pathname]);

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/plm/search?q=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  const handleSidebarAction = (action) => {
    // BOM / Where-Used require a selected part — navigate to search if none in context
    if (action === 'bom' || action === 'whereused') {
      navigate('/plm/parts');
    }
  };

  let renderedSection = null;

  return (
    <div className="wc-shell">
      {/* ── TOP NAVIGATOR ── */}
      <nav className="wc-topnav">
        <div className="wc-topnav__logo">
          <span style={{ color: '#e87722', fontWeight: 900 }}>PTC</span>
          <span>Windchill</span>
        </div>

        <div className="wc-topnav__links">
          <Link
            to="/dashboard"
            className={`wc-topnav__link${location.pathname.startsWith('/dashboard') ? ' active' : ''}`}
          >
            Home
          </Link>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`wc-topnav__link${isActive(item.path) ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="wc-topnav__actions">
          <input
            className="wc-topnav__search"
            placeholder="Search PLM…"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            onKeyDown={handleGlobalSearch}
          />
          <button className="wc-topnav__action-btn" onClick={() => navigate('/plm/notifications')}>
            🔔
          </button>
          <button className="wc-topnav__action-btn" onClick={() => navigate('/plm/search')}>
            🔍 Search
          </button>
          <button className="wc-topnav__action-btn" onClick={() => navigate('/plm/ai-demo')}>
            ⚡ AI
          </button>
          <button className="wc-topnav__action-btn" title="Preferences">
            ⚙️
          </button>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div className="wc-body">
        {/* ── SIDEBAR ── */}
        <aside className={`wc-sidebar${sidebarCollapsed ? ' wc-sidebar--collapsed' : ''}`}>
          <button
            className="wc-sidebar__collapse-btn"
            onClick={() => setSidebarCollapsed(c => !c)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>

          {SIDEBAR_ITEMS.map((item, i) => {
            if (item.label === '---') {
              const showSection = item.section;
              if (sidebarCollapsed) return <hr key={i} className="wc-sidebar__divider" />;
              const show = showSection !== renderedSection;
              renderedSection = showSection;
              return (
                <React.Fragment key={i}>
                  <hr className="wc-sidebar__divider" />
                  {show && <div className="wc-sidebar__section-header">{showSection}</div>}
                </React.Fragment>
              );
            }
            if (item.action) {
              return (
                <button
                  key={i}
                  className="wc-sidebar__item wc-sidebar__item--btn"
                  onClick={() => handleSidebarAction(item.action)}
                  title={item.label}
                >
                  <span className="icon">{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            }
            return (
              <Link
                key={i}
                to={item.path}
                className={`wc-sidebar__item${isActive(item.path) ? ' active' : ''}`}
                title={item.label}
              >
                <span className="icon">{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="wc-content">
          <Outlet context={{ aiActionTrigger }} />
        </main>
      </div>

      <AIChatBot
        onAction={handleChatAction}
        currentPage={getCurrentPage()}
      />
    </div>
  );
};

export default PlmLayout;
