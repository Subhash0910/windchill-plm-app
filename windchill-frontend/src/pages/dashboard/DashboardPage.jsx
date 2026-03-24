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
const S_ICON = { INWORK: '🔧', UNDERREVIEW: '🔍', RELEASED: '✅', OBSOLETE: '🚫' };

const ECR_STATUS_COLOR = {
  DRAFT:     { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af',  label: 'Draft'      },
  SUBMITTED: { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6',  label: 'Submitted'  },
  IN_REVIEW: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b',  label: 'In Review'  },
  APPROVED:  { bg: '#dcfce7', text: '#166534', dot: '#22c55e',  label: 'Approved'   },
  REJECTED:  { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444',  label: 'Rejected'   },
  CLOSED:    { bg: '#e5e7eb', text: '#6b7280', dot: '#d1d5db',  label: 'Closed'     },
};

const PRIORITY_META = {
  CRITICAL: { bg: '#fee2e2', text: '#991b1b' },
  HIGH:     { bg: '#ffedd5', text: '#9a3412' },
  NORMAL:   { bg: '#e0f2fe', text: '#075985' },
  LOW:      { bg: '#f3f4f6', text: '#6b7280' },
};

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
      plmApi.listEcrs(selectedContextId, undefined),
    ]).then(([pR, wR, eR]) => {
      const p    = pR.status === 'fulfilled' ? (Array.isArray(pR.value) ? pR.value : []) : [];
      const w    = wR.status === 'fulfilled' ? (Array.isArray(wR.value) ? wR.value : []) : [];
      const rawE = eR.status === 'fulfilled' ? (Array.isArray(eR.value) ? eR.value : (eR.value?.data ?? [])) : [];
      const e    = Array.isArray(rawE) ? rawE : [];
      setParts(p);
      setWorkItems(w);
      setEcrs(e);
      setRecentParts([...p].sort((x, y) => (y.id || 0) - (x.id || 0)).slice(0, 5));
    }).finally(() => setLoading(false));
  }, [selectedContextId]);

  // ── Part lifecycle counts ──
  const counts      = parts.reduce((acc, p) => ({ ...acc, [p.lifecycleState]: (acc[p.lifecycleState] || 0) + 1 }), {});
  const underRev    = counts['UNDERREVIEW'] || 0;
  const released    = counts['RELEASED']    || 0;
  const inwork      = counts['INWORK']      || 0;

  // ── ECR derived counts ──
  const ecrByStatus     = ecrs.reduce((acc, e) => ({ ...acc, [e.status]: (acc[e.status] || 0) + 1 }), {});
  const openEcrs        = ecrs.filter(e => !['CLOSED', 'REJECTED'].includes(e.status)).length;
  const inReviewEcrs    = ecrByStatus['IN_REVIEW']  || 0;
  const submittedEcrs   = ecrByStatus['SUBMITTED']  || 0;
  const criticalEcrs    = ecrs.filter(e => e.priority === 'CRITICAL' && !['CLOSED','REJECTED'].includes(e.status)).length;
  const oneWeekAgo      = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const approvedThisWeek= ecrs.filter(e => e.status === 'APPROVED' && e.reviewedAt && new Date(e.reviewedAt).getTime() > oneWeekAgo).length;
  const recentEcrs      = [...ecrs].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { icon: '⚙️',  label: 'Parts',          sub: `${parts.length} total`,           to: '/plm/parts',    color: 'blue'   },
    { icon: '📋',  label: 'Worklist',        sub: `${workItems.length} pending`,      to: '/plm/worklist', color: 'amber'  },
    { icon: '📝',  label: 'Changes',         sub: `${ecrs.length} ECRs`,              to: '/plm/changes',  color: 'purple' },
    { icon: '⚡',  label: 'Impact Analysis', sub: 'AI-powered',                       to: '/plm/ai-demo',  color: 'green'  },
  ];

  return (
    <div className="dashboard-page">
      <Header title="Dashboard" />
      <main className="dashboard-main">

        {/* Welcome Banner */}
        <div className="dashboard-welcome">
          <div className="welcome-text">
            <h1>
              {greeting()},{' '}
              <span>{user?.fullName || user?.username || 'Engineer'}</span>
              {' '}👋
            </h1>
            <p>
              {selectedContextId
                ? <>
                    Active context: <strong>{selectedContextName || selectedContextId}</strong>
                    &nbsp;&middot;&nbsp;{parts.length} part(s) &middot; {ecrs.length} ECR(s)
                  </>
                : 'Select a context from the PLM workspace to see live data.'}
            </p>
          </div>
          <div className="welcome-actions">
            <span className="role-badge">{user?.role || 'VIEWER'}</span>
            <button className="btn-ghost" onClick={() => navigate('/plm/parts')}>Open Workspace &rarr;</button>
          </div>
        </div>

        {/* KPI Row 1 — Parts */}
        <div className="kpi-grid">
          <KPICard icon="⚙️"  label="Total Parts"    value={parts.length}  sub={selectedContextId ? selectedContextName : 'No context'} color="blue"   to="/plm/parts"   loading={loading} />
          <KPICard icon="🔍"  label="Under Review"   value={underRev}      sub={underRev > 0 ? 'Parts awaiting approval' : 'All clear ✓'}  color="amber"  to="/plm/parts"   loading={loading} />
          <KPICard icon="✅"  label="Released Parts" value={released}      sub={`${inwork} in work`}                                        color="green"                    loading={loading} />
          <KPICard icon="📝"  label="Open ECRs"      value={openEcrs}      sub={`${ecrs.length} total in context`}                          color="purple" to="/plm/changes" loading={loading} />
        </div>

        {/* KPI Row 2 — ECR breakdown */}
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <KPICard icon="🔄" label="Submitted / Pending" value={submittedEcrs + inReviewEcrs}
            sub={`${submittedEcrs} submitted · ${inReviewEcrs} in review`}
            color="amber" to="/plm/changes" loading={loading} />
          <KPICard icon="🔍" label="In Review"       value={inReviewEcrs}
            sub={inReviewEcrs > 0 ? 'Needs reviewer action' : 'None active'}
            color="amber" to="/plm/changes" loading={loading} />
          <KPICard icon="✅" label="Approved This Week" value={approvedThisWeek}
            sub="Last 7 days"
            color="green" to="/plm/changes" loading={loading} />
          <KPICard icon="🔴" label="Critical Open ECRs" value={criticalEcrs}
            sub={criticalEcrs > 0 ? 'Needs immediate attention' : 'None ✓'}
            color={criticalEcrs > 0 ? 'red' : 'green'} to="/plm/changes" loading={loading} />
        </div>

        {/* Body */}
        <div className="dashboard-body">

          {/* LEFT COLUMN */}
          <div>
            {/* Part Lifecycle Breakdown */}
            <div className="dash-section">
              <h2 className="section-title">Part Lifecycle Breakdown</h2>
              {!selectedContextId ? (
                <div className="empty-state"><span>🗂️</span><p>Select a context to see part distribution</p>
                  <button className="btn-primary" onClick={() => navigate('/plm/parts')}>Open Workspace</button></div>
              ) : loading ? (
                <div className="skeleton-list">{[1,2,3,4].map(i => <div key={i} className="skeleton-row" />)}</div>
              ) : parts.length === 0 ? (
                <div className="empty-state"><span>📦</span><p>No parts in this context yet</p>
                  <button className="btn-primary" onClick={() => navigate('/plm/parts')}>Create First Part</button></div>
              ) : (
                <div className="lifecycle-bars">
                  {['INWORK','UNDERREVIEW','RELEASED','OBSOLETE'].map(state => {
                    const count = counts[state] || 0;
                    const pct   = parts.length > 0 ? Math.round((count / parts.length) * 100) : 0;
                    const c     = S_COLOR[state];
                    return (
                      <div key={state} className="lc-bar-row">
                        <div className="lc-bar-label"><span className="lc-dot" style={{ background: c.dot }} /><span>{S_ICON[state]} {state}</span></div>
                        <div className="lc-bar-track"><div className="lc-bar-fill" style={{ width: `${pct || 2}%`, background: c.dot }} /></div>
                        <div className="lc-bar-count" style={{ color: c.dot }}>{count} <span className="lc-pct">({pct}%)</span></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ECR Status Breakdown */}
            <div className="dash-section">
              <h2 className="section-title">ECR Status Breakdown</h2>
              {loading ? (
                <div className="skeleton-list">{[1,2,3,4].map(i => <div key={i} className="skeleton-row" />)}</div>
              ) : ecrs.length === 0 ? (
                <div className="empty-state"><span>📝</span><p>No ECRs yet in this context</p>
                  <button className="btn-primary" onClick={() => navigate('/plm/changes')}>Create First ECR</button></div>
              ) : (
                <div className="lifecycle-bars">
                  {['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','REJECTED','CLOSED'].map(status => {
                    const count = ecrByStatus[status] || 0;
                    if (count === 0) return null;
                    const pct = ecrs.length > 0 ? Math.round((count / ecrs.length) * 100) : 0;
                    const c   = ECR_STATUS_COLOR[status];
                    return (
                      <div key={status} className="lc-bar-row">
                        <div className="lc-bar-label"><span className="lc-dot" style={{ background: c.dot }} /><span>{c.label}</span></div>
                        <div className="lc-bar-track"><div className="lc-bar-fill" style={{ width: `${pct || 2}%`, background: c.dot }} /></div>
                        <div className="lc-bar-count" style={{ color: c.dot }}>{count} <span className="lc-pct">({pct}%)</span></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="dash-right">

            {/* Quick Actions */}
            <div className="dash-section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="quick-actions">
                {quickActions.map((action, i) => (
                  <button key={i} className={`qa-btn qa-btn--${action.color}`} onClick={() => navigate(action.to)}>
                    <span className="qa-icon">{action.icon}</span>
                    <span className="qa-label">{action.label}</span>
                    <span className="qa-sub">{action.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In-Review ECR Alert */}
            {!loading && inReviewEcrs > 0 && (
              <div className="dash-section dash-section--ecr-alert">
                <h2 className="section-title">🔍 ECRs Need Review</h2>
                <p className="alert-text" style={{ color: '#4c1d95' }}>
                  <strong>{inReviewEcrs}</strong> ECR{inReviewEcrs !== 1 ? 's are' : ' is'} IN REVIEW awaiting a decision.
                  {criticalEcrs > 0 && <> &nbsp;<strong style={{ color: '#991b1b' }}>({criticalEcrs} Critical)</strong></>}
                </p>
                <button className="btn-purple btn-sm" onClick={() => navigate('/plm/changes')}>Review ECRs &rarr;</button>
              </div>
            )}

            {/* Worklist Alert */}
            {!loading && workItems.length > 0 && (
              <div className="dash-section dash-section--alert">
                <h2 className="section-title">⚠️ Pending Your Action</h2>
                <p className="alert-text">You have <strong>{workItems.length}</strong> item(s) waiting for your approval.</p>
                <button className="btn-amber btn-sm" onClick={() => navigate('/plm/worklist')}>Go to Worklist &rarr;</button>
              </div>
            )}

            {/* Recent ECRs */}
            <div className="dash-section">
              <h2 className="section-title">Recent ECRs</h2>
              {loading ? (
                <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-row" />)}</div>
              ) : recentEcrs.length === 0 ? (
                <div className="empty-state-sm">No ECRs yet &mdash;{' '}
                  <button className="link-btn" onClick={() => navigate('/plm/changes')}>create one</button></div>
              ) : (
                <div className="ecr-recent-list">
                  {recentEcrs.map(ecr => {
                    const sc = ECR_STATUS_COLOR[ecr.status]  || ECR_STATUS_COLOR.DRAFT;
                    const pc = PRIORITY_META[ecr.priority]   || PRIORITY_META.NORMAL;
                    return (
                      <div key={ecr.id} className="ecr-recent-row" onClick={() => navigate(`/plm/changes/ecr/${ecr.id}`)}>
                        <div className="ecr-recent-info">
                          <strong className="mono">{ecr.changeNumber}</strong>
                          <span>{ecr.title}</span>
                        </div>
                        <div className="ecr-recent-pills">
                          <span className="ecr-recent-pill" style={{ background: pc.bg, color: pc.text }}>{ecr.priority}</span>
                          <span className="ecr-recent-pill" style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
                        </div>
                      </div>
                    );
                  })}
                  <button className="link-btn view-all" onClick={() => navigate('/plm/changes')}>View all ECRs &rarr;</button>
                </div>
              )}
            </div>

            {/* Recent Parts */}
            <div className="dash-section">
              <h2 className="section-title">Recent Parts</h2>
              {loading ? (
                <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-row" />)}</div>
              ) : recentParts.length === 0 ? (
                <div className="empty-state-sm">No parts yet &mdash;{' '}
                  <button className="link-btn" onClick={() => navigate('/plm/parts')}>create one</button></div>
              ) : (
                <div className="recent-parts-list">
                  {recentParts.map(p => {
                    const c = S_COLOR[p.lifecycleState] || S_COLOR.INWORK;
                    return (
                      <div key={p.id} className="rp-row" onClick={() => navigate(`/plm/parts/${p.id}`)}>
                        <div className="rp-info"><strong>{p.partNumber}</strong><span>{p.name || '—'}</span></div>
                        <span className="rp-badge" style={{ background: c.bg, color: c.text }}>{S_ICON[p.lifecycleState]} {p.lifecycleState}</span>
                      </div>
                    );
                  })}
                  <button className="link-btn view-all" onClick={() => navigate('/plm/parts')}>View all parts &rarr;</button>
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
