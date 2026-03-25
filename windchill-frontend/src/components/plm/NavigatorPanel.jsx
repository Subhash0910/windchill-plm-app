import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './NavigatorPanel.css';

/* ── Individual nav item ── */
const NavItem = ({ to, icon, label, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `wc-nav__item ${isActive ? 'active' : ''}`}
    end={to === '/plm/parts'}
  >
    <span className="wc-nav__item-icon">{icon}</span>
    <span className="wc-nav__item-label">{label}</span>
    {badge != null && <span className="wc-nav__item-badge">{badge}</span>}
  </NavLink>
);

/* ── Collapsible group ── */
const NavGroup = ({ icon, label, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="wc-nav__group">
      <button className="wc-nav__group-header" onClick={() => setOpen(o => !o)}>
        <span className="wc-nav__group-icon">{icon}</span>
        <span className="wc-nav__group-label">{label}</span>
        <span className={`wc-nav__group-arrow ${open ? 'open' : ''}`}>›</span>
      </button>
      {open && <div className="wc-nav__group-body">{children}</div>}
    </div>
  );
};

const NavigatorPanel = () => {
  const location = useLocation();
  return (
    <nav className="wc-navigator" aria-label="Navigator">
      <div className="wc-navigator__header">Navigator</div>

      <NavGroup icon="🏠" label="Home" defaultOpen>
        <NavItem to="/dashboard"     icon="⬛" label="My Dashboard" />
        <NavItem to="/plm/worklist"  icon="✅" label="My Worklist" />
        <NavItem to="/plm/notifications" icon="🔔" label="Notifications" />
      </NavGroup>

      <NavGroup icon="📦" label="Product Data" defaultOpen>
        <NavItem to="/plm/products"  icon="📦" label="Products" />
        <NavItem to="/plm/parts"     icon="⚙️" label="Parts" />
        <NavItem to="/plm/documents" icon="📄" label="Documents" />
        <NavItem to="/plm/library"   icon="📚" label="Library" />
      </NavGroup>

      <NavGroup icon="🔄" label="Change Management" defaultOpen>
        <NavItem to="/plm/changes"       icon="📋" label="Change Requests" />
        <NavItem to="/plm/changes/tasks" icon="🔧" label="Change Tasks" />
      </NavGroup>

      <NavGroup icon="🗂️" label="Projects" defaultOpen={false}>
        <NavItem to="/plm/projects"  icon="🗂️" label="All Projects" />
        <NavItem to="/plm/team"      icon="👥" label="Team" />
      </NavGroup>

      <NavGroup icon="⚡" label="AI & Analytics" defaultOpen={false}>
        <NavItem to="/plm/ai-demo"   icon="⚡" label="AI Impact Engine" />
      </NavGroup>

      <NavGroup icon="🛠️" label="Administration" defaultOpen={false}>
        <NavItem to="/admin/users"   icon="👤" label="User Management" />
        <NavItem to="/plm/audit-log" icon="📋" label="Audit Log" />
      </NavGroup>
    </nav>
  );
};

export default NavigatorPanel;
