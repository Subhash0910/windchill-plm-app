import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import StateBadge from '../../components/plm/StateBadge';
import AttachmentsPanel from '../../components/plm/AttachmentsPanel';
import LifecycleStateflow from '../../components/plm/LifecycleStateflow';
import api from '../../utils/api';
import { plmApi } from '../../services/plmApi';
import styles from './EcoDetailPage.module.css';

const TAB = { DETAILS: 'DETAILS', TASKS: 'TASKS', IMPACT: 'IMPACT', ATTACHMENTS: 'ATTACHMENTS' };

const PROMOTE_TRANSITIONS = {
  DRAFT: 'OPEN',
  OPEN: 'IN_REVIEW',
  IN_REVIEW: 'APPROVED',
  APPROVED: 'CLOSED',
};

const PROMOTE_LABELS = {
  DRAFT: 'Open for Work',
  OPEN: 'Submit for Review',
  IN_REVIEW: 'Approve',
  APPROVED: 'Close',
};

const riskLabel = (score) => {
  if (score == null) return '—';
  if (score >= 7) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
};

const EcoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TAB.DETAILS);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState('');
  const [eco, setEco] = useState(null);
  const [ecr, setEcr] = useState(null);
  const [activities, setActivities] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', assignee: '', dueDate: '' });
  const [savingTask, setSavingTask] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await plmApi.getEco(id);
      const ecoData = data?.data ?? data;
      setEco(ecoData);
      if (ecoData?.ecrId) {
        try {
          const ecrData = await plmApi.getEcr(ecoData.ecrId);
          setEcr(ecrData);
        } catch {
          setEcr(null);
        }
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load ECO');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = () =>
    api.get(`/api/v1/plm/changes/eco/${id}/activities`).then(r => setActivities(r.data || [])).catch(() => {});

  useEffect(() => { load(); loadActivities(); }, [id]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setSavingTask(true);
    try {
      await api.post(`/api/v1/plm/changes/eco/${id}/activities`, newTask);
      setNewTask({ title: '', assignee: '', dueDate: '' });
      loadActivities();
    } finally { setSavingTask(false); }
  };

  const handleTaskStatus = async (actId, status) => {
    await api.patch(`/api/v1/plm/changes/eco/${id}/activities/${actId}/status?status=${status}`);
    loadActivities();
  };

  const handleDeleteTask = async (actId) => {
    await api.delete(`/api/v1/plm/changes/eco/${id}/activities/${actId}`);
    loadActivities();
  };

  const handlePromote = async () => {
    const nextState = PROMOTE_TRANSITIONS[eco.state];
    if (!nextState) return;
    setPromoting(true);
    try {
      await plmApi.promoteEco(id, nextState);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Promote failed');
    } finally {
      setPromoting(false);
    }
  };

  if (loading) return <div className={styles.ecoLoading}>Loading Engineering Change Order…</div>;
  if (error && !eco) return <div className={styles.ecoError}>{error}</div>;
  if (!eco) return <div className={styles.ecoLoading}>ECO not found.</div>;

  const nextState = PROMOTE_TRANSITIONS[eco.state];
  const promoteLabel = PROMOTE_LABELS[eco.state];

  const TabBtn = ({ tab, children }) => (
    <button
      type="button"
      className={activeTab === tab ? `${styles.ecoTab} ${styles.ecoTabActive}` : styles.ecoTab}
      onClick={() => setActiveTab(tab)}
    >
      {children}
    </button>
  );

  return (
    <div className={styles.ecoPage}>
      <div className={styles.ecoHead}>
        <div>
          <div className={styles.ecoKicker}>Engineering Change Order</div>
          <div className={styles.ecoNumber}>
            {eco.ecoNumber || `ECO-${String(eco.id).padStart(6, '0')}`}
            <StateBadge state={eco.state} />
          </div>
          <div className={styles.ecoSub}>{eco.title || 'Untitled Change Order'}</div>
          <LifecycleStateflow entityType="eco" currentState={eco.state} />
        </div>

        <div className={styles.ecoActions}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes')}>Back</Button>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading || promoting}>Refresh</Button>
          {nextState && (
            <Button variant="primary" size="sm" onClick={handlePromote} disabled={promoting}>
              {promoting ? 'Updating…' : promoteLabel}
            </Button>
          )}
        </div>
      </div>

      <div className={styles.ecoBody}>
        <div className={styles.ecoTabs}>
          <TabBtn tab={TAB.DETAILS}>Details</TabBtn>
          <TabBtn tab={TAB.TASKS}>Tasks ({activities.length})</TabBtn>
          <TabBtn tab={TAB.IMPACT}>Impact Analysis</TabBtn>
          <TabBtn tab={TAB.ATTACHMENTS}>Attachments</TabBtn>
        </div>

        {activeTab === TAB.DETAILS && (
          <div className={styles.ecoGrid}>
            <div className={styles.ecoCard}>
              <div className={styles.ecoCardTitle}>General Information</div>
              <div className={styles.ecoKv}>
                <div className={styles.ecoK}>Priority</div>
                <div className={styles.ecoV}>{eco.priority || '—'}</div>
                <div className={styles.ecoK}>Created By</div>
                <div className={`${styles.ecoV} mono`}>{eco.createdBy || '—'}</div>
                <div className={styles.ecoK}>Created At</div>
                <div className={styles.ecoV}>{eco.createdAt ? new Date(eco.createdAt).toLocaleString() : '—'}</div>
                <div className={styles.ecoK}>Updated At</div>
                <div className={styles.ecoV}>{eco.updatedAt ? new Date(eco.updatedAt).toLocaleString() : '—'}</div>
                <div className={styles.ecoK}>Context ID</div>
                <div className={styles.ecoV}>{eco.contextId || '—'}</div>
              </div>
            </div>

            <div className={styles.ecoCard}>
              <div className={styles.ecoCardTitle}>Description</div>
              <p className={styles.ecoText}>{eco.description || <span className={styles.ecoMuted}>No description provided.</span>}</p>
            </div>

            {ecr && (
              <div className={`${styles.ecoCard} ${styles.ecoCardFull}`}>
                <div className={styles.ecoCardTitle}>Linked Change Request</div>
                <div className={styles.ecoLinkedEcr}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{ecr.changeNumber || `ECR-${String(ecr.id).padStart(6, '0')}`}</div>
                    <div className={styles.ecoMuted}>{ecr.title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <StateBadge state={ecr.status ?? ecr.state} size="sm" />
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/changes/ecr/${ecr.id}`)}>View ECR</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === TAB.TASKS && (
          <div className={styles.ecoCard}>
            <div className={styles.ecoCardTitle}>Change Activities</div>
            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <input
                style={{ flex: 2, minWidth: 160, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                placeholder="Task title *"
                value={newTask.title}
                onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                required
              />
              <input
                style={{ flex: 1, minWidth: 100, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                placeholder="Assignee"
                value={newTask.assignee}
                onChange={e => setNewTask(t => ({ ...t, assignee: e.target.value }))}
              />
              <input type="date"
                style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                value={newTask.dueDate}
                onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))}
              />
              <Button variant="primary" size="sm" type="submit" disabled={savingTask}>
                {savingTask ? 'Adding...' : '+ Add Task'}
              </Button>
            </form>

            {activities.length === 0 ? (
              <p className={styles.ecoMuted}>No tasks yet. Add implementation tasks above.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Title</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Assignee</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Due</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '6px 10px' }} />
                  </tr>
                </thead>
                <tbody>
                  {activities.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px' }}>{a.title}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{a.assignee || '—'}</td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>{a.dueDate || '—'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <select
                          value={a.status}
                          onChange={e => handleTaskStatus(a.id, e.target.value)}
                          style={{ fontSize: 12, padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 4 }}
                        >
                          {['OPEN','IN_PROGRESS','DONE','CANCELLED'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteTask(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>x</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === TAB.IMPACT && (
          <div>
            <div className={styles.ecoAiGrid}>
              <div className={styles.ecoAiCard}>
                <div className={styles.ecoAiVal}>
                  {eco.aiRiskScore != null ? eco.aiRiskScore.toFixed(1) : '—'}
                </div>
                <div className={styles.ecoAiLabel}>Risk Score (0–10)</div>
              </div>
              <div className={styles.ecoAiCard}>
                <div className={styles.ecoAiVal}>
                  {eco.aiConfidence != null ? `${Math.round(eco.aiConfidence * 100)}%` : '—'}
                </div>
                <div className={styles.ecoAiLabel}>AI Confidence</div>
              </div>
              <div className={styles.ecoAiCard}>
                <div className={styles.ecoAiVal}>{riskLabel(eco.aiRiskScore)}</div>
                <div className={styles.ecoAiLabel}>Risk Level</div>
              </div>
              {eco.aiCostEstimate != null && (
                <div className={styles.ecoAiCard}>
                  <div className={styles.ecoAiVal}>${eco.aiCostEstimate.toLocaleString()}</div>
                  <div className={styles.ecoAiLabel}>Cost Estimate</div>
                </div>
              )}
            </div>
            {eco.aiRiskScore == null && (
              <div className={styles.ecoCard}>
                <div className={styles.ecoCardTitle}>Impact Analysis</div>
                <p className={styles.ecoMuted}>No AI analysis available for this ECO yet. Trigger analysis from the ML pipeline.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === TAB.ATTACHMENTS && (
          <div className={styles.ecoCard}>
            <div className={styles.ecoCardTitle}>Attachments</div>
            <AttachmentsPanel entityType="ECO" entityId={Number(id)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EcoDetailPage;
