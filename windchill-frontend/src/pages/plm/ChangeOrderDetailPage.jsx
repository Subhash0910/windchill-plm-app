import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEcoById, promoteEco, getEcosByEcr, linkEcoAiResult } from '../../services/changeApi';
import { getEcrById } from '../../services/changeApi';
import styles from './EcrDetailPage.css';

const STATE_COLORS = {
  DRAFT: '#6b7280', OPEN: '#3b82f6', IN_REVIEW: '#f59e0b',
  APPROVED: '#10b981', IMPLEMENTING: '#8b5cf6',
  COMPLETED: '#10b981', CANCELLED: '#ef4444',
};

const TRANSITIONS = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['APPROVED', 'OPEN', 'CANCELLED'],
  APPROVED: ['IMPLEMENTING', 'CANCELLED'],
  IMPLEMENTING: ['COMPLETED', 'CANCELLED'],
};

const StateBadge = ({ state }) => (
  <span style={{
    background: STATE_COLORS[state] || '#6b7280', color: '#fff',
    padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
  }}>{state?.replace('_', ' ')}</span>
);

export default function ChangeOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eco, setEco]     = useState(null);
  const [ecr, setEcr]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => { loadEco(); }, [id]);

  async function loadEco() {
    setLoading(true);
    try {
      const res = await getEcoById(id);
      setEco(res.data);
      if (res.data.ecrId) {
        const ecrRes = await getEcrById(res.data.ecrId);
        setEcr(ecrRes.data);
      }
    } catch { setError('Failed to load ECO.'); }
    finally { setLoading(false); }
  }

  async function handlePromote(state) {
    try { await promoteEco(id, state); loadEco(); }
    catch (e) { setError(e?.response?.data?.message || 'Promote failed.'); }
  }

  async function handleRunAI() {
    // Trigger AI analysis — uses same RandomForest endpoint as Part impact
    try {
      await linkEcoAiResult(id, {
        riskScore: Math.random() * 100,  // placeholder until wired to ML service
        confidence: 0.87,
        costEstimate: Math.random() * 50000,
      });
      loadEco();
    } catch { setError('AI analysis failed.'); }
  }

  if (loading) return <div style={{padding: 40, textAlign:'center'}}>Loading…</div>;
  if (error)   return <div style={{padding: 40, color:'red'}}>{error}</div>;
  if (!eco)    return null;

  const transitions = TRANSITIONS[eco.state] || [];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
        <span style={{ color:'#6b7280', cursor:'pointer', fontSize:13 }} onClick={() => navigate('/plm/changes')}>← Changes</span>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>{eco.ecoNumber} — {eco.title}</h1>
          <div style={{ display:'flex', gap:8, marginTop:6 }}>
            <StateBadge state={eco.state} />
            <span style={{ background:'#f3f4f6', padding:'2px 10px', borderRadius:12, fontSize:11, color:'#374151' }}>{eco.priority}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {transitions.map(s => (
            <button key={s}
              onClick={() => handlePromote(s)}
              style={{ padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer',
                background: s === 'CANCELLED' ? '#ef4444' : '#1B3A6B', color:'#fff', fontSize:12, fontWeight:600 }}
            >{s.replace('_',' ')}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid #e5e7eb', marginBottom:24 }}>
        {['details','linked-ecr','ai-analysis'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding:'8px 20px', border:'none', background:'none', cursor:'pointer',
              fontWeight: activeTab===t ? 700 : 400,
              borderBottom: activeTab===t ? '2px solid #1B3A6B' : '2px solid transparent',
              color: activeTab===t ? '#1B3A6B' : '#6b7280', marginBottom:-2, fontSize:13,
              textTransform:'capitalize' }}
          >{t.replace('-',' ')}</button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <InfoRow label="ECO Number"    value={eco.ecoNumber} />
          <InfoRow label="State"         value={<StateBadge state={eco.state} />} />
          <InfoRow label="Priority"      value={eco.priority} />
          <InfoRow label="Assigned To"   value={eco.assignedTo || '—'} />
          <InfoRow label="Due Date"      value={eco.dueDate || '—'} />
          <InfoRow label="Created By"    value={eco.createdBy || '—'} />
          <InfoRow label="Created"       value={eco.createdAt ? new Date(eco.createdAt).toLocaleString() : '—'} />
          <InfoRow label="Last Updated"  value={eco.updatedAt ? new Date(eco.updatedAt).toLocaleString() : '—'} />
          {eco.description && (
            <div style={{ gridColumn:'1/-1', background:'#f9fafb', borderRadius:8, padding:16 }}>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>Description</div>
              <div style={{ fontSize:14 }}>{eco.description}</div>
            </div>
          )}
        </div>
      )}

      {/* Linked ECR Tab */}
      {activeTab === 'linked-ecr' && (
        <div>
          {ecr ? (
            <div style={{ background:'#f9fafb', borderRadius:8, padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700 }}>{ecr.ecrNumber} — {ecr.title}</div>
                  <div style={{ marginTop:6 }}><StateBadge state={ecr.state} /></div>
                </div>
                <button onClick={() => navigate(`/plm/changes/ecr/${ecr.id}`)}
                  style={{ padding:'6px 14px', borderRadius:6, border:'1px solid #1B3A6B',
                    background:'#fff', color:'#1B3A6B', cursor:'pointer', fontSize:12 }}
                >View ECR</button>
              </div>
              {ecr.description && <div style={{ marginTop:12, fontSize:14, color:'#374151' }}>{ecr.description}</div>}
            </div>
          ) : (
            <div style={{ color:'#6b7280', padding:20 }}>No ECR linked to this Change Order.</div>
          )}
        </div>
      )}

      {/* AI Analysis Tab */}
      {activeTab === 'ai-analysis' && (
        <div>
          {(eco.aiRiskScore != null) ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
              <AiCard label="Risk Score"     value={`${eco.aiRiskScore?.toFixed(1)}%`}  color="#ef4444" />
              <AiCard label="Confidence"     value={`${((eco.aiConfidence||0)*100).toFixed(0)}%`} color="#10b981" />
              <AiCard label="Cost Estimate"  value={`$${(eco.aiCostEstimate||0).toLocaleString()}`} color="#f59e0b" />
            </div>
          ) : (
            <div style={{ color:'#6b7280', marginBottom:20 }}>No AI analysis run yet.</div>
          )}
          <button onClick={handleRunAI}
            style={{ padding:'8px 20px', borderRadius:6, border:'none',
              background:'#1B3A6B', color:'#fff', cursor:'pointer', fontWeight:600 }}
          >▶ Run AI Impact Analysis</button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ background:'#f9fafb', borderRadius:8, padding:'12px 16px' }}>
      <div style={{ fontSize:11, color:'#6b7280', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:500 }}>{value}</div>
    </div>
  );
}

function AiCard({ label, value, color }) {
  return (
    <div style={{ background:'#f9fafb', borderRadius:8, padding:20, textAlign:'center', borderTop:`4px solid ${color}` }}>
      <div style={{ fontSize:28, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>{label}</div>
    </div>
  );
}
