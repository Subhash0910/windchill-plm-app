import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import ContextualInsightPanel from '../../components/ai/ContextualInsightPanel';
import StateBadge from '../../components/plm/StateBadge';
import { plmApi } from '../../services/plmApi';
import { aiService } from '../../services/aiService';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import styles from './EcrDetailPage.module.css';

const TAB = {
  DETAILS: 'DETAILS',
  TASKS: 'TASKS',
  INSIGHTS: 'INSIGHTS',
};

const ROLE_MODE = {
  APPROVERS: 'APPROVERS',
  ALL: 'ALL',
};

const APPROVER_ROLES = new Set(['ADMIN', 'MANAGER', 'APPROVER']);

const safeJson = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const Pill = ({ value, type }) => {
  const v = String(value || '').toUpperCase();
  
  if (type === 'risk') {
    let riskClass = styles.riskLow;
    if (v.includes('HIGH')) riskClass = styles.riskHigh;
    else if (v.includes('MED')) riskClass = styles.riskMed;
    
    return <span className={`wc-state-badge ${riskClass}`}>{v || '-'}</span>;
  }

  // Use StateBadge for status
  return <StateBadge state={value} size="sm" />;
};

const isReleased = (rootState) => String(rootState || '').toUpperCase() === 'RELEASED';

const EcrDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedContextId } = useContext(PlmWorkspaceContext);

  const [activeTab, setActiveTab] = useState(TAB.INSIGHTS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [details, setDetails] = useState(null);
  const [insights, setInsights] = useState(null);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewSummaryLoading, setReviewSummaryLoading] = useState(false);
  const [reviewSummaryError, setReviewSummaryError] = useState('');

  const [recomputeLoading, setRecomputeLoading] = useState(false);

  // Reviewer picker (Windchill-ish)
  const [memberLoading, setMemberLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [roleMode, setRoleMode] = useState(ROLE_MODE.APPROVERS);
  const [reviewers, setReviewers] = useState([]); // usernames
  const [reviewerQuery, setReviewerQuery] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [reviewersCsv, setReviewersCsv] = useState('');

  const dropdownRef = useRef(null);

  const ecr = details?.ecr;
  const tasks = details?.tasks || [];
  const ecn = details?.ecn;

  const impact = insights?.impact;
  const report = impact?.report;
  const factors = useMemo(() => safeJson(report?.factorsJson), [report?.factorsJson]);

  const isDraft = useMemo(() => String(ecr?.status || '').toUpperCase() === 'DRAFT', [ecr?.status]);

  const load = async () => {
    setLoading(true);
    setError('');
    setReviewSummaryLoading(true);
    try {
      const [d, i, summary] = await Promise.all([
        plmApi.getEcrDetails(id),
        plmApi.getEcrInsights(id),
        aiService.getEcrReviewSummary(id).catch(() => null),
      ]);
      setDetails(d || null);
      setInsights(i || null);
      setReviewSummary(summary || i?.contextual || null);
      setReviewSummaryError('');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load ECR');
      setDetails(null);
      setInsights(null);
      setReviewSummary(null);
    } finally {
      setReviewSummaryLoading(false);
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!selectedContextId) {
      setMembers([]);
      return;
    }
    setMemberLoading(true);
    try {
      const data = await plmApi.listContextMembers(selectedContextId);
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      setMembers([]);
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!isDraft) return;
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContextId, isDraft]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) {
        // click outside
        setReviewerQuery('');
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const recompute = async () => {
    setRecomputeLoading(true);
    setError('');
    setReviewSummaryLoading(true);
    try {
      await plmApi.analyzeEcr(id);
      const [i, summary] = await Promise.all([
        plmApi.getEcrInsights(id),
        aiService.getEcrReviewSummary(id).catch(() => null),
      ]);
      setInsights(i || null);
      setReviewSummary(summary || i?.contextual || null);
      setReviewSummaryError('');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Recompute failed');
    } finally {
      setReviewSummaryLoading(false);
      setRecomputeLoading(false);
    }
  };

  const normalizedReviewers = useMemo(() => {
    const seen = new Set();
    const out = [];
    (reviewers || []).forEach((r) => {
      const t = String(r || '').trim();
      if (!t) return;
      const k = t.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      out.push(t);
    });
    return out;
  }, [reviewers]);

  const memberByUsername = useMemo(() => {
    const map = new Map();
    (members || []).forEach((m) => {
      const u = String(m.username || '').trim();
      if (!u) return;
      map.set(u.toLowerCase(), m);
    });
    return map;
  }, [members]);

  const reviewerPreview = useMemo(() => {
    return normalizedReviewers.map((u) => {
      const m = memberByUsername.get(String(u).toLowerCase());
      return {
        username: u,
        inTeam: !!m,
        role: m?.role,
        fullName: m?.fullName,
        email: m?.email,
      };
    });
  }, [normalizedReviewers, memberByUsername]);

  const parseCsv = (csv) => {
    const raw = String(csv || '')
      .split(/[,\n\r]+/g)
      .map((s) => s.trim())
      .filter(Boolean);
    const seen = new Set();
    const out = [];
    raw.forEach((r) => {
      const k = r.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      out.push(r);
    });
    return out;
  };

  const addReviewer = (username) => {
    const t = String(username || '').trim();
    if (!t) return;
    setReviewers((prev) => [...(prev || []), t]);
    setReviewerQuery('');
  };

  const removeReviewer = (username) => {
    const k = String(username || '').toLowerCase();
    setReviewers((prev) => (prev || []).filter((r) => String(r || '').toLowerCase() !== k));
  };

  const filteredMembers = useMemo(() => {
    const q = String(reviewerQuery || '').trim().toLowerCase();
    if (!q) return [];

    const already = new Set(normalizedReviewers.map((r) => r.toLowerCase()));

    return (members || [])
      .filter((m) => {
        const role = String(m.role || '').toUpperCase();
        if (roleMode === ROLE_MODE.APPROVERS && !APPROVER_ROLES.has(role)) return false;

        const u = String(m.username || '').toLowerCase();
        const e = String(m.email || '').toLowerCase();
        const f = String(m.fullName || '').toLowerCase();
        const hit = u.includes(q) || e.includes(q) || f.includes(q);
        if (!hit) return false;
        if (already.has(u)) return false;
        return true;
      })
      .slice(0, 8);
  }, [members, reviewerQuery, normalizedReviewers, roleMode]);

  const canAddFreeText = useMemo(() => {
    const t = String(reviewerQuery || '').trim();
    if (!t) return false;
    const already = new Set(normalizedReviewers.map((r) => r.toLowerCase()));
    return !already.has(t.toLowerCase());
  }, [reviewerQuery, normalizedReviewers]);

  const submit = async () => {
    const adv = showAdvanced ? parseCsv(reviewersCsv) : [];
    const finalReviewers = [...normalizedReviewers, ...adv];

    if (!finalReviewers.length) {
      setError('Add at least one reviewer (use the picker or CSV).');
      return;
    }

    setSubmitLoading(true);
    setError('');
    try {
      await plmApi.submitEcr(id, { reviewers: finalReviewers });
      await load();
      setActiveTab(TAB.TASKS);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Submit failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const TabBtn = ({ tab, children }) => (
    <button
      type="button"
      className={activeTab === tab ? `${styles.ecrTab} ${styles.ecrTabActive}` : styles.ecrTab}
      onClick={() => setActiveTab(tab)}
    >
      {children}
    </button>
  );

  if (loading) return <div className="plm-muted">Loading ECR…</div>;
  if (error && !ecr) return <div className="plm-error">{error}</div>;
  if (!ecr) return <div className="plm-muted">ECR not found.</div>;

  const title = ecr.title || 'Untitled change';

  // Score explanation (aligned with backend):
  const impactedParents = Number(factors?.impactedParentsCount ?? 0);
  const releasedParents = Number(factors?.releasedParentsCount ?? 0);
  const maxDepth = Number(factors?.maxDepth ?? 0);
  const rootState = factors?.rootLifecycleState;
  const rootPenalty = isReleased(rootState) ? 20 : 0;
  const structural = impactedParents * 4 + maxDepth * 8;
  const releasedPenalty = releasedParents * 15;
  const approxTotal = Math.min(100, Math.max(0, structural + releasedPenalty + rootPenalty));

  const showDropdown = !!reviewerQuery.trim() && (filteredMembers.length > 0 || canAddFreeText);
  const unknownReviewersCount = reviewerPreview.filter((r) => !r.inTeam).length;

  return (
    <div className={styles.ecrPage}>
      <div className={styles.ecrHead}>
        <div>
          <div className={styles.ecrKicker}>Engineering Change Request</div>
          <div className={styles.ecrTitleRow}>
            <div className={styles.ecrTitle}>{ecr.changeNumber || ecr.number || `ECR-${String(ecr.id).padStart(6, '0')}`}</div>
            <Pill value={ecr.status} />
          </div>
          <div className={styles.ecrSub}>{title}</div>
        </div>

        <div className={styles.ecrActions}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes')}>Back</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes/tasks')}>My change tasks</Button>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>Refresh</Button>
          <Button variant="primary" size="sm" onClick={recompute} disabled={recomputeLoading}>
            {recomputeLoading ? 'Recomputing…' : 'Recompute impact'}
          </Button>
        </div>
      </div>

      {error ? <div className="plm-error">{error}</div> : null}

      <div className={styles.ecrTabs}>
        <TabBtn tab={TAB.DETAILS}>Details</TabBtn>
        <TabBtn tab={TAB.TASKS}>Tasks</TabBtn>
        <TabBtn tab={TAB.INSIGHTS}>Insights</TabBtn>
      </div>

      {activeTab === TAB.DETAILS && (
        <div className={styles.ecrGrid}>
          <div className={styles.ecrCard}>
            <div className={styles.ecrCardTitle}>Summary</div>
            <div className={styles.ecrKv}>
              <div className={styles.ecrK}>Created by</div>
              <div className={`${styles.ecrV} mono`}>{ecr.createdBy || '-'}</div>
              <div className={styles.ecrK}>Context</div>
              <div className={`${styles.ecrV} mono`}>{ecr.contextType || '-'} {ecr.contextId ? `(${ecr.contextId})` : ''}</div>
              <div className={styles.ecrK}>Updated</div>
              <div className={`${styles.ecrV} mono`}>{ecr.updatedAt ? String(ecr.updatedAt) : '-'}</div>
            </div>
          </div>

          <div className={styles.ecrCard}>
            <div className={styles.ecrCardTitle}>Description</div>
            <div className={styles.ecrText}>{ecr.description || <span className="plm-muted">No description.</span>}</div>
          </div>

          {isDraft ? (
            <div className={styles.ecrCard} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.ecrCardTitle}>Submit for review</div>
              <div className="plm-muted" style={{ marginBottom: 10 }}>
                Pick reviewers from the context team (search by name/username/email), then submit.
              </div>

              <div className={styles.rvp} ref={dropdownRef}>
                <div className={styles.rvpTop}>
                  <div className={styles.rvpLabel}>Reviewers</div>
                  <div className={styles.rvpFilter}>
                    <button
                      type="button"
                      className={roleMode === ROLE_MODE.APPROVERS ? `${styles.rvpPill} ${styles.rvpPillOn}` : styles.rvpPill}
                      onClick={() => setRoleMode(ROLE_MODE.APPROVERS)}
                      title="Recommended: pick only roles that typically approve changes"
                    >
                      Approvers only
                    </button>
                    <button
                      type="button"
                      className={roleMode === ROLE_MODE.ALL ? `${styles.rvpPill} ${styles.rvpPillOn}` : styles.rvpPill}
                      onClick={() => setRoleMode(ROLE_MODE.ALL)}
                    >
                      All team
                    </button>
                  </div>
                </div>

                <div className={styles.rvpChips}>
                  {normalizedReviewers.map((r) => (
                    <button key={r} type="button" className={styles.rvpChip} onClick={() => removeReviewer(r)} title="Remove">
                      <span className="mono">{r}</span>
                      <span className={styles.rvpX}>×</span>
                    </button>
                  ))}
                  {normalizedReviewers.length === 0 ? (
                    <span className="plm-muted">No reviewers selected.</span>
                  ) : null}
                </div>

                <div className={styles.rvpInputRow}>
                  <input
                    className="plm-input"
                    value={reviewerQuery}
                    onChange={(e) => setReviewerQuery(e.target.value)}
                    placeholder={memberLoading ? 'Loading team…' : (selectedContextId ? 'Search reviewer…' : 'Select a context to search members…')}
                    disabled={!selectedContextId || memberLoading}
                  />
                  <Button variant="secondary" size="sm" onClick={loadMembers} disabled={!selectedContextId || memberLoading}>
                    {memberLoading ? 'Loading…' : 'Reload'}
                  </Button>
                </div>

                {showDropdown ? (
                  <div className={styles.rvpDd}>
                    {filteredMembers.map((m) => (
                      <button
                        key={m.userId || m.username}
                        type="button"
                        className={styles.rvpItem}
                        onClick={() => addReviewer(m.username)}
                      >
                        <div className={styles.rvpMain}>
                          <div className={`${styles.rvpU} mono`}>{m.username}</div>
                          <div className={styles.rvpSub}>{m.fullName || m.email || ''}</div>
                        </div>
                        <div className={styles.rvpTag}>{m.role || 'VIEWER'}</div>
                      </button>
                    ))}

                    {canAddFreeText ? (
                      <button
                        type="button"
                        className={`${styles.rvpItem} ${styles.rvpItemAdd}`}
                        onClick={() => addReviewer(reviewerQuery.trim())}
                      >
                        <div className={styles.rvpMain}>
                          <div className={`${styles.rvpU} mono`}>Add “{reviewerQuery.trim()}”</div>
                          <div className={styles.rvpSub}>Not found in team list (still allowed)</div>
                        </div>
                        <div className={styles.rvpTag}>Manual</div>
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className={styles.rvpPreview}>
                  <div className={styles.rvpPreviewHead}>
                    <div className={styles.rvpPreviewTitle}>Selected ({normalizedReviewers.length})</div>
                    {unknownReviewersCount > 0 ? (
                      <div className={styles.rvpWarn}>{unknownReviewersCount} not in team</div>
                    ) : null}
                  </div>

                  {normalizedReviewers.length === 0 ? (
                    <div className="plm-muted">Add reviewers to see a preview.</div>
                  ) : (
                    <div className={styles.rvpPreviewList}>
                      {reviewerPreview.map((r) => (
                        <div key={r.username} className={r.inTeam ? styles.rvpPrevRow : `${styles.rvpPrevRow} ${styles.rvpPrevRowWarn}`}>
                          <div className={styles.rvpPrevMain}>
                            <div className="mono" style={{ fontWeight: 800 }}>{r.username}</div>
                            <div className={styles.rvpPrevSub}>{r.fullName || r.email || (r.inTeam ? '' : 'Not found in current team')}</div>
                          </div>
                          <div className={styles.rvpTag}>{r.role || (r.inTeam ? 'VIEWER' : 'Manual')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.rvpAdvRow}>
                  <button type="button" className={styles.rvpLink} onClick={() => setShowAdvanced((v) => !v)}>
                    {showAdvanced ? 'Hide advanced CSV' : 'Advanced: paste CSV'}
                  </button>
                </div>

                {showAdvanced ? (
                  <div className={styles.rvpAdv}>
                    <textarea
                      className="plm-input"
                      rows={3}
                      value={reviewersCsv}
                      onChange={(e) => setReviewersCsv(e.target.value)}
                      placeholder="Example: senior1, senior2"
                    />
                  </div>
                ) : null}

                <div className={styles.ecrSubmitActions} style={{ marginTop: 10 }}>
                  <Button variant="primary" size="sm" onClick={submit} disabled={submitLoading}>
                    {submitLoading ? 'Submitting…' : 'Submit ECR'}
                  </Button>
                </div>

                <div className="plm-muted" style={{ marginTop: 8 }}>
                  Tip: reviewers must match real login usernames. Matching is case-insensitive.
                </div>
              </div>
            </div>
          ) : null}

          {ecn ? (
            <div className={styles.ecrCard} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.ecrCardTitle}>Resulting ECN</div>
              <div className={styles.ecrKv}>
                <div className={styles.ecrK}>ECN</div>
                <div className={`${styles.ecrV} mono`}>{ecn.number || `ECN-${String(ecn.id).padStart(6, '0')}`}</div>
                <div className={styles.ecrK}>Status</div>
                <div className={styles.ecrV}><Pill value={ecn.status} /></div>
                <div className={styles.ecrK}>Created by</div>
                <div className={`${styles.ecrV} mono`}>{ecn.createdBy || '-'}</div>
              </div>
              <div className="plm-muted" style={{ marginTop: 8 }}>Implementation task will appear in “My change tasks”.</div>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === TAB.TASKS && (
        <div className={styles.ecrCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div>
              <div className={styles.ecrCardTitle}>Review tasks</div>
              <div className="plm-muted" style={{ marginBottom: 10 }}>Reviewer tasks created on submit (and auto-routing if risk is high).</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes/tasks')}>Open my tasks</Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.ecrTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Assignee</th>
                  <th>Decision</th>
                  <th>Created</th>
                  <th>Decided</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="mono">{t.id}</td>
                    <td>{t.type}</td>
                    <td className="mono">{t.assignee}</td>
                    <td>{t.decision}</td>
                    <td className="mono">{t.createdAt ? String(t.createdAt) : '-'}</td>
                    <td className="mono">{t.decidedAt ? String(t.decidedAt) : '-'}</td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="plm-muted" style={{ padding: 12 }}>No tasks found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === TAB.INSIGHTS && (
        <div className={styles.ecrInsights}>
          <ContextualInsightPanel
            title="AI change review"
            subtitle="Separate computed scope signals from reviewer-facing guidance before you approve or redirect a change."
            insight={reviewSummary}
            loading={reviewSummaryLoading}
            error={reviewSummaryError}
            footer={(
              <>
                <Button variant="secondary" size="sm" onClick={recompute} disabled={recomputeLoading}>
                  {recomputeLoading ? 'Refreshing...' : 'Refresh review summary'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setActiveTab(TAB.TASKS)}>
                  Open review tasks
                </Button>
              </>
            )}
          />

          <div className={styles.ecrGrid}>
            <div className={styles.ecrCard}>
              <div className={styles.ecrCardTitle}>Impact</div>
              {!report ? (
                <div className="plm-muted">No impact report available yet. Click “Recompute impact” or submit the ECR.</div>
              ) : (
                <>
                  <div className={styles.ecrImpactTop}>
                    <div>
                      <div className="plm-muted">Risk</div>
                      <div style={{ marginTop: 4 }}><Pill value={report.riskLevel} type="risk" /></div>
                    </div>
                    <div>
                      <div className="plm-muted">Score</div>
                      <div className={styles.ecrScore}>{report.score}</div>
                    </div>
                  </div>

                  <div className={styles.ecrMini}>
                    <div className={styles.ecrMiniK}>Impacted parents</div>
                    <div className={styles.ecrMiniV}>{factors?.impactedParentsCount ?? '-'}</div>
                    <div className={styles.ecrMiniK}>Released parents</div>
                    <div className={styles.ecrMiniV}>{factors?.releasedParentsCount ?? '-'}</div>
                    <div className={styles.ecrMiniK}>Max depth</div>
                    <div className={styles.ecrMiniV}>{factors?.maxDepth ?? '-'}</div>
                    <div className={styles.ecrMiniK}>Root state</div>
                    <div className={styles.ecrMiniV}>{factors?.rootLifecycleState ?? '-'}</div>
                  </div>

                  <div className={styles.ecrExplain}>
                    <div className={styles.ecrExplainTitle}>How the score is calculated</div>
                    <div className="plm-muted" style={{ marginBottom: 8 }}>Simple heuristic (0–100) to estimate blast radius + release risk.</div>
                    <div className={styles.ecrExplainRow}>
                      <div className="plm-muted">Structural impact</div>
                      <div className="mono">{impactedParents}×4 + {maxDepth}×8 = {structural}</div>
                      <div className="plm-muted">Released parents penalty</div>
                      <div className="mono">{releasedParents}×15 = {releasedPenalty}</div>
                      <div className="plm-muted">Root released penalty</div>
                      <div className="mono">{isReleased(rootState) ? '+20 (root is RELEASED)' : '+0'}</div>
                      <div className="plm-muted">Approx total</div>
                      <div className="mono">{structural} + {releasedPenalty} + {rootPenalty} = {approxTotal} (clamped to 0..100)</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div className="plm-muted" style={{ marginBottom: 6 }}>Impacted objects (where-used parents)</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.ecrTable}>
                        <thead>
                          <tr>
                            <th>Object</th>
                            <th>Relation</th>
                            <th>Depth</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(impact?.items || []).slice(0, 25).map((it) => (
                            <tr key={it.id || `${it.objectType}-${it.objectId}-${it.depth}`}
                            >
                              <td className="mono">{it.objectType}:{it.objectId}</td>
                              <td>{it.relation}</td>
                              <td className="mono">{it.depth}</td>
                            </tr>
                          ))}
                          {(impact?.items || []).length === 0 && (
                            <tr>
                              <td colSpan={3} className="plm-muted" style={{ padding: 12 }}>No impacted items.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {(impact?.items || []).length > 25 ? (
                      <div className="plm-muted" style={{ marginTop: 8 }}>Showing first 25 items.</div>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            <div className={styles.ecrCard}>
              <div className={styles.ecrCardTitle}>Routing decision</div>
              {!insights?.route ? (
                <div className="plm-muted">No route decision recorded for this report.</div>
              ) : (
                <>
                  <div className={styles.ecrKv}>
                    <div className={styles.ecrK}>Risk</div>
                    <div className={styles.ecrV}><Pill value={insights.route.riskLevel} type="risk" /></div>
                    <div className={styles.ecrK}>Added reviewers</div>
                    <div className={`${styles.ecrV} mono`}>{insights.route.addedReviewersCsv || '-'}</div>
                    <div className={styles.ecrK}>Rules</div>
                    <div className={`${styles.ecrV} mono`}>{insights.route.appliedRulesJson || '-'}</div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div className="plm-muted" style={{ marginBottom: 6 }}>Explanation</div>
                    <div className={styles.ecrText}>{insights.route.explanation || '-'}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.ecrCard}>
            <div className={styles.ecrCardTitle}>Similar changes</div>
            <div className="plm-muted" style={{ marginBottom: 10 }}>Based on overlap between impacted parent sets (graph similarity).</div>

            <div style={{ overflowX: 'auto' }}>
              <table className={styles.ecrTable}>
                <thead>
                  <tr>
                    <th>Similar ECR</th>
                    <th>Score</th>
                    <th>Reason</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(insights?.similar || []).map((s) => (
                    <tr key={s.id || `${s.reportId}-${s.similarEcrId}`}
                    >
                      <td className="mono">{s.similarEcrId}</td>
                      <td className="mono">{s.score}</td>
                      <td>{s.reason}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/changes/ecr/${s.similarEcrId}`)}>Open</Button>
                      </td>
                    </tr>
                  ))}
                  {(insights?.similar || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="plm-muted" style={{ padding: 12 }}>No similar changes found yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcrDetailPage;
