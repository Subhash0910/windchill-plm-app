import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/organisms/Header/Header';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { plmApi } from '../../services/plmApi';
import './DashboardPage.css';

const S_COLOR = {
  INWORK:      { bg: 'var(--wc-state-inwork-bg)', text: 'var(--wc-state-inwork-text)', dot: 'var(--wc-text-muted)' },
  UNDERREVIEW: { bg: 'var(--wc-state-underreview-bg)', text: 'var(--wc-state-underreview-text)', dot: '#f59e0b' },
  RELEASED:    { bg: 'var(--wc-state-released-bg)', text: 'var(--wc-state-released-text)', dot: '#10b981' },
  OBSOLETE:    { bg: 'var(--wc-state-obsolete-bg)', text: 'var(--wc-state-obsolete-text)', dot: '#ef4444' },
};
const S_ICON = { INWORK: String.fromCodePoint(0x1F527), UNDERREVIEW: String.fromCodePoint(0x1F50D), RELEASED: '✅', OBSOLETE: String.fromCodePoint(0x1F6AB) };

const ECR_STATUS_COLOR = {
  DRAFT:     { bg: 'var(--wc-state-inwork-bg)', text: 'var(--wc-state-inwork-text)', dot: 'var(--wc-text-muted)',  label: 'Draft'      },
  SUBMITTED: { bg: 'var(--wc-state-underreview-bg)', text: 'var(--wc-state-underreview-text)', dot: '#3b82f6',  label: 'Submitted'  },
  IN_REVIEW: { bg: 'var(--wc-state-underreview-bg)', text: 'var(--wc-state-underreview-text)', dot: '#f59e0b',  label: 'In Review'  },
  APPROVED:  { bg: 'var(--wc-state-released-bg)', text: 'var(--wc-state-released-text)', dot: '#22c55e',  label: 'Approved'   },
  REJECTED:  { bg: 'var(--wc-state-obsolete-bg)', text: 'var(--wc-state-obsolete-text)', dot: '#ef4444',  label: 'Rejected'   },
  CLOSED:    { bg: 'var(--wc-state-inwork-bg)', text: 'var(--wc-state-inwork-text)', dot: '#d1d5db',  label: 'Closed'     },
};

const PRIORITY_META = {
  CRITICAL: { bg: 'var(--wc-state-obsolete-bg)', text: 'var(--wc-state-obsolete-text)' },
  HIGH:     { bg: 'var(--wc-state-underreview-bg)', text: 'var(--wc-state-underreview-text)' },
  NORMAL:   { bg: 'var(--wc-state-inwork-bg)', text: 'var(--wc-state-inwork-text)' },
  LOW:      { bg: 'var(--wc-state-inwork-bg)', text: 'var(--wc-text-muted)' },
};

const SHOWCASE_PILLARS = [
  {
    title: 'What this workspace teaches',
    text: 'Explore realistic parts, BOM, lifecycle, review, and change flows in a Windchill-inspired PLM environment.',
  },
  {
    title: 'Where AI helps',
    text: 'Use contextual guidance on parts, changes, and review work so AI supports decisions instead of narrating the whole screen.',
  },
  {
    title: 'What workflows are available',
    text: 'Browse contexts, inspect structures, review ECRs, and work through approval tasks with seeded demo data.',
  },
];

const AUDIENCE_TRACKS = [
  { title: 'First-time learner', text: 'Start with contexts, parts, lifecycle, and guided change flows.', to: '/plm/parts' },
  { title: 'Hiring manager', text: 'See the shell, workflow coverage, and how AI is embedded into PLM decisions.', to: '/plm/changes' },
  { title: 'Reviewer', text: 'Inspect how AI supports explainability, risk framing, and structured review decisions.', to: '/plm/ai-demo' },
];

// ── CountUp animation hook ─────────────────────────────────────────────────
const useCountUp = (target, duration = 800, start = true) => {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!start || target === undefined || target === null) {
      setValue(target ?? 0);
      return;
    }
    const num = Number(target) || 0;
    if (num === 0) { setValue(0); return; }
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * num));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, start]);

  return value;
};

