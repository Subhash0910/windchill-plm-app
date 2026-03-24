import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navigator.css';

const SECTIONS = [
  {
    id: 'product',
    label: 'Product Data',
    icon: '⚙️',
    items: [
      { label: 'Parts',     path: '/plm/parts',      icon: '🔩' },
      { label: 'Documents', path: '/plm/documents',  icon: '📄' },
      { label: 'Products',  path: '/plm/products',   icon: '📦' },
      { label: 'Library',   path: '/plm/library',    icon: '📚' },
    ],
  },
  {
    id: 'change',
    label: 'Change Management',
    icon: '📋',
    items: [
      { label: 'Changes',      path: '/plm/changes',       icon: '🔄' },
      { label: 'Change Tasks', path: '/plm/changes/tasks', icon: '🔧' },
      { label: 'Worklist',     path: '/plm/worklist',      icon: '✅' },
    ],
  },
  {
    id: 'proj',
    label: 'Projects',
    icon: '🗂️',
    items: [
      { label: 'Projects', path: '/plm/projects', icon: '🗂️' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools & Admin',
    icon: '🛠️',
    items: [
      { label: 'Notifications', path: '/plm/notifications', icon: '🔔' },
      { label: 'Audit Log',     path: '/plm/audit-log',     icon: '📋' },
      { label: 'Team',          path: '/plm/team',          icon: '👥' },
      { label: 'AI Demo',       path: '/plm/ai-demo',       icon: '⚡' },
    ],
  },
];

const Navigator = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-open section that owns the current path
  const [openSection, setOpenSection] = useState(() => {
    const matched = SECTIONS.find(s =>
      s.items.some(i => location.pathname.startsWith(i.path))
    );
    return matched ? matched.id : 'product';
  });

  return (
    <nav className="wc-navigator">
      <div className="wc-nav-heading">Navigator</div>

      {SECTIONS.map(section => {
        const isOpen = openSection === section.id;
        return (
          <div key={section.id} className="wc-nav-section">
            <button
              className={`wc-nav-section-hdr${isOpen ? ' open' : ''}`}
              onClick={() => setOpenSection(isOpen ? null : section.id)}
            >
              <span className="wc-nav-sec-icon">{section.icon}</span>
              <span className="wc-nav-sec-label">{section.label}</span>
              <span className="wc-nav-chevron">{isOpen ? '▾' : '▸'}</span>
            </button>

            {isOpen && (
              <div className="wc-nav-items">
                {section.items.map(item => {
                  const active = location.pathname.startsWith(item.path);
                  return (
                    <button
                      key={item.path}
                      className={`wc-nav-item${active ? ' active' : ''}`}
                      onClick={() => navigate(item.path)}
                    >
                      <span className="wc-nav-item-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Navigator;
