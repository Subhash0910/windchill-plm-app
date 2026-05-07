import React, { useState } from 'react';
import styles from './LifecycleDesignerPage.module.css';

/* ── Default PLM lifecycle data ─────────────────────────────────────────── */
const DEFAULT_STATES = [
  { id: 'INWORK',      label: 'In Work',       color: '#6366f1', description: 'Object is being authored. Editable by owner.' },
  { id: 'UNDERREVIEW', label: 'Under Review',  color: '#f59e0b', description: 'Submitted for review. Read-only to non-reviewers.' },
  { id: 'RELEASED',    label: 'Released',      color: '#22c55e', description: 'Approved and released. Immutable.' },
  { id: 'OBSOLETE',    label: 'Obsolete',      color: '#6b7280', description: 'No longer active. Archived.' },
];

const DEFAULT_TRANSITIONS = [
  { from: 'INWORK',      to: 'UNDERREVIEW', role: 'ENGINEER', action: 'submitForReview', label: 'Submit for Review' },
  { from: 'UNDERREVIEW', to: 'RELEASED',    role: 'MANAGER',  action: 'release',         label: 'Release' },
  { from: 'UNDERREVIEW', to: 'INWORK',      role: 'MANAGER',  action: 'reject',          label: 'Reject / Rework' },
  { from: 'RELEASED',    to: 'INWORK',      role: 'MANAGER',  action: 'revise',          label: 'Revise (New Iteration)' },
  { from: 'RELEASED',    to: 'OBSOLETE',    role: 'MANAGER',  action: 'obsolete',        label: 'Obsolete' },
];

const ROLES = ['VIEWER', 'ENGINEER', 'MANAGER', 'ADMIN'];
const ROLE_COLORS = { VIEWER: '#6b7280', ENGINEER: '#6366f1', MANAGER: '#f59e0b', ADMIN: '#ef4444' };

const EMPTY_STATE      = { id: '', label: '', color: '#6366f1', description: '' };
const EMPTY_TRANSITION = { from: '', to: '', role: 'ENGINEER', action: '', label: '' };

