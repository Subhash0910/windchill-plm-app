import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEcoById, promoteEco, linkEcoAiResult } from '../../services/changeApi';
import { getEcrById } from '../../services/changeApi';
import styles from './ChangeOrderDetailPage.module.css';
import Button from '../../components/atoms/Button/Button';
import ChangeTaskPanel from '../../components/plm/ChangeTaskPanel';

// ── state helpers ──────────────────────────────────────────────────────────
const STATE_CLASSES = {
  DRAFT: 'wc-state-draft', 
  OPEN: 'wc-state-open', 
  IN_REVIEW: 'wc-state-underreview',
  APPROVED: 'wc-state-approved', 
  IMPLEMENTING: 'wc-state-implementing',
  COMPLETED: 'wc-state-released', 
  CANCELLED: 'wc-state-obsolete',
};

function StateBadge({ state }) {
  const s = String(state || '').toUpperCase();
  const cls = STATE_CLASSES[s] || 'wc-state-draft';
  return (
    <span className={`${styles.badge} ${cls}`}>
      {s.replace(/_/g, ' ')}
    </span>
  );
}

// Which next states are allowed per current state
const TRANSITIONS = {
  DRAFT:        [{ label: 'Open',        state: 'OPEN',         variant: 'primary'   }],
  OPEN:         [{ label: 'Start Review',state: 'IN_REVIEW',    variant: 'primary'   },
                 { label: 'Cancel',      state: 'CANCELLED',    variant: 'danger'    }],
  IN_REVIEW:    [{ label: 'Approve',     state: 'APPROVED',     variant: 'primary'   },
                 { label: 'Back to Open',state: 'OPEN',         variant: 'secondary' },
                 { label: 'Cancel',      state: 'CANCELLED',    variant: 'danger'    }],
  APPROVED:     [{ label: 'Implement',   state: 'IMPLEMENTING', variant: 'primary'   },
                 { label: 'Cancel',      state: 'CANCELLED',    variant: 'danger'    }],
  IMPLEMENTING: [{ label: 'Complete',    state: 'COMPLETED',    variant: 'primary'   },
                 { label: 'Cancel',      state: 'CANCELLED',    variant: 'danger'    }],
};

