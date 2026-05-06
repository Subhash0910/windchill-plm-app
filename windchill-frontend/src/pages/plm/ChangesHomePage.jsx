import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Pagination from '../../components/plm/Pagination';
import {
  getEcrsByContext, getEcrsPaginated, createEcr,
  submitEcr, startEcrReview, approveEcr, rejectEcr, closeEcr, reopenEcr,
} from '../../services/changeApi';
import { getEcosByContext, getEcosPaginated, createEco, promoteEco } from '../../services/changeApi';
import styles from './ChangesHomePage.module.css';

// ── helpers ──────────────────────────────────────────────────────────────────
const PRI_CLASS = { CRITICAL: styles.priCRITICAL, HIGH: styles.priHIGH, MEDIUM: styles.priMEDIUM, LOW: styles.priLOW };

function StateBadge({ state }) {
  const s = String(state || '').toUpperCase();
  const cls = styles['s' + s] || styles.sDRAFT;
  return <span className={`${styles.badge} ${cls}`}>{s.replace(/_/g, ' ')}</span>;
}

// ECR lifecycle actions (only show buttons valid for current state)
const ECR_ACTIONS = {
  DRAFT:     [{ label: 'Submit',       fn: (id) => submitEcr(id)                      }],
  SUBMITTED: [{ label: 'Start Review', fn: (id) => startEcrReview(id)                }],
  IN_REVIEW: [
    { label: 'Approve', fn: (id) => approveEcr(id, {})                   },
    { label: 'Reject',  fn: (id) => rejectEcr(id, { comment: '' }), danger: true },
  ],
  APPROVED:  [{ label: 'Close',   fn: (id) => closeEcr(id)  }],
  REJECTED:  [{ label: 'Reopen',  fn: (id) => reopenEcr(id) }],
};

const ECO_TRANSITIONS = {
  OPEN:         [{ label: 'Implement', state: 'IMPLEMENTING' }, { label: 'Cancel', state: 'CANCELLED', danger: true }],
  IMPLEMENTING: [{ label: 'Complete',  state: 'COMPLETED'   }, { label: 'Cancel', state: 'CANCELLED', danger: true }],
};

