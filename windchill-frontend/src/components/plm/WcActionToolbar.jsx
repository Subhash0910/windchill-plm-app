import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import './WcActionToolbar.css';

/**
 * WcActionToolbar — Dynamic Windchill-style action toolbar.
 *
 * Loads registered actions for objectType from the action model registry
 * and renders them as a proper Windchill toolbar. Primary actions appear
 * as visible buttons; Secondary/Overflow go into a "More Actions" dropdown.
 *
 * Props:
 *   objectType   — "PART" | "ECR" | "ECO" | "DOCUMENT"
 *   objectId     — the PLM object id (used in breadcrumb / navigate)
 *   currentState — lifecycle state (used for enabledStates filtering)
 *   onAction     — (actionName, actionMeta) => void — called on button click
 *   loading      — pass-through loading flag (disables all buttons)
 *   extraActions — [{icon, label, onClick, variant, section}] injected from parent
 */
const WcActionToolbar = ({
  objectType,
  objectId,
  currentState,
  onAction,
  loading = false,
  extraActions = [],
}) => {
  const navigate = useNavigate();
  const [actions,      setActions]      = useState([]);
  const [actionsLoaded,setActionsLoaded]= useState(false);
  const [moreOpen,     setMoreOpen]     = useState(false);
  const moreRef = useRef(null);

  /* ── Load actions from registry ── */
  useEffect(() => {
    if (!objectType) return;
    plmApi.listActionModels(objectType)
      .then(data => setActions(Array.isArray(data) ? data : []))
      .catch(() => setActions([]))
      .finally(() => setActionsLoaded(true));
  }, [objectType]);

  /* ── Close "More" dropdown on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── State filter ── */
  const isActionEnabled = (action) => {
    if (!action.enabledStates) return true;
    if (!currentState) return true;
    return action.enabledStates
      .split(',')
      .map(s => s.trim().toUpperCase())
      .includes(currentState.toUpperCase());
  };

  /* ── Merge registry + extra actions ── */
  const allActions = [
    ...actions.map(a => ({
      key:      a.actionName,
      icon:     a.icon,
      label:    a.label,
      section:  a.toolbarSection || 'PRIMARY',
      enabled:  isActionEnabled(a),
      variant:  variantForAction(a.actionName),
      onClick:  () => onAction && onAction(a.actionName, a),
      meta:     a,
    })),
    ...extraActions.map((e, i) => ({
      key:     `extra-${i}`,
      icon:    e.icon,
      label:   e.label,
      section: e.section || 'SECONDARY',
      enabled: e.enabled !== false,
      variant: e.variant || 'default',
      onClick: e.onClick,
      meta:    null,
    })),
  ];

  const primary   = allActions.filter(a => a.section === 'PRIMARY');
  const secondary = allActions.filter(a => a.section === 'SECONDARY' || a.section === 'OVERFLOW');

  /* ── Render ── */
  return (
    <div className="wc-action-toolbar" role="toolbar" aria-label="Object actions">
      {/* ── Type badge ── */}
      <div className="wc-action-toolbar__type">
        {OBJECT_TYPE_META[objectType]?.icon || '📦'}{' '}
        <span>{OBJECT_TYPE_META[objectType]?.label || objectType}</span>
      </div>

      <div className="wc-action-toolbar__divider" />

      {/* ── Primary action buttons ── */}
      <div className="wc-action-toolbar__primary">
        {!actionsLoaded && (
          <div className="wc-action-toolbar__loading">
            <span className="wc-spinner wc-spinner--sm" />
          </div>
        )}

        {actionsLoaded && primary.map(a => (
          <ToolbarButton
            key={a.key}
            icon={a.icon}
            label={a.label}
            variant={a.variant}
            enabled={a.enabled}
            loading={loading}
            onClick={a.onClick}
          />
        ))}
      </div>

      <div className="wc-spacer" />

      {/* ── More actions dropdown ── */}
      {secondary.length > 0 && (
        <div className="wc-action-toolbar__more" ref={moreRef}>
          <button
            className="wc-action-toolbar__more-btn"
            onClick={() => setMoreOpen(o => !o)}
            aria-expanded={moreOpen}
            disabled={loading}
          >
            More Actions
            <span className={`wc-action-toolbar__more-arrow ${moreOpen ? 'open' : ''}`}>▾</span>
          </button>

          {moreOpen && (
            <div className="wc-action-toolbar__dropdown" role="menu">
              {secondary.map(a => (
                <button
                  key={a.key}
                  className={`wc-action-toolbar__dropdown-item ${!a.enabled ? 'disabled' : ''}`}
                  disabled={!a.enabled || loading}
                  onClick={() => { setMoreOpen(false); a.onClick(); }}
                  role="menuitem"
                >
                  <span className="wc-action-toolbar__dropdown-icon">{a.icon}</span>
                  <span>{a.label}</span>
                  {!a.enabled && <span className="wc-action-toolbar__disabled-reason">N/A in {currentState}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Separator + Customize link ── */}
      <div className="wc-action-toolbar__divider" />
      <button
        className="wc-action-toolbar__customize"
        onClick={() => navigate('/plm/admin/actions')}
        title="Open Action Model Registry"
      >
        ⚙ Customize
      </button>
    </div>
  );
};

/* ── Toolbar action button ─────────────────────────────────────────────── */
const ToolbarButton = ({ icon, label, variant, enabled, loading, onClick }) => (
  <button
    className={`wc-action-toolbar__btn wc-action-toolbar__btn--${variant} ${!enabled ? 'wc-action-toolbar__btn--disabled' : ''}`}
    disabled={!enabled || loading}
    onClick={onClick}
    title={!enabled ? `Not available in current lifecycle state` : label}
  >
    <span className="wc-action-toolbar__btn-icon">{icon}</span>
    <span className="wc-action-toolbar__btn-label">{label}</span>
  </button>
);

/* ── Helpers ── */
const OBJECT_TYPE_META = {
  PART:     { icon: '⚙️', label: 'Part' },
  ECR:      { icon: '📋', label: 'Change Request' },
  ECO:      { icon: '📝', label: 'Change Order' },
  DOCUMENT: { icon: '📄', label: 'Document' },
  WORKITEM: { icon: '✅', label: 'Work Item' },
};

function variantForAction(name) {
  if (!name) return 'default';
  const n = name.toLowerCase();
  if (n.includes('checkout') || n.includes('checkin'))   return 'checkout';
  if (n.includes('release')  || n.includes('approve'))   return 'success';
  if (n.includes('reject')   || n.includes('obsolete'))  return 'danger';
  if (n.includes('submit')   || n.includes('review'))    return 'primary';
  if (n.includes('revise')   || n.includes('newrev'))    return 'revise';
  if (n.includes('ai')       || n.includes('impact'))    return 'ai';
  return 'default';
}

export default WcActionToolbar;
