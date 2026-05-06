import React, { useState, useEffect } from 'react';
import { plmApi } from '../../services/plmApi';
import StateBadge from './StateBadge';
import './BomCompareView.css';

export default function BomCompareView({ partId, contextId }) {
  const [parts, setParts] = useState([]);
  const [part1Id, setPart1Id] = useState('');
  const [part2Id, setPart2Id] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, ADDED, REMOVED, MODIFIED
  const token = () => localStorage.getItem('token') || '';

  useEffect(() => {
    fetch(`/api/v1/plm/parts?contextId=${contextId || 1}&size=200`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(r => setParts(r.data?.data?.content || r.data || []));
    if (partId) setPart1Id(partId);
  }, [partId, contextId]);

  const compare = () => {
    if (!part1Id || !part2Id) return;
    setLoading(true); setError(null);
    fetch(`/api/v1/plm/bom/compare?part1Id=${part1Id}&part2Id=${part2Id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(r => { if (r.success) setResult(r.data); else setError(r.message); })
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  const filtered = result?.changes?.filter(c => filter === 'ALL' || c.type === filter) || [];

  const changeIcon = (type) => ({ ADDED: '🟢', REMOVED: '🔴', MODIFIED: '🟠', UNCHANGED: '⚪' }[type] || '⚪');

  return (
    <div className="bcv-panel">
      <div className="bcv-header">
        <div><h3>BOM Compare</h3><span className="bcv-subtitle">Side-by-side revision diff with AI risk assessment</span></div>
      </div>

      <div className="bcv-controls">
        <div className="bcv-pickers">
          <select value={part1Id} onChange={e => setPart1Id(e.target.value)} className="bcv-select">
            <option value="">Select Part A...</option>
            {parts.map(p => <option key={p.id} value={p.id}>{p.partNumber} — {p.name} (Rev {p.revision})</option>)}
          </select>
          <span className="bcv-vs">vs</span>
          <select value={part2Id} onChange={e => setPart2Id(e.target.value)} className="bcv-select">
            <option value="">Select Part B...</option>
            {parts.map(p => <option key={p.id} value={p.id}>{p.partNumber} — {p.name} (Rev {p.revision})</option>)}
          </select>
          <button onClick={compare} disabled={!part1Id || !part2Id || loading} className="btn-primary btn-sm">
            {loading ? 'Comparing...' : 'Compare BOMs'}
          </button>
        </div>
      </div>

      {error && <div className="bcv-error">Failed: {error}</div>}

      {result && (
        <>
          <div className="bcv-summary">
            <div className="bcv-summary-card bcv-added"><div className="bcv-num">{result.summary.added}</div><div>Added</div></div>
            <div className="bcv-summary-card bcv-removed"><div className="bcv-num">{result.summary.removed}</div><div>Removed</div></div>
            <div className="bcv-summary-card bcv-modified"><div className="bcv-num">{result.summary.modified}</div><div>Modified</div></div>
            <div className="bcv-summary-card bcv-unchanged"><div className="bcv-num">{result.summary.unchanged}</div><div>Unchanged</div></div>
          </div>

          <div className="bcv-filter-bar">
            {['ALL', 'ADDED', 'REMOVED', 'MODIFIED'].map(f => (
              <button key={f} className={`bcv-filter-btn ${filter === f ? 'active' : ''} ${f !== 'ALL' ? `bcv-filter-${f.toLowerCase()}` : ''}`} onClick={() => setFilter(f)}>{f === 'ALL' ? `All (${result.summary.totalChanges})` : `${f} (${result.summary[f.toLowerCase()]})`}</button>
            ))}
          </div>

          <div className="bcv-split">
            <div className="bcv-side">
              <div className="bcv-side-header">Part A: {result.part1.number} (Rev {result.part1.revision})</div>
              <table className="bcv-table">
                <thead><tr><th>#</th><th>Part Number</th><th>Name</th><th>Qty</th><th>State</th></tr></thead>
                <tbody>
                  {result.part1Lines.map((l, i) => {
                    const change = result.changes.find(c => c.partNumber === l.partNumber);
                    const cls = change ? `bcv-row-${change.type.toLowerCase()}` : '';
                    return (<tr key={i} className={cls}><td>{l.findNumber || i+1}</td><td className="bcv-mono">{l.partNumber}</td><td>{l.partName}</td><td>{l.quantity} {l.unit}</td><td><StateBadge state={l.lifecycleState || l.partRevision} /></td></tr>);
                  })}
                </tbody>
              </table>
            </div>
            <div className="bcv-divider" />
            <div className="bcv-side">
              <div className="bcv-side-header">Part B: {result.part2.number} (Rev {result.part2.revision})</div>
              <table className="bcv-table">
                <thead><tr><th>#</th><th>Part Number</th><th>Name</th><th>Qty</th><th>State</th></tr></thead>
                <tbody>
                  {result.part2Lines.map((l, i) => {
                    const change = result.changes.find(c => c.partNumber === l.partNumber);
                    const cls = change ? `bcv-row-${change.type.toLowerCase()}` : '';
                    return (<tr key={i} className={cls}><td>{l.findNumber || i+1}</td><td className="bcv-mono">{l.partNumber}</td><td>{l.partName}</td><td>{l.quantity} {l.unit}</td><td><StateBadge state={l.lifecycleState || l.partRevision} /></td></tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bcv-detail-section">
            <h4>Change Details ({filtered.length})</h4>
            {filtered.map((c, i) => (
              <div key={i} className={`bcv-change-card bcv-change-${c.type.toLowerCase()}`}>
                <span className="bcv-change-icon">{changeIcon(c.type)}</span>
                <div className="bcv-change-body">
                  <span className="bcv-change-type">{c.type}</span>
                  <span className="bcv-change-part">{c.partNumber} — {c.partName}</span>
                  {c.type === 'MODIFIED' && <span className="bcv-change-detail">Qty: {c.oldQty} → {c.newQty} | BOM Level: {c.bomLevel}</span>}
                  {c.type === 'ADDED' && <span className="bcv-change-detail">Qty: {c.quantity} | BOM Level: {c.bomLevel}</span>}
                  {c.type === 'REMOVED' && <span className="bcv-change-detail">Was Qty: {c.quantity} | BOM Level: {c.bomLevel}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="bcv-empty">
          <span>{'\u{1F50D}'}</span>
          <p>Select two parts to compare their BOM structures side by side. See what was added, removed, or modified between revisions.</p>
        </div>
      )}
    </div>
  );
}