// ── component ────────────────────────────────────────────────────────────────
export default function ChangesHomePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ecr');
  const [ecrs, setEcrs]     = useState([]);
  const [ecos, setEcos]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [showCreateEcr, setShowCreateEcr] = useState(false);
  const [showCreateEco, setShowCreateEco] = useState(false);
  const [ecrForm, setEcrForm] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const [ecoForm, setEcoForm] = useState({ title: '', description: '', priority: 'MEDIUM', ecrId: '' });

  // Pagination — ECR tab
  const [ecrPage,          setEcrPage]          = useState(0);
  const [ecrPageSize,      setEcrPageSize]      = useState(20);
  const [ecrTotalElements, setEcrTotalElements] = useState(0);
  const [ecrTotalPages,    setEcrTotalPages]    = useState(0);

  // Pagination — ECO tab
  const [ecoPage,          setEcoPage]          = useState(0);
  const [ecoPageSize,      setEcoPageSize]      = useState(20);
  const [ecoTotalElements, setEcoTotalElements] = useState(0);
  const [ecoTotalPages,    setEcoTotalPages]    = useState(0);

  const contextId = user?.contextId || 1;

  // ── paginated loaders (one per tab) ─────────────────────────────────────
  const loadEcrs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getEcrsPaginated(contextId, ecrPage, ecrPageSize);
      const data = res.data?.data ?? {};
      setEcrs(data.content ?? []);
      setEcrTotalElements(data.totalElements || 0);
      setEcrTotalPages(data.totalPages || 0);
    } catch { setError('Failed to load ECRs.'); }
    finally { setLoading(false); }
  }, [contextId, ecrPage, ecrPageSize]);

  const loadEcos = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getEcosPaginated(contextId, ecoPage, ecoPageSize);
      const data = res.data?.data ?? {};
      setEcos(data.content ?? []);
      setEcoTotalElements(data.totalElements || 0);
      setEcoTotalPages(data.totalPages || 0);
    } catch { setError('Failed to load ECOs.'); }
    finally { setLoading(false); }
  }, [contextId, ecoPage, ecoPageSize]);

  // Reload when tab or pagination changes
  useEffect(() => {
    if (activeTab === 'ecr') loadEcrs();
    else loadEcos();
  }, [activeTab, loadEcrs, loadEcos]);

  async function handleCreateEcr(e) {
    e.preventDefault();
    try {
      await createEcr({ ...ecrForm, contextId });
      setShowCreateEcr(false);
      setEcrForm({ title: '', description: '', priority: 'MEDIUM' });
      setEcrPage(0);
    } catch (ex) { setError(ex?.response?.data?.message || 'Failed to create ECR.'); }
  }

  async function handleCreateEco(e) {
    e.preventDefault();
    try {
      await createEco({ ...ecoForm, contextId, ecrId: ecoForm.ecrId ? Number(ecoForm.ecrId) : null });
      setShowCreateEco(false);
      setEcoForm({ title: '', description: '', priority: 'MEDIUM', ecrId: '' });
      setEcoPage(0);
    } catch (ex) { setError(ex?.response?.data?.message || 'Failed to create ECO.'); }
  }

  async function handleEcrAction(actionFn, id, e) {
    e.stopPropagation();
    try { await actionFn(id); setEcrPage(0); }
    catch (ex) { setError(ex?.response?.data?.message || 'Action failed.'); }
  }

  async function handlePromoteEco(id, state, e) {
    e.stopPropagation();
    try { await promoteEco(id, state); setEcoPage(0); }
    catch (ex) { setError(ex?.response?.data?.message || 'Promote failed.'); }
  }

  // ── stats ─────────────────────────────────────────────
  const ecrStats = {
    total:   ecrTotalElements,
    open:    ecrs.filter(r => !['CLOSED','REJECTED'].includes(r.status)).length,
    pending: ecrs.filter(r => ['SUBMITTED','IN_REVIEW'].includes(r.status)).length,
  };
  const ecoStats = {
    total:  ecoTotalElements,
    active: ecos.filter(o => !['COMPLETED','CANCELLED'].includes(o.status ?? o.state)).length,
  };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <span className={styles.typeIcon}>🔧</span>
          <div>
            <h1>Change Management</h1>
            <p className={styles.subtitle}>Manage Engineering Change Requests (ECR) and Change Orders (ECO)</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}><div className={styles.statValue}>{ecrStats.total}</div><div className={styles.statLabel}>Total ECRs</div></div>
        <div className={styles.statCard}><div className={styles.statValue}>{ecrStats.open}</div><div className={styles.statLabel}>Open ECRs</div></div>
        <div className={styles.statCard}><div className={styles.statValue}>{ecrStats.pending}</div><div className={styles.statLabel}>Pending Review</div></div>
        <div className={styles.statCard}><div className={styles.statValue}>{ecoStats.total}</div><div className={styles.statLabel}>Total ECOs</div></div>
        <div className={styles.statCard}><div className={styles.statValue}>{ecoStats.active}</div><div className={styles.statLabel}>Active ECOs</div></div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'ecr' ? styles.tabActive : ''}`} onClick={() => setActiveTab('ecr')}>
            ECR – Change Requests
          </button>
          <button className={`${styles.tab} ${activeTab === 'eco' ? styles.tabActive : ''}`} onClick={() => setActiveTab('eco')}>
            ECO – Change Orders
          </button>
        </div>
        <div className={styles.toolbarRight}>
          <button className={styles.btnIcon} onClick={activeTab === 'ecr' ? loadEcrs : loadEcos} title="Refresh">↻</button>
          {activeTab === 'ecr'
            ? <button className={styles.btnPrimary} onClick={() => setShowCreateEcr(true)}>+ New ECR</button>
            : <button className={styles.btnPrimary} onClick={() => setShowCreateEco(true)}>+ New ECO</button>
          }
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}<button onClick={() => setError('')}>×</button></div>}

      {/* Create ECR panel */}
      {showCreateEcr && (
        <div className={styles.createPanel}>
          <div className={styles.createHeader}>
            <span>New Change Request (ECR)</span>
            <button className={styles.closeBtn} onClick={() => setShowCreateEcr(false)}>×</button>
          </div>
          <form className={styles.createBody} onSubmit={handleCreateEcr}>
            <label>Title *<input required value={ecrForm.title} onChange={e => setEcrForm(p => ({...p, title: e.target.value}))} placeholder="Brief description of the change" /></label>
            <label>Description<textarea rows={3} value={ecrForm.description} onChange={e => setEcrForm(p => ({...p, description: e.target.value}))} placeholder="Root cause, proposed fix…" /></label>
            <div className={styles.row2}>
              <label>Priority
                <select value={ecrForm.priority} onChange={e => setEcrForm(p => ({...p, priority: e.target.value}))}>
                  <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
                </select>
              </label>
            </div>
            <div className={styles.createActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setShowCreateEcr(false)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary}>Create ECR</button>
            </div>
          </form>
        </div>
      )}

      {/* Create ECO panel */}
      {showCreateEco && (
        <div className={styles.createPanel}>
          <div className={styles.createHeader}>
            <span>New Change Order (ECO)</span>
            <button className={styles.closeBtn} onClick={() => setShowCreateEco(false)}>×</button>
          </div>
          <form className={styles.createBody} onSubmit={handleCreateEco}>
            <label>Title *<input required value={ecoForm.title} onChange={e => setEcoForm(p => ({...p, title: e.target.value}))} placeholder="Change order title" /></label>
            <label>Description<textarea rows={3} value={ecoForm.description} onChange={e => setEcoForm(p => ({...p, description: e.target.value}))} /></label>
            <div className={styles.row2}>
              <label>Priority
                <select value={ecoForm.priority} onChange={e => setEcoForm(p => ({...p, priority: e.target.value}))}>
                  <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
                </select>
              </label>
              <label>Linked ECR ID (optional)<input type="number" value={ecoForm.ecrId} onChange={e => setEcoForm(p => ({...p, ecrId: e.target.value}))} placeholder="e.g. 3" /></label>
            </div>
            <div className={styles.createActions}>
              <button type="button" className={styles.btnSecondary} onClick={() => setShowCreateEco(false)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary}>Create ECO</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading
        ? <div className={styles.loading}>Loading…</div>
        : (
          <div className={styles.tableWrap}>

            {/* ECR Table */}
            {activeTab === 'ecr' && (
              <>
                <table className={styles.wcTable}>
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>State</th>
                      <th>Parts</th>
                      <th>Created by</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ecrs.length === 0 && (
                      <tr><td colSpan={8} className={styles.emptyRow}>No ECRs found. Create one with + New ECR.</td></tr>
                    )}
                    {ecrs.map(r => (
                      <tr key={r.id} className={styles.tableRow} onClick={() => navigate(`/plm/changes/ecr/${r.id}`)}>
                        <td><span className={styles.ecrLink}>{r.changeNumber || `ECR-${String(r.id).padStart(5,'0')}`}</span></td>
                        <td className={styles.titleCell}>{r.title}</td>
                        <td><span className={`${styles.priPill} ${PRI_CLASS[r.priority] || ''}`}>{r.priority}</span></td>
                        <td><StateBadge state={r.status} /></td>
                        <td><span className={styles.partsBadge}>{r.impactedPartCount ?? 0}</span></td>
                        <td className={styles.monoCell}>{r.createdBy || '—'}</td>
                        <td className={styles.dimCell}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <div className={styles.actionBar}>
                            {(ECR_ACTIONS[r.status] || []).map(t => (
                              <button
                                key={t.label}
                                className={`${styles.actBtn} ${t.danger ? styles.actBtnDanger : ''}`}
                                onClick={(e) => handleEcrAction(t.fn, r.id, e)}
                              >{t.label}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  page={ecrPage}
                  totalPages={ecrTotalPages}
                  size={ecrPageSize}
                  totalElements={ecrTotalElements}
                  onPageChange={setEcrPage}
                  onSizeChange={(s) => { setEcrPageSize(s); setEcrPage(0); }}
                />
              </>
            )}

            {/* ECO Table */}
            {activeTab === 'eco' && (
              <>
                <table className={styles.wcTable}>
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>State</th>
                      <th>Linked ECR</th>
                      <th>Created by</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ecos.length === 0 && (
                      <tr><td colSpan={8} className={styles.emptyRow}>No ECOs found. Create one with + New ECO.</td></tr>
                    )}
                    {ecos.map(o => {
                      const st = o.status ?? o.state;
                      return (
                        <tr key={o.id} className={styles.tableRow} onClick={() => navigate(`/plm/changes/eco/${o.id}`)}>
                          <td><span className={styles.ecrLink}>{o.ecoNumber || `ECO-${String(o.id).padStart(5,'0')}`}</span></td>
                          <td className={styles.titleCell}>{o.title}</td>
                          <td><span className={`${styles.priPill} ${PRI_CLASS[o.priority] || ''}`}>{o.priority}</span></td>
                          <td><StateBadge state={st} /></td>
                          <td>
                            {o.ecrId
                              ? <span className={styles.ecrLink} onClick={e => { e.stopPropagation(); navigate(`/plm/changes/ecr/${o.ecrId}`); }}>ECR #{o.ecrId}</span>
                              : <span className={styles.dimCell}>—</span>
                            }
                          </td>
                          <td className={styles.monoCell}>{o.createdBy || '—'}</td>
                          <td className={styles.dimCell}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                          <td>
                            <div className={styles.actionBar}>
                              {(ECO_TRANSITIONS[st] || []).map(t => (
                                <button
                                  key={t.label}
                                  className={`${styles.actBtn} ${t.danger ? styles.actBtnDanger : ''}`}
                                  onClick={(e) => handlePromoteEco(o.id, t.state, e)}
                                >{t.label}</button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination
                  page={ecoPage}
                  totalPages={ecoTotalPages}
                  size={ecoPageSize}
                  totalElements={ecoTotalElements}
                  onPageChange={setEcoPage}
                  onSizeChange={(s) => { setEcoPageSize(s); setEcoPage(0); }}
                />
              </>
            )}
          </div>
        )
      }

    </div>
  );
}
