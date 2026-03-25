import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEcoById, promoteEco, linkEcoAiResult } from '../../services/changeApi';
import { getEcrById } from '../../services/changeApi';
import './EcoDetailPage.css';

// ── state helpers ──────────────────────────────────────────────────────────
const STATE_CLASSES = {
  DRAFT: 's-DRAFT', OPEN: 's-OPEN', IN_REVIEW: 's-IN_REVIEW',
  APPROVED: 's-APPROVED', IMPLEMENTING: 's-IMPLEMENTING',
  COMPLETED: 's-COMPLETED', CANCELLED: 's-CANCELLED',
};

function StateBadge({ state }) {
  const s = String(state || '').toUpperCase();
  return (
    <span className={`eco-badge ${STATE_CLASSES[s] || 's-DRAFT'}`}>
      {s.replace(/_/g, ' ')}
    </span>
  );
}

// Which next states are allowed per current state
const TRANSITIONS = {
  DRAFT:        [{ label: 'Open',        state: 'OPEN',         cls: 'eco-btn-primary'   }],
  OPEN:         [{ label: 'Start Review',state: 'IN_REVIEW',    cls: 'eco-btn-primary'   },
                 { label: 'Cancel',      state: 'CANCELLED',    cls: 'eco-btn-danger'    }],
  IN_REVIEW:    [{ label: 'Approve',     state: 'APPROVED',     cls: 'eco-btn-primary'   },
                 { label: 'Back to Open',state: 'OPEN',         cls: 'eco-btn-secondary' },
                 { label: 'Cancel',      state: 'CANCELLED',    cls: 'eco-btn-danger'    }],
  APPROVED:     [{ label: 'Implement',   state: 'IMPLEMENTING', cls: 'eco-btn-primary'   },
                 { label: 'Cancel',      state: 'CANCELLED',    cls: 'eco-btn-danger'    }],
  IMPLEMENTING: [{ label: 'Complete',    state: 'COMPLETED',    cls: 'eco-btn-primary'   },
                 { label: 'Cancel',      state: 'CANCELLED',    cls: 'eco-btn-danger'    }],
};