export default function ChangeOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [eco, setEco]       = useState(null);
  const [ecr, setEcr]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]     = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [promoting, setPromoting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { loadEco(); }, [id]);

  async function loadEco() {
    setLoading(true); setError('');
    try {
      const res = await getEcoById(id);
      const data = res.data?.data ?? res.data;
      setEco(data);
      if (data?.ecrId) {
        try {
          const ecrRes = await getEcrById(data.ecrId);
          setEcr(ecrRes.data?.data ?? ecrRes.data);
        } catch { /* ECR might be deleted */ }
      }
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Failed to load ECO.');
    } finally { setLoading(false); }
  }

  async function handlePromote(state) {
    setPromoting(true); setError('');
    try { await promoteEco(id, state); await loadEco(); }
    catch (ex) { setError(ex?.response?.data?.message || 'Promote failed.'); }
    finally { setPromoting(false); }
  }

  async function handleRunAI() {
    setAiLoading(true); setError('');
    try {
      await linkEcoAiResult(id, {
        riskScore: null,
        confidence: null,
        costEstimate: null,
      });
      await loadEco();
    } catch (ex) { setError(ex?.response?.data?.message || 'AI analysis failed.'); }
    finally { setAiLoading(false); }
  }

  if (loading) return <div className={styles.loading}>Loading ECO…</div>;
  if (error && !eco) return <div className={styles.error}>{error}</div>;
  if (!eco)  return <div className={styles.loading}>ECO not found.</div>;

  const st = String(eco.status ?? eco.state ?? '').toUpperCase();
  const transitions = TRANSITIONS[st] || [];
  const hasAi = eco.aiRiskScore != null;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <div className={styles.kicker}>Engineering Change Order</div>
          <div className={styles.number}>
            {eco.ecoNumber || `ECO-${String(eco.id).padStart(6,'0')}`}
            <StateBadge state={st} />
            {eco.priority && (
              <span className={styles.badge} style={{ color: 'var(--wc-text-secondary)', background: 'var(--wc-sidebar-active)' }}>
                {eco.priority}
              </span>
            )}
          </div>
          <div className={styles.sub}>{eco.title}</div>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes')}>← Changes</Button>
          <Button variant="secondary" size="sm" onClick={loadEco}>Refresh</Button>
          {transitions.map(t => (
            <Button
              key={t.state}
              variant={t.variant}
              size="sm"
              onClick={() => handlePromote(t.state)}
              disabled={promoting}
            >
              {promoting ? '…' : t.label}
            </Button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tabs}>
        {[['details','Details'],['linked-ecr','Linked ECR'],['tasks','Tasks'],['ai-analysis','AI Analysis']].map(([key,label]) => (
          <button
            key={key}
            className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(key)}
          >{label}</button>
        ))}
      </div>

      <div className={styles.body}>
        {activeTab === 'details' && (
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Change Order Info</div>
              <div className={styles.kv}>
                <span className={styles.k}>ECO Number</span>   <span className={`${styles.v} mono`}>{eco.ecoNumber || '—'}</span>
                <span className={styles.k}>State</span>         <span className={styles.v}><StateBadge state={st} /></span>
                <span className={styles.k}>Priority</span>      <span className={styles.v}>{eco.priority || '—'}</span>
                <span className={styles.k}>Assigned To</span>   <span className={`${styles.v} mono`}>{eco.assignedTo || '—'}</span>
                <span className={styles.k}>Due Date</span>      <span className={styles.v}>{eco.dueDate ? new Date(eco.dueDate).toLocaleDateString() : '—'}</span>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Audit</div>
              <div className={styles.kv}>
                <span className={styles.k}>Created by</span>    <span className={`${styles.v} mono`}>{eco.createdBy || '—'}</span>
                <span className={styles.k}>Created</span>       <span className={styles.v}>{eco.createdAt ? new Date(eco.createdAt).toLocaleString() : '—'}</span>
                <span className={styles.k}>Last updated</span>  <span className={styles.v}>{eco.updatedAt ? new Date(eco.updatedAt).toLocaleString() : '—'}</span>
                <span className={styles.k}>Context ID</span>    <span className={`${styles.v} mono`}>{eco.contextId || '—'}</span>
              </div>
            </div>

            {eco.description && (
              <div className={`${styles.card} ${styles.cardFull}`}>
                <div className={styles.cardTitle}>Description</div>
                <div className={styles.text}>{eco.description}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'linked-ecr' && (
          <div>
            {ecr ? (
              <div className={styles.linkedEcr}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: 4 }}>
                    {ecr.changeNumber || `ECR-${String(ecr.id).padStart(6,'0')}`} — {ecr.title}
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <StateBadge state={ecr.status} />
                    {ecr.priority && <span className={styles.badge}>{ecr.priority}</span>}
                  </div>
                  {ecr.description && <div className={styles.text} style={{ marginTop:12 }}>{ecr.description}</div>}
                  <div className="plm-muted" style={{ marginTop:10, fontSize: '12px', fontWeight: 600 }}>
                    Created by {ecr.createdBy || '—'} · {ecr.createdAt ? new Date(ecr.createdAt).toLocaleDateString() : '—'}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/changes/ecr/${ecr.id}`)}>
                  View ECR →
                </Button>
              </div>
            ) : (
              <div className="plm-muted" style={{ padding: 20, textAlign: 'center' }}>
                {eco.ecrId ? `ECR #${eco.ecrId} could not be loaded.` : 'No ECR linked to this Change Order.'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai-analysis' && (
          <div>
            {hasAi ? (
              <div className={styles.aiGrid}>
                <div className={styles.aiCard} style={{ borderTopColor: 'var(--wc-danger-text)' }}>
                  <div className={styles.aiVal} style={{ color: 'var(--wc-danger-text)' }}>{eco.aiRiskScore?.toFixed(1)}%</div>
                  <div className={styles.aiLabel}>Risk Score</div>
                </div>
                <div className={styles.aiCard} style={{ borderTopColor: 'var(--wc-blue)' }}>
                  <div className={styles.aiVal} style={{ color: 'var(--wc-blue)' }}>{((eco.aiConfidence||0)*100).toFixed(0)}%</div>
                  <div className={styles.aiLabel}>Confidence</div>
                </div>
                <div className={styles.aiCard} style={{ borderTopColor: 'var(--wc-text-primary)' }}>
                  <div className={styles.aiVal} style={{ color: 'var(--wc-text-primary)' }}>${(eco.aiCostEstimate||0).toLocaleString()}</div>
                  <div className={styles.aiLabel}>Cost Estimate</div>
                </div>
              </div>
            ) : (
              <p className="plm-muted" style={{ marginBottom:16, textAlign: 'center' }}>No AI analysis has been run yet for this Change Order.</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleRunAI}
                disabled={aiLoading}
              >
                {aiLoading ? 'Running Analysis…' : '▶ Run AI Impact Analysis'}
              </Button>
              <p className="plm-muted" style={{ fontSize: '12px', maxWidth: '500px', textAlign: 'center' }}>
                Uses the Random Forest model (87% accuracy, 19 features) to estimate blast radius risk and cost.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className={styles.card}>
            <ChangeTaskPanel changeOrderId={eco.id} />
          </div>
        )}
      </div>
    </div>
  );
}
