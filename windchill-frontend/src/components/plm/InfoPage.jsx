import React, { useState } from 'react';
import StateBadge from './StateBadge';
import Breadcrumb from './Breadcrumb';
import './InfoPage.css';

/**
 * InfoPage — Windchill-style object Info Page
 *
 * Props:
 *  icon         string  — emoji or icon character shown in header
 *  title        string  — object name / title
 *  subtitle     string  — e.g. "Part Number: ECU-001 | Rev A.2"
 *  state        string  — lifecycle state fed to StateBadge
 *  breadcrumbs  array   — [{ label, to? }]
 *  tabs         array   — [{ key, label, content: ReactNode }]
 *  actions      ReactNode — toolbar buttons rendered top-right
 *  loading      bool
 *  error        string
 */
const InfoPage = ({
  icon = '📄',
  title,
  subtitle,
  state,
  breadcrumbs = [],
  tabs = [],
  actions,
  loading = false,
  error,
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? '');

  if (loading) return (
    <div className="wc-spinner-wrap"><div className="wc-spinner" /></div>
  );
  if (error) return (
    <div className="wc-infopage-error">
      <span className="wc-empty-icon">⚠️</span>
      <p>{error}</p>
    </div>
  );

  const activeContent = tabs.find(t => t.key === activeTab)?.content;

  return (
    <div className="wc-infopage">
      {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

      {/* ── Object header ── */}
      <div className="wc-infopage__header">
        <div className="wc-infopage__header-left">
          <span className="wc-infopage__icon">{icon}</span>
          <div className="wc-infopage__meta">
            <h1 className="wc-infopage__title">{title || '—'}</h1>
            {subtitle && <p className="wc-infopage__subtitle">{subtitle}</p>}
          </div>
          {state && <StateBadge state={state} size="lg" />}
        </div>
        {actions && <div className="wc-infopage__actions">{actions}</div>}
      </div>

      {/* ── Tab bar ── */}
      {tabs.length > 0 && (
        <div className="wc-infopage__tabbar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`wc-infopage__tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab content ── */}
      <div className="wc-infopage__body">
        {activeContent ?? null}
      </div>
    </div>
  );
};

export default InfoPage;