// ── component ──────────────────────────────────────────────────────────────
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
      // ECO controller returns plain object (not wrapped)
      const data = res.data?.data ?? res.data;
      setEco(data);
      if (data?.ecrId) {
        try {
          const ecrRes = await getEcrById(data.ecrId);
          // ECR is wrapped in ApiResponse
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
        riskScore: null,     // backend ML service fills these
        confidence: null,
        costEstimate: null,
      });
      await loadEco();
    } catch (ex) { setError(ex?.response?.data?.message || 'AI analysis failed.'); }
    finally { setAiLoading(false); }
  }

  if (loading) return <div className="eco-loading">Loading ECO…</div>;
  if (error && !eco) return <div className="eco-error">{error}</div>;
  if (!eco)  return <div className="eco-loading eco-muted">ECO not found.</div>;

  const st = String(eco.status ?? eco.state ?? '').toUpperCase();
  const transitions = TRANSITIONS[st] || [];
  const hasAi = eco.aiRiskScore != null;

  return (
    <div className="eco-page">

      {/* ── Head ─────────────────────────────────────────── */}
      <div className="eco-head">
        <div>
          <div className="eco-kicker">Engineering Change Order</div>
          <div className="eco-number">
            {eco.ecoNumber || `ECO-${String(eco.id).padStart(6,'0')}`}
            <StateBadge state={st} />
            {eco.priority && (
              <span style={{ background:'#f3f4f6', padding:'2px 9px', borderRadius:10, fontSize:11, color:'#374151', fontWeight:600 }}>
                {eco.priority}
              </span>
            )}
          </div>
          <div className="eco-sub">{eco.title}</div>
        </div>

        <div className="eco-actions">
          <button className="eco-btn eco-btn-secondary" onClick={() => navigate('/plm/changes')}>← Changes</button>
          <button className="eco-btn eco-btn-secondary" onClick={loadEco}>Refresh</button>
          {transitions.map(t => (
            <button
              key={t.state}
              className={`eco-btn ${t.cls}`}
              onClick={() => handlePromote(t.state)}
              disabled={promoting}
            >
              {promoting ? '…' : t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="eco-error">{error}</div>}

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="eco-tabs">
        {[['details','Details'],['linked-ecr','Linked ECR'],['ai-analysis','AI Analysis']].map(([key,label]) => (
          <button
            key={key}
            className={`eco-tab ${activeTab === key ? 'eco-tab-active' : ''}`}
            onClick={() => setActiveTab(key)}
          >{label}</button>
        ))}
      </div>

      <div className="eco-body">

        {/* ── Details tab ──────────────────────────────── */}
        {activeTab === 'details' && (
          <div className="eco-grid">
            <div className="eco-card">
              <div className="eco-card-title">Change Order Info</div>
              <div className="eco-kv">
                <span className="eco-k">ECO Number</span>   <span className="eco-v mono">{eco.ecoNumber || '—'}</span>
                <span className="eco-k">State</span>         <span className="eco-v"><StateBadge state={st} /></span>
                <span className="eco-k">Priority</span>      <span className="eco-v">{eco.priority || '—'}</span>
                <span className="eco-k">Assigned To</span>   <span className="eco-v mono">{eco.assignedTo || '—'}</span>
                <span className="eco-k">Due Date</span>      <span className="eco-v">{eco.dueDate ? new Date(eco.dueDate).toLocaleDateString() : '—'}</span>
              </div>
            </div>

            <div className="eco-card">
              <div className="eco-card-title">Audit</div>
              <div className="eco-kv">
                <span className="eco-k">Created by</span>    <span className="eco-v mono">{eco.createdBy || '—'}</span>
                <span className="eco-k">Created</span>       <span className="eco-v">{eco.createdAt ? new Date(eco.createdAt).toLocaleString() : '—'}</span>
                <span className="eco-k">Last updated</span>  <span className="eco-v">{eco.updatedAt ? new Date(eco.updatedAt).toLocaleString() : '—'}</span>
                <span className="eco-k">Context ID</span>    <span className="eco-v mono">{eco.contextId || '—'}</span>
              </div>
            </div>

            {eco.description && (
              <div className="eco-card eco-card-full">
                <div className="eco-card-title">Description</div>
                <div className="eco-text">{eco.description}</div>
              </div>
            )}
          </div>
        )}

        {/* ── Linked ECR tab ───────────────────────────── */}
        {activeTab === 'linked-ecr' && (
          <div>
            {ecr ? (
              <div className="eco-linked-ecr">
                <div>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>
                    {ecr.changeNumber || `ECR-${String(ecr.id).padStart(6,'0')}`} — {ecr.title}
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <StateBadge state={ecr.status} />
                    {ecr.priority && <span style={{ fontSize:11, background:'#f3f4f6', padding:'1px 8px', borderRadius:8, color:'#555' }}>{ecr.priority}</span>}
                  </div>
                  {ecr.description && <div className="eco-text" style={{ marginTop:8 }}>{ecr.description}</div>}
                  <div className="eco-muted" style={{ marginTop:6 }}>
                    Created by {ecr.createdBy || '—'} · {ecr.createdAt ? new Date(ecr.createdAt).toLocaleDateString() : '—'}
                  </div>
                </div>
                <button className="eco-btn eco-btn-secondary" onClick={() => navigate(`/plm/changes/ecr/${ecr.id}`)}>
                  View ECR →
                </button>
              </div>
            ) : (
              <div className="eco-muted" style={{ padding: 20 }}>
                {eco.ecrId ? `ECR #${eco.ecrId} could not be loaded.` : 'No ECR linked to this Change Order.'}
              </div>
            )}
          </div>
        )}

        {/* ── AI Analysis tab ──────────────────────────── */}
        {activeTab === 'ai-analysis' && (
          <div>
            {hasAi ? (
              <div className="eco-ai-grid">
                <div className="eco-ai-card" style={{ borderTopColor:'#ef4444' }}>
                  <div className="eco-ai-val" style={{ color:'#ef4444' }}>{eco.aiRiskScore?.toFixed(1)}%</div>
                  <div className="eco-ai-label">Risk Score</div>
                </div>
                <div className="eco-ai-card" style={{ borderTopColor:'#10b981' }}>
                  <div className="eco-ai-val" style={{ color:'#10b981' }}>{((eco.aiConfidence||0)*100).toFixed(0)}%</div>
                  <div className="eco-ai-label">Confidence</div>
                </div>
                <div className="eco-ai-card" style={{ borderTopColor:'#f59e0b' }}>
                  <div className="eco-ai-val" style={{ color:'#f59e0b' }}>${(eco.aiCostEstimate||0).toLocaleString()}</div>
                  <div className="eco-ai-label">Cost Estimate</div>
                </div>
              </div>
            ) : (
              <p className="eco-muted" style={{ marginBottom:16 }}>No AI analysis has been run yet for this Change Order.</p>
            )}
            <button
              className="eco-btn eco-btn-primary"
              onClick={handleRunAI}
              disabled={aiLoading}
            >
              {aiLoading ? 'Running…' : '▶ Run AI Impact Analysis'}
            </button>
            <p className="eco-muted" style={{ marginTop:10 }}>
              Uses the Random Forest model (87% accuracy, 19 features) to estimate blast radius risk and cost.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
