import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import './NavigatorPanel.css';

/* ── NavItem ─────────────────────────────────────────────────────────── */
const NavItem = ({ to, icon, label, badge, end: endProp }) => (
  <NavLink
    to={to}
    end={endProp ?? to === '/plm/parts'}
    className={({ isActive }) => `wc-nav__item ${isActive ? 'active' : ''}`}
  >
    <span className="wc-nav__item-icon">{icon}</span>
    <span className="wc-nav__item-label">{label}</span>
    {badge != null && badge > 0 && <span className="wc-nav__item-badge">{badge}</span>}
  </NavLink>
);

/* ── NavGroup (collapsible accordion) ─────────────────────────────────── */
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

/* ── Main NavigatorPanel ───────────────────────────────────────────────── */
const NavigatorPanel = () => {
  const [worklistCount,  setWorklistCount]  = useState(null);
  const [notifCount,     setNotifCount]     = useState(null);

  useEffect(() => {
    plmApi.listMyWorkItems()
      .then(items => setWorklistCount(Array.isArray(items) ? items.filter(i => i.status === 'PENDING').length : 0))
      .catch(() => {});
    plmApi.getNotificationCount()
      .then(n => setNotifCount(n ?? 0))
      .catch(() => {});
  }, []);

  return (
    <nav className="wc-navigator" aria-label="Navigator">
      <div className="wc-navigator__section-label">Navigator</div>

      {/* HOME */}
      <NavGroup icon="🏠" label="Home" defaultOpen>
        <NavItem to="/dashboard"         icon="⊞" label="My Dashboard" end />
        <NavItem to="/plm/worklist"      icon="✅" label="My Worklist"  badge={worklistCount} />
        <NavItem to="/plm/notifications" icon="🔔" label="Notifications" badge={notifCount} />
      </NavGroup>

      {/* PRODUCT DATA */}
      <NavGroup icon="📦" label="Product Data" defaultOpen>
        <NavItem to="/plm/products"  icon="📦" label="Products" />
        <NavItem to="/plm/parts"     icon="⚙️" label="Parts &amp; BOM" />
        <NavItem to="/plm/documents" icon="📄" label="Documents" />
        <NavItem to="/plm/library"   icon="📚" label="Library" />
      </NavGroup>

      {/* CHANGE MANAGEMENT */}
      <NavGroup icon="🔄" label="Change Management" defaultOpen>
        <NavItem to="/plm/changes"       icon="📋" label="Change Requests (ECR)" />
        <NavItem to="/plm/changes/tasks" icon="🔧" label="Change Tasks" />
      </NavGroup>

      {/* PROJECTS */}
      <NavGroup icon="🗂️" label="Projects" defaultOpen={false}>
        <NavItem to="/plm/projects" icon="🗂️" label="All Projects" />
        <NavItem to="/plm/team"     icon="👥" label="Team" />
      </NavGroup>

      {/* AI */}
      <NavGroup icon="⚡" label="AI &amp; Analytics" defaultOpen={false}>
        <NavItem to="/plm/ai-demo" icon="⚡" label="AI Impact Engine" />
      </NavGroup>

      {/* ADMINISTRATION */}
      <NavGroup icon="🛠️" label="Administration" defaultOpen={false}>
        <NavItem to="/plm/admin/users"  icon="👤" label="User Management" />
        <NavItem to="/plm/admin/system" icon="🖥️" label="System Status" />
        <NavItem to="/plm/audit-log"    icon="📋" label="Audit Log" />
      </NavGroup>
    </nav>
  );
};

export default NavigatorPanel;
