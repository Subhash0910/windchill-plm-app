import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/organisms/Header/Header';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { plmApi } from '../../services/plmApi';
import './DashboardPage.css';

const S_COLOR = {
  INWORK:      { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  UNDERREVIEW: { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  RELEASED:    { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  OBSOLETE:    { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
};
const S_ICON = { INWORK: '\uD83D\uDD27', UNDERREVIEW: '\uD83D\uDD0D', RELEASED: '\u2705', OBSOLETE: '\uD83D\uDEAB' };

const KPICard = ({ icon, label, value, sub, color, to, loading }) => {
  const navigate = useNavigate();
  return (
    <div
      className={`kpi-card kpi-card--${color}`}
      onClick={to ? () => navigate(to) : undefined}
      style={to ? { cursor: 'pointer' } : {}}
    >
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-body">
        <div className="kpi-value">
          {loading ? <span className="kpi-skeleton" /> : value}
        </div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      {to && <div className="kpi-arrow">&rarr;</div>}
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { selectedContextId, selectedContextName } = useContext(PlmWorkspaceContext);
  const navigate = useNavigate();

  const [parts,       setParts]       = useState([]);
  const [workItems,   setWorkItems]   = useState([]);
  const [ecrs,        setEcrs]        = useState([]);
  const [recentParts, setRecentParts] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!selectedContextId) { setLoading(false); return; }
    setLoading(true);
    Promise.allSettled([
      plmApi.listParts(selectedContextId),
      plmApi.listMyWorkItems(),
      plmApi.listEcrs(null),
    ]).then(([pR, wR, eR]) => {
      const p = pR.status === 'fulfilled' ? (pR.value || []) : [];
      const w = wR.status === 'fulfilled' ? (wR.value || []) : [];
      const e = eR.status === 'fulfilled' ? (eR.value?.data || eR.value || []) : [];
      setParts(p);
      setWorkItems(w);
      setEcrs(Array.isArray(e) ? e : []);
      setRecentParts([...p].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5));
    }).finally(() => setLoading(false));
  }, [selectedContextId]);

  const counts   = parts.reduce((a, p) => ({ ...a, [p.lifecycleState]: (a[p.lifecycleState] || 0) + 1 }), {});
  const pending  = counts['UNDERREVIEW'] || 0;  // parts in UNDERREVIEW (system-wide in context)
  const released = counts['RELEASED']    || 0;
  const inwork   = counts['INWORK']      || 0;
  const openEcrs = ecrs.filter(e => !['CLOSED', 'CANCELLED', 'REJECTED'].includes(e.status)).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { icon: '\u2699\uFE0F', label: 'Parts',          sub: `${parts.length} total`,       to: '/plm/parts',    color: 'blue'   },
    // sub shows tasks assigned TO ME — not system-wide parts in review
    { icon: '\uD83D\uDCCB', label: 'Worklist',        sub: `${workItems.length} task(s)`, to: '/plm/worklist', color: 'amber'  },
    { icon: '\uD83D\uDCDD', label: 'Changes',         sub: `${ecrs.length} ECRs`,         to: '/plm/changes',  color: 'purple' },
    { icon: '\u26A1',       label: 'Impact Analysis', sub: 'AI-powered',                  to: '/plm/ai-demo',  color: 'green'  },
  ];

  return (
    <div className="dashboard-page">
      <Header title="Dashboard" />
      <main className="dashboard-main">

        {/* ── Welcome Banner ── */}
        <div className="dashboard-welcome">
          <div className="welcome-text">
            <h1>{greeting()}, <span>{user?.fullName || user?.username || 'Engineer'}</span> \uD83D\uDC4B</h1>
            <p>
              {selectedContextId
                ? <>
                    Active context: <strong>{selectedContextName || selectedContextId}</strong>
                    &nbsp;\u00B7&nbsp;{parts.length} part(s)
                  </>
                : 'Select a context from the PLM workspace to see live data.'}
            </p>
          </div>
          <div className="welcome-actions">
            <span className="role-badge">{user?.role || 'VIEWER'}</span>
            <button className="btn-ghost" onClick={() => navigate('/plm/parts')}>Open Workspace \u2192</button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="kpi-grid">
          <KPICard icon="\u2699\uFE0F" label="Total Parts"
            value={parts.length}
            sub={selectedContextId ? selectedContextName : 'No context'}
            color="blue" to="/plm/parts" loading={loading} />

          {/*
            PENDING REVIEW = parts in UNDERREVIEW state (system-wide in this context).
            This is NOT your personal worklist. Links to /plm/parts so users see
            which parts are awaiting review, regardless of who the approver is.
          */}
          <KPICard icon="\uD83D\uDD0D" label="Pending Review"
            value={pending}
            sub={pending > 0 ? 'Parts awaiting review' : 'All clear \u2713'}
            color="amber" to="/plm/parts" loading={loading} />

          <KPICard icon="\u2705" label="Released Parts"
            value={released}
            sub={`${inwork} in work`}
            color="green" loading={loading} />

          <KPICard icon="\uD83D\uDCDD" label="Open ECRs"
            value={openEcrs}
            sub={`${ecrs.length} total`}
            color="purple" to="/plm/changes" loading={loading} />
        </div>

        {/* ── Body ── */}
        <div className="dashboard-body">

          {/* Lifecycle Breakdown */}
          <div className="dash-section">
            <h2 className="section-title">Lifecycle Breakdown</h2>
            {!selectedContextId ? (
              <div className="empty-state">
                <span>\uD83D\uDDC2\uFE0F</span>
                <p>Select a context to see part distribution</p>
                <button className="btn-primary" onClick={() => navigate('/plm/parts')}>Open Workspace</button>
              </div>
            ) : loading ? (
              <div className="skeleton-list">{[1,2,3,4].map(i => <div key={i} className="skeleton-row" />)}</div>
            ) : parts.length === 0 ? (
              <div className="empty-state">
                <span>\uD83D\uDCE6</span>
                <p>No parts in this context yet</p>
                <button className="btn-primary" onClick={() => navigate('/plm/parts')}>Create First Part</button>
              </div>
            ) : (
              <div className="lifecycle-bars">
                {['INWORK','UNDERREVIEW','RELEASED','OBSOLETE'].map(state => {
                  const count = counts[state] || 0;
                  const pct   = parts.length > 0 ? Math.round((count / parts.length) * 100) : 0;
                  const c     = S_COLOR[state];
                  return (
                    <div key={state} className="lc-bar-row">
                      <div className="lc-bar-label">
                        <span className="lc-dot" style={{ background: c.dot }} />
                        <span>{S_ICON[state]} {state}</span>
                      </div>
                      <div className="lc-bar-track">
                        <div className="lc-bar-fill" style={{ width: `${pct || 2}%`, background: c.dot }} />
                      </div>
                      <div className="lc-bar-count" style={{ color: c.dot }}>
                        {count} <span className="lc-pct">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right Column ── */}
          <div className="dash-right">

            {/* Quick Actions */}
            <div className="dash-section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="quick-actions">
                {quickActions.map((a, i) => (
                  <button key={i} className={`qa-btn qa-btn--${a.color}`} onClick={() => navigate(a.to)}>
                    <span className="qa-icon">{a.icon}</span>
                    <span className="qa-label">{a.label}</span>
                    <span className="qa-sub">{a.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Worklist alert — only shown when tasks are assigned TO this user */}
            {!loading && workItems.length > 0 && (
              <div className="dash-section dash-section--alert">
                <h2 className="section-title">\u26A0\uFE0F Pending Your Action</h2>
                <p className="alert-text">
                  You have <strong>{workItems.length}</strong> item(s) waiting for your approval.
                </p>
                <button className="btn-amber btn-sm" onClick={() => navigate('/plm/worklist')}>
                  Go to Worklist &rarr;
                </button>
              </div>
            )}

            {/* Recent Parts */}
            <div className="dash-section">
              <h2 className="section-title">Recent Parts</h2>
              {loading ? (
                <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-row" />)}</div>
              ) : recentParts.length === 0 ? (
                <div className="empty-state-sm">
                  No parts yet \u2014{' '}
                  <button className="link-btn" onClick={() => navigate('/plm/parts')}>create one</button>
                </div>
              ) : (
                <div className="recent-parts-list">
                  {recentParts.map(p => {
                    const c = S_COLOR[p.lifecycleState] || S_COLOR.INWORK;
                    return (
                      <div key={p.id} className="rp-row" onClick={() => navigate(`/plm/parts/${p.id}`)}>
                        <div className="rp-info">
                          <strong>{p.partNumber}</strong>
                          <span>{p.name || '\u2014'}</span>
                        </div>
                        <span className="rp-badge" style={{ background: c.bg, color: c.text }}>
                          {S_ICON[p.lifecycleState]} {p.lifecycleState}
                        </span>
                      </div>
                    );
                  })}
                  <button className="link-btn view-all" onClick={() => navigate('/plm/parts')}>
                    View all parts &rarr;
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
