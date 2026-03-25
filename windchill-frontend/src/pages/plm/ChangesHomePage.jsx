import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  getEcrsByContext, createEcr, submitEcr, startEcrReview,
  approveEcr, rejectEcr, closeEcr, reopenEcr, deleteEcr,
} from '../../services/changeApi';
import { getEcosByContext, createEco, promoteEco } from '../../services/changeApi';
import styles from './ChangesHomePage.module.css';

const STATE_COLORS = {
  // ECR states  (backend enum: ChangeRequestStatus)
  DRAFT: '#6b7280', SUBMITTED: '#3b82f6', IN_REVIEW: '#f59e0b',
  APPROVED: '#10b981', REJECTED: '#ef4444', CLOSED: '#9ca3af',
  // ECO states
  OPEN: '#3b82f6', IMPLEMENTING: '#8b5cf6',
  COMPLETED: '#10b981', CANCELLED: '#ef4444',
};

const StateBadge = ({ state }) => (
  <span style={{
    background: STATE_COLORS[state] || '#6b7280',
    color: '#fff', padding: '2px 10px', borderRadius: 12,
    fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
  }}>{state?.replace(/_/g, ' ')}</span>
);

// ECR: DRAFT→SUBMITTED→IN_REVIEW→APPROVED/REJECTED; APPROVED→CLOSED; REJECTED→DRAFT
const ECR_TRANSITIONS = {
  DRAFT:     [{ label: 'Submit',       action: (id) => submitEcr(id) }],
  SUBMITTED: [{ label: 'Start Review', action: (id) => startEcrReview(id) }],
  IN_REVIEW: [
    { label: 'Approve', action: (id) => approveEcr(id, {}) },
    { label: 'Reject',  action: (id) => rejectEcr(id, { comment: '' }) },
  ],
  APPROVED: [{ label: 'Close', action: (id) => closeEcr(id) }],
  REJECTED: [{ label: 'Reopen', action: (id) => reopenEcr(id) }],
};

