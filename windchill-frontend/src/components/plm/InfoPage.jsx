import React from 'react';
import './InfoPage.css';

/**
 * InfoPage  —  Windchill-style object information panel.
 *
 * Props:
 *   title    {string}            — object type label e.g. "Part", "Document"
 *   subtitle {string | node}     — object identity e.g. "PLM-001 — Engine Mount"
 *   badge    {{ label, variant }} — lifecycle badge; variant matches CSS map
 *   actions  {ReactNode[]}       — toolbar buttons (Check Out, Revise, etc.)
 *   rows     {{ label, value, mono }[]} — attribute grid rows
 *   children                     — tab panels etc.
 *
 * Usage:
 *   <InfoPage
 *     title="Part"
 *     subtitle={`${part.partNumber} — ${part.name}`}
 *     badge={{ label: part.lifecycleState, variant: part.lifecycleState }}
 *     actions={[<Button>Check Out</Button>]}
 *     rows={[
 *       { label: 'Part Number', value: part.partNumber, mono: true },
 *       { label: 'Version',     value: `${part.revision}.${part.iteration}`, mono: true },
 *       { label: 'State',       value: part.lifecycleState },
 *       { label: 'Checked Out By', value: part.checkedOutBy || '—' },
 *     ]}
 *   >
 *     {tabContent}
 *   </InfoPage>
 */

const BADGE_COLORS = {
  inwork:      { bg: '#dbeafe', color: '#1d4ed8' },
  underreview: { bg: '#fef3c7', color: '#92400e' },
  released:    { bg: '#dcfce7', color: '#15803d' },
  obsolete:    { bg: '#f3f4f6', color: '#6b7280' },
  checkedout:  { bg: '#fce7f3', color: '#9d174d' },
};

export const InfoBadge = ({ label, variant }) => {
  const key = (variant || label || '').toLowerCase().replace(/[\s_]/g, '');
  const s   = BADGE_COLORS[key] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span className="info-badge" style={{ background: s.bg, color: s.color }}>
      {label}
    </span>
  );
};

export const InfoRow = ({ label, value, mono }) => (
  <div className="info-row">
    <span className="info-row-label">{label}</span>
    <span className={`info-row-value${mono ? ' mono' : ''}`}>{value ?? '—'}</span>
  </div>
);

const InfoPage = ({ title, subtitle, badge, actions, rows, children }) => (
  <div className="info-page">
    {/* Object header bar */}
    <div className="info-head">
      <div className="info-head-left">
        {title && <div className="info-type-label">{title}</div>}
        <div className="info-title">
          {subtitle}
          {badge && <InfoBadge label={badge.label} variant={badge.variant} />}
        </div>
      </div>
      {actions && actions.length > 0 && (
        <div className="info-actions">{actions}</div>
      )}
    </div>

    {/* Attribute grid */}
    {rows && rows.length > 0 && (
      <div className="info-attrs">
        {rows.map((r, i) => (
          <InfoRow key={i} label={r.label} value={r.value} mono={r.mono} />
        ))}
      </div>
    )}

    {/* Tab / panel content */}
    {children && <div className="info-body">{children}</div>}
  </div>
);

export default InfoPage;