const CountUp = ({ target, loading }) => {
  const animated = useCountUp(target, 800, !loading);
  if (loading) return <span className="kpi-skeleton" />;
  return <>{animated}</>;
};

// ── KPI Card ────────────────────────────────────────────────────────────────
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
          <CountUp target={value} loading={loading} />
        </div>
        <div className="kpi-label">{label}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      {to && <div className="kpi-arrow">&rarr;</div>}
    </div>
  );
};

// ── Dashboard ───────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuth();
  const { selectedContextId, selectedContextName } = useContext(PlmWorkspaceContext);
  const navigate = useNavigate();

  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!selectedContextId) {
      setLoading(false);
      setStats(null);
      return;
    }
    setLoading(true);
    setError(null);
    plmApi.getDashboardStats(selectedContextId)
      .then((data) => setStats(data))
      .catch((err) => { console.error('Dashboard stats error', err); setError(err); })
      .finally(() => setLoading(false));
  }, [selectedContextId]);

  // Destructure with defaults for safety
  const totalParts    = stats?.totalParts    ?? 0;
  const inWork        = stats?.inWork        ?? 0;
  const underReview   = stats?.underReview   ?? 0;
  const released      = stats?.released      ?? 0;
  const obsolete      = stats?.obsolete      ?? 0;
  const totalDocuments = stats?.totalDocuments ?? 0;
  const openEcrs      = stats?.openEcrs      ?? 0;
  const openEcos      = stats?.openEcos      ?? 0;
  const submittedEcrs = stats?.submittedEcrs ?? 0;
  const inReviewEcrs  = stats?.inReviewEcrs  ?? 0;
  const approvedThisWeek = stats?.approvedThisWeek ?? 0;
  const criticalOpen  = stats?.criticalOpen  ?? 0;
  const pendingWorkItems = stats?.pendingWorkItems ?? 0;
  const recentParts   = stats?.recentParts   ?? [];
  const recentEcrs    = stats?.recentEcrs    ?? [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { icon: '⚙️',  label: 'Parts',          sub: `${totalParts} total`,            to: '/plm/parts',    color: 'blue'   },
    { icon: String.fromCodePoint(0x1F4CB),  label: 'Worklist',        sub: `${pendingWorkItems} pending`,      to: '/plm/worklist', color: 'amber'  },
    { icon: String.fromCodePoint(0x1F4DD),  label: 'Changes',         sub: `${openEcrs} open ECRs`,            to: '/plm/changes',  color: 'purple' },
    { icon: '⚡',  label: 'Impact Analysis', sub: 'AI-powered',                       to: '/plm/ai-demo',  color: 'green'  },
  ];

  // ── No context selected ──────────────────────────────────────────────────
  if (!selectedContextId) {
    return (
      <div className="dashboard-page">
        <Header title="Dashboard" />
        <main className="dashboard-main">
          <div className="dashboard-welcome">
            <div className="welcome-text">
              <h1>
                {greeting()},{' '}
                <span>{user?.fullName || user?.username || 'Engineer'}</span>
                {' '}👋
              </h1>
              <p>
                This workspace is built to teach PLM concepts, guide structured review work, and feel like a coherent enterprise system.
              </p>
            </div>
            <div className="welcome-actions">
              <span className="role-badge">{user?.role || 'VIEWER'}</span>
              <button className="btn-ghost" onClick={() => navigate('/plm/parts')}>Open Workspace &rarr;</button>
            </div>
          </div>

          <section className="dashboard-story">
            <div className="dashboard-story__intro">
              <span className="dashboard-story__eyebrow">Public Alpha</span>
              <h2>Windchill-inspired workflows for learning and experimentation</h2>
              <p>
                This workspace is designed to feel operational, teach core PLM habits, and show where AI adds value in review-heavy workflows.
              </p>
            </div>
            <div className="dashboard-story__pillars">
              {SHOWCASE_PILLARS.map((item) => (
                <article key={item.title} className="story-card">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
            <div className="dashboard-story__tracks">
              {AUDIENCE_TRACKS.map((track) => (
                <button key={track.title} className="track-card" onClick={() => navigate(track.to)}>
                  <strong>{track.title}</strong>
                  <span>{track.text}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="empty-state" style={{ marginTop: 48, textAlign: 'center', padding: 64 }}>
            <span style={{ fontSize: 48 }}>{String.fromCodePoint(0x1F4CA)}</span>
            <h2 style={{ margin: '16px 0 8px', color: 'var(--wc-text-primary)' }}>Select a workspace to see your data</h2>
            <p style={{ color: 'var(--wc-text-secondary)', marginBottom: 24 }}>
              Choose a context from the sidebar to load your dashboard KPIs.
            </p>
            <button className="btn-primary" onClick={() => navigate('/plm/parts')}>
              Open Workspace &rarr;
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error && !loading && totalParts === 0 && totalDocuments === 0) {
    return (
      <div className="dashboard-page">
        <Header title="Dashboard" />
        <main className="dashboard-main">
          <div className="dashboard-welcome">
            <div className="welcome-text">
              <h1>{greeting()}, <span>{user?.fullName || user?.username || 'Engineer'}</span> {String.fromCodePoint(0x1F44B)}</h1>
              <p>Active context: <strong>{selectedContextName || selectedContextId}</strong></p>
            </div>
          </div>
          <div className="empty-state" style={{ textAlign: 'center', padding: 64 }}>
            <span style={{ fontSize: 48 }}>{'⚠️'}</span>
            <h2 style={{ margin: '16px 0 8px', color: 'var(--wc-text-primary)' }}>Could not load dashboard data</h2>
            <p style={{ color: 'var(--wc-text-secondary)', marginBottom: 24 }}>
              {error?.message || 'An unexpected error occurred.'}
            </p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Main dashboard with data ─────────────────────────────────────────────
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
              Public alpha focus: <strong>Windchill-inspired learning workflows with embedded AI</strong>
              &nbsp;&middot;&nbsp;Active context: <strong>{selectedContextName || selectedContextId}</strong>
            </p>
          </div>
          <div className="welcome-actions">
            <span className="role-badge">{user?.role || 'VIEWER'}</span>
            <button className="btn-ghost" onClick={() => navigate('/plm/parts')}>Open Workspace &rarr;</button>
          </div>
        </div>

        {/* KPI Row 1 — Parts + Documents + ECRs */}
        <section className="dashboard-story">
          <div className="dashboard-story__intro">
            <span className="dashboard-story__eyebrow">Public Alpha</span>
            <h2>Windchill-inspired workflows for learning and experimentation</h2>
            <p>
              This workspace is designed to feel operational, teach core PLM habits, and show where AI adds value in review-heavy workflows.
            </p>
          </div>
          <div className="dashboard-story__pillars">
            {SHOWCASE_PILLARS.map((item) => (
              <article key={item.title} className="story-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className="dashboard-story__tracks">
            {AUDIENCE_TRACKS.map((track) => (
              <button key={track.title} className="track-card" onClick={() => navigate(track.to)}>
                <strong>{track.title}</strong>
                <span>{track.text}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="kpi-grid">
          <KPICard icon={'⚙️'}  label="Total Parts"    value={totalParts}  sub={selectedContextName || 'Context'} color="blue"   to="/plm/parts"   loading={loading} />
          <KPICard icon={'\u{1F50D}'}  label="Under Review"   value={underReview}      sub={underReview > 0 ? 'Parts awaiting approval' : 'All clear ✓'}  color="amber"  to="/plm/parts"   loading={loading} />
          <KPICard icon={'✅'}  label="Released Parts" value={released}      sub={`${inWork} in work · ${totalDocuments} docs`}                                        color="green"                    loading={loading} />
          <KPICard icon={'\u{1F4DD}'}  label="Open ECRs"      value={openEcrs}      sub={`${submittedEcrs} submitted · ${openEcos} open ECOs`}                          color="purple" to="/plm/changes" loading={loading} />
        </div>

        {/* KPI Row 2 — ECR breakdown */}
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <KPICard icon={'\u{1F504}'} label="Submitted / Pending" value={submittedEcrs + inReviewEcrs}
            sub={`${submittedEcrs} submitted · ${inReviewEcrs} in review`}
            color="amber" to="/plm/changes" loading={loading} />
          <KPICard icon={'\u{1F50D}'} label="In Review"       value={inReviewEcrs}
            sub={inReviewEcrs > 0 ? 'Needs reviewer action' : 'None active'}
            color="amber" to="/plm/changes" loading={loading} />
          <KPICard icon={'✅'} label="Approved This Week" value={approvedThisWeek}
            sub="Last 7 days"
            color="green" to="/plm/changes" loading={loading} />
          <KPICard icon={'\u{1F534}'} label="Critical Open ECRs" value={criticalOpen}
            sub={criticalOpen > 0 ? 'Needs immediate attention' : 'None ✓'}
            color={criticalOpen > 0 ? 'red' : 'green'} to="/plm/changes" loading={loading} />
        </div>

        {/* Body */}
        <div className="dashboard-body">

          {/* LEFT COLUMN */}
          <div>
            {/* Part Lifecycle Breakdown */}
            <div className="dash-section">
              <h2 className="section-title">Part Lifecycle Breakdown</h2>
              {loading ? (
                <div className="skeleton-list">{[1,2,3,4].map(i => <div key={i} className="skeleton-row" />)}</div>
              ) : totalParts === 0 ? (
                <div className="empty-state"><span>{'\u{1F4E6}'}</span><p>No parts in this context yet</p>
                  <button className="btn-primary" onClick={() => navigate('/plm/parts')}>Create First Part</button></div>
              ) : (
                <div className="lifecycle-bars">
                  {['INWORK','UNDERREVIEW','RELEASED','OBSOLETE'].map(state => {
                    const count = state === 'INWORK' ? inWork
                                : state === 'UNDERREVIEW' ? underReview
                                : state === 'RELEASED' ? released
                                : obsolete;
                    const pct   = totalParts > 0 ? Math.round((count / totalParts) * 100) : 0;
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
              ) : openEcrs === 0 && submittedEcrs === 0 && inReviewEcrs === 0 && approvedThisWeek === 0 ? (
                <div className="empty-state"><span>{'\u{1F4DD}'}</span><p>No ECRs yet in this context</p>
                  <button className="btn-primary" onClick={() => navigate('/plm/changes')}>Create First ECR</button></div>
              ) : (
                <div className="lifecycle-bars">
                  {['DRAFT','SUBMITTED','IN_REVIEW','APPROVED','REJECTED','CLOSED'].map(status => {
                    // We don't have per-status counts from stats endpoint, but we can compute approximations
                    const count = status === 'SUBMITTED' ? submittedEcrs
                                : status === 'IN_REVIEW' ? inReviewEcrs
                                : 0; // DRAFT/APPROVED/REJECTED/CLOSED not separately counted in backend currently
                    if (count === 0 && !['SUBMITTED','IN_REVIEW'].includes(status)) return null;
                    const totalEcrRef = submittedEcrs + inReviewEcrs + (openEcrs || 0);
                    const pct = totalEcrRef > 0 ? Math.round((count / totalEcrRef) * 100) : 0;
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
                <h2 className="section-title">{'\u{1F50D}'} ECRs Need Review</h2>
                <p className="alert-text" style={{ color: '#4c1d95' }}>
                  <strong>{inReviewEcrs}</strong> ECR{inReviewEcrs !== 1 ? 's are' : ' is'} IN REVIEW awaiting a decision.
                  {criticalOpen > 0 && <> &nbsp;<strong style={{ color: 'var(--wc-state-obsolete-text)' }}>({criticalOpen} Critical)</strong></>}
                </p>
                <button className="btn-purple btn-sm" onClick={() => navigate('/plm/changes')}>Review ECRs &rarr;</button>
              </div>
            )}

            {/* Worklist Alert */}
            {!loading && pendingWorkItems > 0 && (
              <div className="dash-section dash-section--alert">
                <h2 className="section-title">{'⚠️'} Pending Your Action</h2>
                <p className="alert-text">You have <strong>{pendingWorkItems}</strong> item(s) waiting for your approval.</p>
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