const ECO_TRANSITIONS = {
  OPEN:         [{ label: 'Implement', state: 'IMPLEMENTING' }, { label: 'Cancel', state: 'CANCELLED' }],
  IMPLEMENTING: [{ label: 'Complete',  state: 'COMPLETED' },    { label: 'Cancel', state: 'CANCELLED' }],
};

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

  const contextId = user?.contextId || 1;

  useEffect(() => { loadAll(); }, [contextId]);

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [ecrRes, ecoRes] = await Promise.all([
        getEcrsByContext(contextId),
        getEcosByContext(contextId),
      ]);
      // ECR: wrapped in ApiResponse { data: [...] }
      // ECO: plain array from ChangeOrderController
      setEcrs(ecrRes.data?.data ?? ecrRes.data ?? []);
      setEcos(Array.isArray(ecoRes.data) ? ecoRes.data : (ecoRes.data?.data ?? []));
    } catch (e) {
      setError('Failed to load change management data.');
    } finally { setLoading(false); }
  }

  async function handleCreateEcr(e) {
    e.preventDefault();
    try {
      await createEcr({ ...ecrForm, contextId });
      setShowCreateEcr(false);
      setEcrForm({ title: '', description: '', priority: 'MEDIUM' });
      loadAll();
    } catch { setError('Failed to create ECR.'); }
  }

  async function handleCreateEco(e) {
    e.preventDefault();
    try {
      await createEco({
        ...ecoForm,
        contextId,
        ecrId: ecoForm.ecrId ? Number(ecoForm.ecrId) : null,
      });
      setShowCreateEco(false);
      setEcoForm({ title: '', description: '', priority: 'MEDIUM', ecrId: '' });
      loadAll();
    } catch { setError('Failed to create ECO.'); }
  }

  async function handleEcrAction(actionFn, id) {
    try { await actionFn(id); loadAll(); }
    catch { setError('Action failed.'); }
  }

  async function handlePromoteEco(id, state) {
    try { await promoteEco(id, state); loadAll(); }
    catch { setError('Promote failed.'); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Change Management</h1>
          <p className={styles.subtitle}>Manage Engineering Change Requests (ECR) and Change Orders (ECO)</p>
        </div>
        <div className={styles.headerActions}>
          {activeTab === 'ecr'
            ? <button className={styles.btnPrimary} onClick={() => setShowCreateEcr(true)}>+ New ECR</button>
            : <button className={styles.btnPrimary} onClick={() => setShowCreateEco(true)}>+ New ECO</button>
          }
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'ecr' ? styles.tabActive : ''}`} onClick={() => setActiveTab('ecr')}>
          ECR – Change Requests <span className={styles.badge}>{ecrs.length}</span>
        </button>
        <button className={`${styles.tab} ${activeTab === 'eco' ? styles.tabActive : ''}`} onClick={() => setActiveTab('eco')}>
          ECO – Change Orders <span className={styles.badge}>{ecos.length}</span>
        </button>
      </div>

      {loading ? <div className={styles.loading}>Loading…</div> : (
        <div className={styles.tableWrap}>
          {activeTab === 'ecr' && (
            <table className={styles.table}>
              <thead><tr>
                <th>Number</th><th>Title</th><th>Priority</th><th>State</th><th>Parts</th><th>Created</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {ecrs.length === 0 && <tr><td colSpan={7} className={styles.empty}>No ECRs found.</td></tr>}
                {ecrs.map(r => (
                  <tr key={r.id} className={styles.row}>
                    <td><span className={styles.link} onClick={() => navigate(`/plm/changes/ecr/${r.id}`)}>{r.changeNumber}</span></td>
                    <td>{r.title}</td>
                    <td>{r.priority}</td>
                    <td><StateBadge state={r.status} /></td>
                    <td>{r.impactedPartCount ?? 0}</td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                    <td className={styles.actions}>
                      {(ECR_TRANSITIONS[r.status] || []).map(t => (
                        <button key={t.label} className={styles.btnSm}
                          onClick={() => handleEcrAction(t.action, r.id)}>{t.label}</button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'eco' && (
            <table className={styles.table}>
              <thead><tr>
                <th>Number</th><th>Title</th><th>Priority</th><th>State</th><th>Linked ECR</th><th>Created</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {ecos.length === 0 && <tr><td colSpan={7} className={styles.empty}>No ECOs found.</td></tr>}
                {ecos.map(o => (
                  <tr key={o.id} className={styles.row}>
                    <td><span className={styles.link} onClick={() => navigate(`/plm/changes/eco/${o.id}`)}>{o.ecoNumber}</span></td>
                    <td>{o.title}</td>
                    <td>{o.priority}</td>
                    <td><StateBadge state={o.state} /></td>
                    <td>{o.ecrId ? <span className={styles.link} onClick={() => navigate(`/plm/changes/ecr/${o.ecrId}`)}>ECR #{o.ecrId}</span> : '—'}</td>
                    <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                    <td className={styles.actions}>
                      {(ECO_TRANSITIONS[o.state] || []).map(t => (
                        <button key={t.label} className={styles.btnSm}
                          onClick={() => handlePromoteEco(o.id, t.state)}>{t.label}</button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create ECR Modal */}
      {showCreateEcr && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>New Change Request (ECR)</h2>
            <form onSubmit={handleCreateEcr}>
              <label>Title<input required value={ecrForm.title} onChange={e => setEcrForm(p => ({...p, title: e.target.value}))} /></label>
              <label>Description<textarea rows={3} value={ecrForm.description} onChange={e => setEcrForm(p => ({...p, description: e.target.value}))} /></label>
              <label>Priority
                <select value={ecrForm.priority} onChange={e => setEcrForm(p => ({...p, priority: e.target.value}))}>
                  <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
                </select>
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowCreateEcr(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create ECO Modal */}
      {showCreateEco && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>New Change Order (ECO)</h2>
            <form onSubmit={handleCreateEco}>
              <label>Title<input required value={ecoForm.title} onChange={e => setEcrForm(p => ({...p, title: e.target.value}))} /></label>
              <label>Description<textarea rows={3} value={ecoForm.description} onChange={e => setEcoForm(p => ({...p, description: e.target.value}))} /></label>
              <label>Priority
                <select value={ecoForm.priority} onChange={e => setEcoForm(p => ({...p, priority: e.target.value}))}>
                  <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
                </select>
              </label>
              <label>Linked ECR ID (optional)<input type="number" value={ecoForm.ecrId} onChange={e => setEcoForm(p => ({...p, ecrId: e.target.value}))} /></label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowCreateEco(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