/* ── XML builder ────────────────────────────────────────────────────────── */
function buildLifecycleXml(states, transitions, name) {
  const sXml = states.map(s =>
    `  <state name="${s.id}" label="${s.label}">\n    <description>${s.description}</description>\n  </state>`
  ).join('\n');
  const tXml = transitions.map(t =>
    `  <transition from="${t.from}" to="${t.to}" action="${t.action}" label="${t.label}">\n    <requiredRole>${t.role}</requiredRole>\n  </transition>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!--\n  Open PLM Lifecycle Template\n  Name: ${name}\n  Generated: ${new Date().toISOString().split('T')[0]}\n-->\n<lifecycleTemplate xmlns="http://openplm.io/schema/lifecycle" version="1.0"\n                   name="${name}">\n\n  <!-- States -->\n${sXml}\n\n  <!-- Transitions -->\n${tXml}\n\n</lifecycleTemplate>\n`;
}

/* ── State node ─────────────────────────────────────────────────────────── */
const StateNode = ({ state, selected, onClick, onDelete, isDefault }) => (
  <div
    className={`${styles.stateNode} ${selected ? styles.stateNodeSelected : ''}`}
    style={{ '--state-color': state.color }}
    onClick={onClick}
  >
    <div className={styles.stateNodeDot} style={{ background: state.color }} />
    <div className={styles.stateNodeBody}>
      <div className={styles.stateNodeId}>{state.id}</div>
      <div className={styles.stateNodeLabel}>{state.label}</div>
    </div>
    {!isDefault && (
      <button className={styles.stateNodeDel} onClick={e => { e.stopPropagation(); onDelete(state.id); }} title="Remove state">×</button>
    )}
  </div>
);

/* ── Main page ──────────────────────────────────────────────────────────── */
const LifecycleDesignerPage = () => {
  const [templateName,  setTemplateName]  = useState('Part Lifecycle');
  const [states,        setStates]        = useState(DEFAULT_STATES);
  const [transitions,   setTransitions]   = useState(DEFAULT_TRANSITIONS);
  const [selectedState, setSelectedState] = useState(null);
  const [showStateForm, setShowStateForm] = useState(false);
  const [showTransForm, setShowTransForm] = useState(false);
  const [stateForm,     setStateForm]     = useState(EMPTY_STATE);
  const [transForm,     setTransForm]     = useState(EMPTY_TRANSITION);
  const [showXml,       setShowXml]       = useState(false);
  const [copied,        setCopied]        = useState(false);

  const xml = buildLifecycleXml(states, transitions, templateName);

  const addState = () => {
    if (!stateForm.id || !stateForm.label) return;
    if (states.find(s => s.id === stateForm.id.toUpperCase())) return;
    setStates(prev => [...prev, { ...stateForm, id: stateForm.id.toUpperCase() }]);
    setStateForm(EMPTY_STATE);
    setShowStateForm(false);
  };

  const removeState = (id) => {
    setStates(prev => prev.filter(s => s.id !== id));
    setTransitions(prev => prev.filter(t => t.from !== id && t.to !== id));
    if (selectedState?.id === id) setSelectedState(null);
  };

  const addTransition = () => {
    if (!transForm.from || !transForm.to || !transForm.action) return;
    if (transForm.from === transForm.to) return;
    setTransitions(prev => [...prev, { ...transForm, action: transForm.action.replace(/\s+/g, '') }]);
    setTransForm(EMPTY_TRANSITION);
    setShowTransForm(false);
  };

  const removeTransition = (i) => setTransitions(prev => prev.filter((_, idx) => idx !== i));

  const copyXml = () => { navigator.clipboard.writeText(xml).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  const downloadXml = () => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = `${templateName.replace(/\s+/g, '_').toLowerCase()}_lifecycle.xml`; a.click();
    URL.revokeObjectURL(url);
  };

  const stateTransitions = selectedState
    ? transitions.filter(t => t.from === selectedState.id || t.to === selectedState.id)
    : [];

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>🔄</div>
          <div>
            <h1 className={styles.title}>Lifecycle Designer</h1>
            <div className={styles.sub}>Define lifecycle states and valid transitions for PLM object types</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <input
            className={`wc-input ${styles.nameInput}`}
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            placeholder="Template name"
          />
          <button className="wc-btn" onClick={() => setShowXml(v => !v)}>
            {showXml ? '🙈 Hide XML' : '📄 View XML'}
          </button>
          <button className="wc-btn" onClick={downloadXml}>⬇ Export</button>
        </div>
      </div>

      {/* ── Concept banner ── */}
      <div className={styles.conceptBanner}>
        <span className={styles.conceptIcon}>📘</span>
        <div>
          <div className={styles.conceptTitle}>How PLM Lifecycles Work</div>
          <div className={styles.conceptText}>
            Every PLM object (Part, Document, ECR) moves through a defined set of lifecycle states.
            Transitions between states require specific roles and trigger business rules (notifications, locks, promotions).
            This template defines those states and transitions — equivalent to a lifecycle template file registered in the PLM system.
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>

        {/* ── Left: States ── */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>States <span className={styles.count}>{states.length}</span></div>
            <button className={`wc-btn wc-btn--primary ${styles.addBtn}`} onClick={() => setShowStateForm(v => !v)}>+ Add State</button>
          </div>

          {showStateForm && (
            <div className={styles.addForm}>
              <div className={styles.formRow}>
                <div className="wc-field">
                  <label className="wc-label">State ID (e.g. APPROVED)</label>
                  <input className="wc-input" value={stateForm.id} onChange={e => setStateForm(f => ({ ...f, id: e.target.value.toUpperCase() }))} placeholder="APPROVED" />
                </div>
                <div className="wc-field">
                  <label className="wc-label">Display Label</label>
                  <input className="wc-input" value={stateForm.label} onChange={e => setStateForm(f => ({ ...f, label: e.target.value }))} placeholder="Approved" />
                </div>
                <div className="wc-field">
                  <label className="wc-label">Color</label>
                  <input type="color" className={styles.colorPicker} value={stateForm.color} onChange={e => setStateForm(f => ({ ...f, color: e.target.value }))} />
                </div>
              </div>
              <div className="wc-field">
                <label className="wc-label">Description</label>
                <input className="wc-input" value={stateForm.description} onChange={e => setStateForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this state mean?" />
              </div>
              <div className={styles.formActions}>
                <button className="wc-btn" onClick={() => setShowStateForm(false)}>Cancel</button>
                <button className="wc-btn wc-btn--primary" onClick={addState}>Add State</button>
              </div>
            </div>
          )}

          <div className={styles.stateList}>
            {states.map(s => (
              <StateNode
                key={s.id}
                state={s}
                selected={selectedState?.id === s.id}
                isDefault={DEFAULT_STATES.some(d => d.id === s.id)}
                onClick={() => setSelectedState(selected => selected?.id === s.id ? null : s)}
                onDelete={removeState}
              />
            ))}
          </div>

          {selectedState && (
            <div className={styles.stateDetail}>
              <div className={styles.stateDetailTitle} style={{ color: selectedState.color }}>
                {selectedState.id} — {selectedState.label}
              </div>
              <div className={styles.stateDetailDesc}>{selectedState.description}</div>
              {stateTransitions.length > 0 ? (
                <div className={styles.stateTransList}>
                  {stateTransitions.map((t, i) => (
                    <div key={i} className={styles.stateTransItem}>
                      <span className={styles.stateTransDir}>{t.from === selectedState.id ? '→' : '←'}</span>
                      <span className={styles.stateTransState}>{t.from === selectedState.id ? t.to : t.from}</span>
                      <span className={styles.stateTransLabel}>{t.label}</span>
                      <span className={styles.rolePill} style={{ background: ROLE_COLORS[t.role] + '22', color: ROLE_COLORS[t.role] }}>{t.role}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noTrans}>No transitions involving this state yet.</div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Transitions ── */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>Transitions <span className={styles.count}>{transitions.length}</span></div>
            <button className={`wc-btn wc-btn--primary ${styles.addBtn}`} onClick={() => setShowTransForm(v => !v)}>+ Add Transition</button>
          </div>

          {showTransForm && (
            <div className={styles.addForm}>
              <div className={styles.formRow}>
                <div className="wc-field">
                  <label className="wc-label">From State</label>
                  <select className="wc-select" value={transForm.from} onChange={e => setTransForm(f => ({ ...f, from: e.target.value }))}>
                    <option value="">Select…</option>
                    {states.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                  </select>
                </div>
                <div className={styles.arrowSep}>→</div>
                <div className="wc-field">
                  <label className="wc-label">To State</label>
                  <select className="wc-select" value={transForm.to} onChange={e => setTransForm(f => ({ ...f, to: e.target.value }))}>
                    <option value="">Select…</option>
                    {states.filter(s => s.id !== transForm.from).map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                  </select>
                </div>
                <div className="wc-field">
                  <label className="wc-label">Min Role</label>
                  <select className="wc-select" value={transForm.role} onChange={e => setTransForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className="wc-field">
                  <label className="wc-label">Action Name (camelCase)</label>
                  <input className="wc-input" style={{ fontFamily: 'monospace' }} value={transForm.action} onChange={e => setTransForm(f => ({ ...f, action: e.target.value }))} placeholder="submitForReview" />
                </div>
                <div className="wc-field">
                  <label className="wc-label">Display Label</label>
                  <input className="wc-input" value={transForm.label} onChange={e => setTransForm(f => ({ ...f, label: e.target.value }))} placeholder="Submit for Review" />
                </div>
              </div>
              <div className={styles.formActions}>
                <button className="wc-btn" onClick={() => setShowTransForm(false)}>Cancel</button>
                <button className="wc-btn wc-btn--primary" onClick={addTransition}>Add Transition</button>
              </div>
            </div>
          )}

          <div className={styles.transTable}>
            <div className={styles.transTableHead}>
              <span>From</span><span></span><span>To</span><span>Action</span><span>Role</span><span></span>
            </div>
            {transitions.map((t, i) => {
              const fromState = states.find(s => s.id === t.from);
              const toState   = states.find(s => s.id === t.to);
              return (
                <div key={i} className={styles.transRow}>
                  <span className={styles.transState} style={{ color: fromState?.color || '#fff' }}>{t.from}</span>
                  <span className={styles.transArrow}>→</span>
                  <span className={styles.transState} style={{ color: toState?.color || '#fff' }}>{t.to}</span>
                  <code className={styles.transAction}>{t.action}</code>
                  <span className={styles.rolePill} style={{ background: ROLE_COLORS[t.role] + '22', color: ROLE_COLORS[t.role] }}>{t.role}</span>
                  <button className={styles.transDelBtn} onClick={() => removeTransition(i)} title="Remove">×</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Visual flow diagram ── */}
      <div className={styles.flowSection}>
        <div className={styles.sectionTitle}>State Flow Diagram</div>
        <div className={styles.flowDiagram}>
          {states.map((s, i) => {
            const outgoing = transitions.filter(t => t.from === s.id);
            return (
              <div key={s.id} className={styles.flowNode}>
                <div className={styles.flowStateBox} style={{ borderColor: s.color, boxShadow: `0 0 0 1px ${s.color}33` }}>
                  <div className={styles.flowStateDot} style={{ background: s.color }} />
                  <div>
                    <div className={styles.flowStateId} style={{ color: s.color }}>{s.id}</div>
                    <div className={styles.flowStateLabel}>{s.label}</div>
                  </div>
                </div>
                {outgoing.length > 0 && (
                  <div className={styles.flowEdges}>
                    {outgoing.map((t, j) => (
                      <div key={j} className={styles.flowEdge}>
                        <span className={styles.flowEdgeArrow} style={{ color: ROLE_COLORS[t.role] }}>→</span>
                        <span className={styles.flowEdgeTo}>{t.to}</span>
                        <span className={styles.flowEdgeAction}>{t.action}</span>
                        <span className={styles.rolePill} style={{ background: ROLE_COLORS[t.role] + '22', color: ROLE_COLORS[t.role], fontSize: '10px' }}>{t.role}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── XML panel ── */}
      {showXml && (
        <div className={styles.xmlSection}>
          <div className={styles.xmlHeader}>
            <div className={styles.sectionTitle}>Lifecycle Template XML</div>
            <div className={styles.xmlBtns}>
              <button className="wc-btn" onClick={copyXml}>{copied ? '✅ Copied' : '📋 Copy'}</button>
              <button className="wc-btn" onClick={downloadXml}>⬇ Download</button>
            </div>
          </div>
          <pre className={styles.xmlCode}>{xml}</pre>
        </div>
      )}

    </div>
  );
};

export default LifecycleDesignerPage;
