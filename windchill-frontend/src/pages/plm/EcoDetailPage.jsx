import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import StateBadge from '../../components/plm/StateBadge';
import { plmApi } from '../../services/plmApi';
import styles from './EcoDetailPage.module.css';

const TAB = {
  DETAILS: 'DETAILS',
  IMPACT: 'IMPACT',
  ATTACHMENTS: 'ATTACHMENTS',
};

const EcoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TAB.DETAILS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eco, setEco] = useState(null);
  const [ecr, setEcr] = useState(null);
  const [tasks, setTasks] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await plmApi.getEcoDetails(id);
      setEco(data.eco);
      setEcr(data.ecr);
      setTasks(data.tasks || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load ECO');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className={styles.ecoLoading}>Loading Engineering Change Order…</div>;
  if (error && !eco) return <div className={styles.ecoError}>{error}</div>;
  if (!eco) return <div className={styles.ecoLoading}>ECO not found.</div>;

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
            {eco.number || `ECO-${String(eco.id).padStart(6, '0')}`}
            <StateBadge state={eco.status} />
          </div>
          <div className={styles.ecoSub}>{eco.title || 'Untitled Change Order'}</div>
        </div>

        <div className={styles.ecoActions}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes')}>Back</Button>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>Refresh</Button>
          {eco.status === 'OPEN' && (
            <Button variant="primary" size="sm">Submit for Review</Button>
          )}
        </div>
      </div>

      <div className={styles.ecoBody}>
        <div className={styles.ecoTabs}>
          <TabBtn tab={TAB.DETAILS}>Details</TabBtn>
          <TabBtn tab={TAB.IMPACT}>Impact Analysis</TabBtn>
          <TabBtn tab={TAB.ATTACHMENTS}>Attachments</TabBtn>
        </div>

        {activeTab === TAB.DETAILS && (
          <div className={styles.ecoGrid}>
            <div className={styles.ecoCard}>
              <div className={styles.ecoCardTitle}>General Information</div>
              <div className={styles.ecoKv}>
                <div className={styles.ecoK}>Created By</div>
                <div className={`${styles.ecoV} mono`}>{eco.createdBy || '-'}</div>
                <div className={styles.ecoK}>Created At</div>
                <div className={`${styles.ecoV} mono`}>{eco.createdAt ? String(eco.createdAt) : '-'}</div>
                <div className={styles.ecoK}>Context</div>
                <div className={`${styles.ecoV} mono`}>{eco.contextType || '-'} ({eco.contextId || '-'})</div>
              </div>
            </div>

            <div className={styles.ecoCard}>
              <div className={styles.ecoCardTitle}>Description</div>
              <div className={styles.ecoText}>{eco.description || <span className={styles.ecoMuted}>No description provided.</span>}</div>
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
                    <StateBadge state={ecr.status} size="sm" />
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/changes/ecr/${ecr.id}`)}>View ECR</Button>
                  </div>
                </div>
              </div>
            )}

            <div className={`${styles.ecoCard} ${styles.ecoCardFull}`}>
              <div className={styles.ecoCardTitle}>Implementation Tasks ({tasks.length})</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="parts-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Type</th>
                      <th>Assignee</th>
                      <th>Decision</th>
                      <th>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.id}>
                        <td className="mono">{t.id}</td>
                        <td>{t.type}</td>
                        <td className="mono">{t.assignee}</td>
                        <td>{t.decision || <span className={styles.ecoMuted}>Pending</span>}</td>
                        <td className="mono">{t.decidedAt ? String(t.decidedAt) : '—'}</td>
                      </tr>
                    ))}
                    {tasks.length === 0 && (
                      <tr><td colSpan={5} className={styles.ecoMuted} style={{ padding: 12 }}>No implementation tasks found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === TAB.IMPACT && (
          <div>
            <div className={styles.ecoAiGrid}>
              <div className={styles.ecoAiCard}>
                <div className={styles.ecoAiVal}>84</div>
                <div className={styles.ecoAiLabel}>Complexity Score</div>
              </div>
              <div className={styles.ecoAiCard}>
                <div className={styles.ecoAiVal}>12</div>
                <div className={styles.ecoAiLabel}>Impacted Objects</div>
              </div>
              <div className={styles.ecoAiCard}>
                <div className={styles.ecoAiVal}>High</div>
                <div className={styles.ecoAiLabel}>Risk Level</div>
              </div>
            </div>
            <div className={styles.ecoCard}>
              <div className={styles.ecoCardTitle}>Impact Analysis Summary</div>
              <p className={styles.ecoText}>
                This change order affects multiple released parent assemblies. AI analysis recommends 
                thorough regression testing and validation of mechanical interfaces due to tolerance changes.
              </p>
            </div>
          </div>
        )}

        {activeTab === TAB.ATTACHMENTS && (
          <div className={styles.ecoCard}>
            <div className={styles.ecoCardTitle}>Attachments</div>
            <div className={styles.ecoMuted}>No files attached to this ECO.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EcoDetailPage;
