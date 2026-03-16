import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../../utils/localStorage';
import '../../windchill-theme.css';
import './PlmLayout.css';
import AIChatBot from '../../components/ai/AIChatBot';

// Real Windchill top-nav structure (no duplicates)
const NAV_ITEMS = [
  { label: 'Home',          path: '/plm/parts' },
  { label: 'Product Library', path: '/plm/parts' },
  { label: 'Changes',       path: '/plm/changes' },
  { label: 'Change Tasks',  path: '/plm/changes/tasks' },
  { label: 'Documents',     path: '/plm/documents' },
  { label: 'Products',      path: '/plm/products' },
  { label: 'Projects',      path: '/plm/projects' },
  { label: 'Library',       path: '/plm/library' },
  { label: 'Worklist',      path: '/plm/worklist' },
  { label: 'Reports',       path: '/plm/audit-log' },
];

// Sidebar groups matching Windchill left-nav
const SIDEBAR_GROUPS = [
  {
    section: null,
    items: [
      { label: 'Parts',          path: '/plm/parts' },
      { label: 'BOM Structure',  path: '/plm/parts',    action: 'bom' },
      { label: 'Where Used',     path: '/plm/parts',    action: 'whereused' },
      { label: 'Search',         path: '/plm/search' },
      { label: 'Folder Browser', path: '/plm/folders' },
    ],
  },
  {
    section: 'CHANGES',
    items: [
      { label: 'Change Requests', path: '/plm/changes' },
      { label: 'Change Tasks',    path: '/plm/changes/tasks' },
    ],
  },
  {
    section: 'WORKSPACE',
    items: [
      { label: 'Worklist',       path: '/plm/worklist' },
      { label: 'Notifications',  path: '/plm/notifications' },
      { label: 'Team',           path: '/plm/team' },
    ],
  },
  {
    section: 'ADMIN',
    items: [
      { label: 'Audit Log',      path: '/plm/audit-log' },
    ],
  },
];

const PlmLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [aiActionTrigger, setAiActionTrigger] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const user = getUser?.() || {};
  const initials = user.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

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
    if (!location.pathname.startsWith('/plm/ai-demo')) {
      sessionStorage.setItem('pendingAiAction', JSON.stringify({ action: 'RUN_IMPACT_ANALYSIS', params }));
      navigate('/plm/ai-demo');
    } else {
      setAiActionTrigger({ ...params, timestamp: Date.now() });
    }
  };

  useEffect(() => {
    if (!location.pathname.startsWith('/plm/ai-demo')) return;
    const pending = sessionStorage.getItem('pendingAiAction');
    if (!pending) return;
    try {
      const { action, params } = JSON.parse(pending);
      sessionStorage.removeItem('pendingAiAction');
      setTimeout(() => {
        if (action === 'RUN_IMPACT_ANALYSIS') setAiActionTrigger({ ...params, timestamp: Date.now() });
      }, 500);
    } catch { sessionStorage.removeItem('pendingAiAction'); }
  }, [location.pathname]);

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/plm/search?q=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="wc-shell">
      {/* ── TOP NAVIGATOR ── */}
      <nav className="wc-topnav">
        <div className="wc-topnav__logo">
          <span style={{ color: '#e87722', fontWeight: 900 }}>PTC</span>
          <span>Windchill</span>
        </div>

        <div className="wc-topnav__links">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className={`wc-topnav__link${
                item.label === 'Home'
                  ? ''
                  : isActive(item.path) ? ' active' : ''
              }`}
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
          <button className="wc-topnav__action-btn" title="Notifications" onClick={() => navigate('/plm/notifications')}>
            🔔
          </button>
          <button className="wc-topnav__action-btn" title="Quick Search" onClick={() => navigate('/plm/search')}>
            Search
          </button>
          <button className="wc-topnav__action-btn" title="AI Assistant" onClick={() => navigate('/plm/ai-demo')}>
            ⚡ AI
          </button>
          <div className="wc-topnav__user" onClick={() => setUserMenuOpen(o => !o)}>
            <div className="wc-topnav__avatar" title={user.username || 'User'}>{initials}</div>
            {userMenuOpen && (
              <div className="wc-topnav__user-menu">
                <div className="wc-topnav__user-name">{user.firstName} {user.lastName}</div>
                <div className="wc-topnav__user-role">{user.role}</div>
                <hr />
                <button onClick={() => navigate('/admin/users')}>User Management</button>
                <button onClick={handleLogout}>Sign Out</button>
              </div>
            )}
          </div>
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

          {SIDEBAR_GROUPS.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && (
                <>
                  <hr className="wc-sidebar__divider" />
                  {!sidebarCollapsed && (
                    <div className="wc-sidebar__section-header">{group.section}</div>
                  )}
                </>
              )}
              {group.items.map((item, ii) => (
                <Link
                  key={ii}
                  to={item.path}
                  className={`wc-sidebar__item${isActive(item.path) ? ' active' : ''}`}
                  title={item.label}
                >
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {sidebarCollapsed && <span className="wc-sidebar__collapsed-label">{item.label.slice(0, 2)}</span>}
                </Link>
              ))}
            </React.Fragment>
          ))}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="wc-content">
          <Outlet context={{ aiActionTrigger }} />
        </main>
      </div>

      <AIChatBot onAction={handleChatAction} currentPage={getCurrentPage()} />
    </div>
  );
};

export default PlmLayout;
