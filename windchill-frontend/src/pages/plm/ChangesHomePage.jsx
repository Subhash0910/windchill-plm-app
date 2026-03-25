import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getEcrsByContext, createEcr, promoteEcr, deleteEcr } from '../../services/changeApi';
import { getEcosByContext, createEco } from '../../services/changeApi';
import styles from './ChangesHomePage.module.css';

const STATE_COLORS = {
  // ECR states
  DRAFT: '#6b7280', SUBMITTED: '#3b82f6', UNDER_REVIEW: '#f59e0b',
  APPROVED: '#10b981', REJECTED: '#ef4444', CLOSED: '#9ca3af',
  // ECO states
  OPEN: '#3b82f6', IN_REVIEW: '#f59e0b', IMPLEMENTING: '#8b5cf6',
  COMPLETED: '#10b981', CANCELLED: '#ef4444',
};

const StateBadge = ({ state }) => (
  <span style={{
    background: STATE_COLORS[state] || '#6b7280',
    color: '#fff', padding: '2px 10px', borderRadius: 12,
    fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
  }}>{state?.replace('_', ' ')}</span>
);

const ECR_TRANSITIONS = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['CLOSED'],
  REJECTED: ['DRAFT'],
};

const ECO_TRANSITIONS = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['APPROVED', 'OPEN', 'CANCELLED'],
  APPROVED: ['IMPLEMENTING', 'CANCELLED'],
  IMPLEMENTING: ['COMPLETED', 'CANCELLED'],
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
      setEcrs(ecrRes.data || []);
      setEcos(ecoRes.data || []);
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

  async function handlePromoteEcr(id, state) {
    try { await promoteEcr(id, state); loadAll(); }
    catch { setError('Promote failed.'); }
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
                <th>Number</th><th>Title</th><th>Priority</th><th>State</th><th>Created</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {ecrs.length === 0 && <tr><td colSpan={6} className={styles.empty}>No ECRs found.</td></tr>}
                {ecrs.map(r => (
                  <tr key={r.id} className={styles.row}>
                    <td><span className={styles.link} onClick={() => navigate(`/plm/changes/ecr/${r.id}`)}>{r.ecrNumber}</span></td>
                    <td>{r.title}</td>
                    <td>{r.priority}</td>
                    <td><StateBadge state={r.state} /></td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                    <td className={styles.actions}>
                      {(ECR_TRANSITIONS[r.state] || []).map(s => (
                        <button key={s} className={styles.btnSm} onClick={() => handlePromoteEcr(r.id, s)}>{s}</button>
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
                      {(ECO_TRANSITIONS[o.state] || []).map(s => (
                        <button key={s} className={styles.btnSm} onClick={() => handlePromoteEco(o.id, s)}>{s}</button>
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
              <label>Title<input required value={ecoForm.title} onChange={e => setEcoForm(p => ({...p, title: e.target.value}))} /></label>
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
