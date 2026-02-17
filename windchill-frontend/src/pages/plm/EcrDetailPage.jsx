import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import './EcrDetailPage.css';

const TAB = {
  DETAILS: 'DETAILS',
  TASKS: 'TASKS',
  INSIGHTS: 'INSIGHTS',
};

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
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 10px',
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
    border: '1px solid transparent',
  };

  if (type === 'risk') {
    const bg = v.includes('HIGH') ? '#fee2e2' : v.includes('MED') ? '#ffedd5' : '#dcfce7';
    const bd = v.includes('HIGH') ? '#fecaca' : v.includes('MED') ? '#fed7aa' : '#bbf7d0';
    const tx = v.includes('HIGH') ? '#991b1b' : v.includes('MED') ? '#9a3412' : '#166534';
    return <span style={{ ...base, background: bg, borderColor: bd, color: tx }}>{v || '-'}</span>;
  }

  // default: status
  return <span style={{ ...base, background: '#e6f3fb', borderColor: '#b6d8ea', color: '#0f4d6d' }}>{v || '-'}</span>;
};

const parseReviewersCsv = (csv) => {
  const raw = String(csv || '')
    .split(/[,\n\r]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  // de-dupe (case-insensitive)
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

const EcrDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TAB.INSIGHTS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [details, setDetails] = useState(null);
  const [insights, setInsights] = useState(null);

  const [recomputeLoading, setRecomputeLoading] = useState(false);

  const [reviewersCsv, setReviewersCsv] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const ecr = details?.ecr;
  const tasks = details?.tasks || [];
  const ecn = details?.ecn;

  const impact = insights?.impact;
  const report = impact?.report;
  const factors = useMemo(() => safeJson(report?.factorsJson), [report?.factorsJson]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [d, i] = await Promise.all([
        plmApi.getEcrDetails(id),
        plmApi.getEcrInsights(id),
      ]);
      setDetails(d || null);
      setInsights(i || null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load ECR');
      setDetails(null);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const recompute = async () => {
    setRecomputeLoading(true);
    setError('');
    try {
      await plmApi.analyzeEcr(id);
      const i = await plmApi.getEcrInsights(id);
      setInsights(i || null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Recompute failed');
    } finally {
      setRecomputeLoading(false);
    }
  };

  const submit = async () => {
    const reviewers = parseReviewersCsv(reviewersCsv);
    if (!reviewers.length) {
      setError('Add at least one reviewer username (CSV).');
      return;
    }

    setSubmitLoading(true);
    setError('');
    try {
      await plmApi.submitEcr(id, { reviewers });
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
      className={activeTab === tab ? 'ecr-tab ecr-tab-active' : 'ecr-tab'}
      onClick={() => setActiveTab(tab)}
    >
      {children}
    </button>
  );

  if (loading) return <div className="plm-muted">Loading ECR…</div>;
  if (error && !ecr) return <div className="plm-error">{error}</div>;
  if (!ecr) return <div className="plm-muted">ECR not found.</div>;

  const title = ecr.title || 'Untitled change';
  const isDraft = String(ecr.status || '').toUpperCase() === 'DRAFT';

  return (
    <div className="ecr-page">
      <div className="ecr-head">
        <div>
          <div className="ecr-kicker">Engineering Change Request</div>
          <div className="ecr-title-row">
            <div className="ecr-title">{ecr.number || `ECR-${String(ecr.id).padStart(6, '0')}`}</div>
            <Pill value={ecr.status} />
          </div>
          <div className="ecr-sub">{title}</div>
        </div>

        <div className="ecr-actions">
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes')}>Back</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes/tasks')}>My change tasks</Button>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>Refresh</Button>
          <Button variant="primary" size="sm" onClick={recompute} disabled={recomputeLoading}>
            {recomputeLoading ? 'Recomputing…' : 'Recompute impact'}
          </Button>
        </div>
      </div>

      {error ? <div className="plm-error">{error}</div> : null}

      <div className="ecr-tabs">
        <TabBtn tab={TAB.DETAILS}>Details</TabBtn>
        <TabBtn tab={TAB.TASKS}>Tasks</TabBtn>
        <TabBtn tab={TAB.INSIGHTS}>Insights</TabBtn>
      </div>

      {activeTab === TAB.DETAILS && (
        <div className="ecr-grid">
          <div className="ecr-card">
            <div className="ecr-card-title">Summary</div>
            <div className="ecr-kv">
              <div className="ecr-k">Created by</div>
              <div className="ecr-v mono">{ecr.createdBy || '-'}</div>
              <div className="ecr-k">Context</div>
              <div className="ecr-v mono">{ecr.contextType || '-'} {ecr.contextId ? `(${ecr.contextId})` : ''}</div>
              <div className="ecr-k">Updated</div>
              <div className="ecr-v mono">{ecr.updatedAt ? String(ecr.updatedAt) : '-'}</div>
            </div>
          </div>

          <div className="ecr-card">
            <div className="ecr-card-title">Description</div>
            <div className="ecr-text">{ecr.description || <span className="plm-muted">No description.</span>}</div>
          </div>

          {isDraft ? (
            <div className="ecr-card" style={{ gridColumn: '1 / -1' }}>
              <div className="ecr-card-title">Submit for review</div>
              <div className="plm-muted" style={{ marginBottom: 10 }}>
                Windchill-style: submitting creates reviewer tasks and runs impact + routing.
              </div>

              <div className="ecr-submit-grid">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Reviewers (CSV usernames)</div>
                  <input
                    className="plm-input"
                    value={reviewersCsv}
                    onChange={(e) => setReviewersCsv(e.target.value)}
                    placeholder="Example: senior1, senior2"
                  />
                </div>

                <div className="ecr-submit-actions">
                  <Button variant="primary" size="sm" onClick={submit} disabled={submitLoading}>
                    {submitLoading ? 'Submitting…' : 'Submit ECR'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {ecn ? (
            <div className="ecr-card" style={{ gridColumn: '1 / -1' }}>
              <div className="ecr-card-title">Resulting ECN</div>
              <div className="ecr-kv">
                <div className="ecr-k">ECN</div>
                <div className="ecr-v mono">{ecn.number || `ECN-${String(ecn.id).padStart(6, '0')}`}</div>
                <div className="ecr-k">Status</div>
                <div className="ecr-v"><Pill value={ecn.status} /></div>
                <div className="ecr-k">Created by</div>
                <div className="ecr-v mono">{ecn.createdBy || '-'}</div>
              </div>
              <div className="plm-muted" style={{ marginTop: 8 }}>Implementation task will appear in “My change tasks”.</div>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === TAB.TASKS && (
        <div className="ecr-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div>
              <div className="ecr-card-title">Review tasks</div>
              <div className="plm-muted" style={{ marginBottom: 10 }}>Reviewer tasks created on submit (and auto-routing if risk is high).</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes/tasks')}>Open my tasks</Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="ecr-table">
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
        <div className="ecr-insights">
          <div className="ecr-grid">
            <div className="ecr-card">
              <div className="ecr-card-title">Impact</div>
              {!report ? (
                <div className="plm-muted">No impact report available yet.</div>
              ) : (
                <>
                  <div className="ecr-impact-top">
                    <div>
                      <div className="plm-muted">Risk</div>
                      <div style={{ marginTop: 4 }}><Pill value={report.riskLevel} type="risk" /></div>
                    </div>
                    <div>
                      <div className="plm-muted">Score</div>
                      <div className="ecr-score">{report.score}</div>
                    </div>
                  </div>

                  <div className="ecr-mini">
                    <div className="ecr-mini-k">Impacted parents</div>
                    <div className="ecr-mini-v mono">{factors?.impactedParentsCount ?? '-'}</div>
                    <div className="ecr-mini-k">Released parents</div>
                    <div className="ecr-mini-v mono">{factors?.releasedParentsCount ?? '-'}</div>
                    <div className="ecr-mini-k">Max depth</div>
                    <div className="ecr-mini-v mono">{factors?.maxDepth ?? '-'}</div>
                    <div className="ecr-mini-k">Root state</div>
                    <div className="ecr-mini-v mono">{factors?.rootLifecycleState ?? '-'}</div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div className="plm-muted" style={{ marginBottom: 6 }}>Impacted objects (where-used parents)</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="ecr-table">
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

            <div className="ecr-card">
              <div className="ecr-card-title">Routing decision</div>
              {!insights?.route ? (
                <div className="plm-muted">No route decision recorded for this report.</div>
              ) : (
                <>
                  <div className="ecr-kv">
                    <div className="ecr-k">Risk</div>
                    <div className="ecr-v"><Pill value={insights.route.riskLevel} type="risk" /></div>
                    <div className="ecr-k">Added reviewers</div>
                    <div className="ecr-v mono">{insights.route.addedReviewersCsv || '-'}</div>
                    <div className="ecr-k">Rules</div>
                    <div className="ecr-v mono">{insights.route.appliedRulesJson || '-'}</div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div className="plm-muted" style={{ marginBottom: 6 }}>Explanation</div>
                    <div className="ecr-text">{insights.route.explanation || '-'}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="ecr-card">
            <div className="ecr-card-title">Similar changes</div>
            <div className="plm-muted" style={{ marginBottom: 10 }}>Based on overlap between impacted parent sets (graph similarity).</div>

            <div style={{ overflowX: 'auto' }}>
              <table className="ecr-table">
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
