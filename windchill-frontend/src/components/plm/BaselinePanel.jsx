import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Button from '../atoms/Button/Button';
import StateBadge from '../plm/StateBadge';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { AuthContext } from '../../context/AuthContext';
import './BaselinePanel.css';

const TYPE_COLORS = {
  PRODUCT:   '#6366f1',
  MILESTONE: '#f59e0b',
  BUILD:     '#10b981',
  CUSTOM:    '#8b5cf6',
};

const BaselinePanel = ({ partId }) => {
  const { selectedContextId } = useContext(PlmWorkspaceContext);
  const auth = useContext(AuthContext);
  const meUsername = auth?.user?.username;

  const [baselines, setBaselines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [lines, setLines] = useState({});
  const [linesLoading, setLinesLoading] = useState({});

  // ── Compare state ────────────────────────────────────────────────────────
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  // ── Create form ──────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', baselineType: 'PRODUCT' });

  // ── Load baselines ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!partId) return;
    try {
      setLoading(true); setError(null);
      const data = await plmApi.listBaselines(selectedContextId, partId);
      setBaselines(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load baselines');
    } finally { setLoading(false); }
  }, [partId, selectedContextId]);

  useEffect(() => { load(); }, [load]);

  // ── Create baseline ──────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      setCreating(true); setError(null);
      await plmApi.createBaseline({
        partId,
        contextId: selectedContextId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        baselineType: form.baselineType,
      });
      setShowForm(false);
      setForm({ name: '', description: '', baselineType: 'PRODUCT' });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create baseline');
    } finally { setCreating(false); }
  };

  // ── Freeze baseline ──────────────────────────────────────────────────────
  const handleFreeze = async (id) => {
    try {
      setError(null);
      await plmApi.freezeBaseline(id, meUsername);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to freeze baseline');
    }
  };

  // ── Delete baseline ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this baseline? This cannot be undone.')) return;
    try {
      setError(null);
      await plmApi.deleteBaseline(id);
      if (expandedId === id) setExpandedId(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete baseline');
    }
  };

  // ── Toggle expand / load lines ──────────────────────────────────────────
  const handleToggle = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!lines[id]) {
      try {
        setLinesLoading(prev => ({ ...prev, [id]: true }));
        const data = await plmApi.getBaselineLines(id);
        setLines(prev => ({ ...prev, [id]: data || [] }));
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load baseline lines');
      } finally {
        setLinesLoading(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  // ── Compare ──────────────────────────────────────────────────────────────
  const handleCompare = async () => {
    if (!compareA || !compareB) return;
    try {
      setComparing(true); setError(null);
      const result = await plmApi.compareBaselines(compareA, compareB);
      setCompareResult(result);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to compare baselines');
    } finally { setComparing(false); }
  };

  const baselineOptions = useMemo(() =>
    baselines.filter(b => !b.isDeleted),
  [baselines]);

  const selectableForCompare = useMemo(() =>
    baselineOptions.filter(b => b.isFrozen),
  [baselineOptions]);

  // ── derived counts ───────────────────────────────────────────────────────
  const frozenCount = baselineOptions.filter(b => b.isFrozen).length;

  /* ── render ─────────────────────────────────────────────────────────────── */
  if (loading) return <div className="bl-muted">Loading baselines...</div>;

  return (
    <div className="bl-panel">
      {/* ── Header bar ───────────────────────────────────────────────────── */}
      <div className="bl-header">
        <div className="bl-header-left">
          <span className="bl-title">Baselines</span>
          <span className="bl-badge">{baselineOptions.length} total</span>
          {frozenCount > 0 && <span className="bl-badge bl-badge-frozen">{frozenCount} frozen</span>}
        </div>
        <div className="bl-header-right">
          {compareMode ? (
            <>
              <span className="bl-compare-label">Compare:</span>
              <select
                className="bl-select"
                value={compareA || ''}
                onChange={e => setCompareA(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- Select A --</option>
                {selectableForCompare.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.partRevision})</option>
                ))}
              </select>
              <span className="bl-compare-vs">vs</span>
              <select
                className="bl-select"
                value={compareB || ''}
                onChange={e => setCompareB(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- Select B --</option>
                {selectableForCompare.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.partRevision})</option>
                ))}
              </select>
              <Button variant="primary" size="sm" onClick={handleCompare}
                      disabled={!compareA || !compareB || comparing}>
                {comparing ? 'Comparing...' : 'Go'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => {
                setCompareMode(false); setCompareA(null); setCompareB(null); setCompareResult(null);
              }}>Cancel</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm"
                      onClick={() => setCompareMode(true)}
                      disabled={selectableForCompare.length < 2}>
                Compare
              </Button>
              <Button variant="primary" size="sm"
                      onClick={() => setShowForm(true)}>
                + Create Baseline
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && <div className="bl-error">{error}</div>}

      {/* ── Compare result ────────────────────────────────────────────────── */}
      {compareResult && (
        <div className="bl-compare-result">
          <div className="bl-compare-title">
            Comparing <strong>{compareResult.baselineA?.name}</strong> vs{' '}
            <strong>{compareResult.baselineB?.name}</strong>
          </div>
          <div className="bl-compare-summary">
            <span className="bl-compare-stat bl-added">{compareResult.totalAdded} added</span>
            <span className="bl-compare-stat bl-removed">{compareResult.totalRemoved} removed</span>
            <span className="bl-compare-stat bl-modified">{compareResult.totalModified} modified</span>
          </div>

          {compareResult.totalAdded > 0 && (
            <div className="bl-compare-section">
              <div className="bl-compare-section-title bl-added-title">Added Parts</div>
              <table className="bl-table bl-compare-table">
                <thead><tr><th>Part Number</th><th>Name</th><th>Revision</th><th>Qty</th><th>Level</th></tr></thead>
                <tbody>
                  {compareResult.added.map((l, i) => (
                    <tr key={i} className="bl-row-added">
                      <td className="bl-mono">{l.partNumber}</td>
                      <td>{l.partName}</td>
                      <td>{l.partRevision}</td>
                      <td>{l.quantity}{l.unit ? ` ${l.unit}` : ''}</td>
                      <td>{l.bomLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {compareResult.totalRemoved > 0 && (
            <div className="bl-compare-section">
              <div className="bl-compare-section-title bl-removed-title">Removed Parts</div>
              <table className="bl-table bl-compare-table">
                <thead><tr><th>Part Number</th><th>Name</th><th>Revision</th><th>Qty</th><th>Level</th></tr></thead>
                <tbody>
                  {compareResult.removed.map((l, i) => (
                    <tr key={i} className="bl-row-removed">
                      <td className="bl-mono">{l.partNumber}</td>
                      <td>{l.partName}</td>
                      <td>{l.partRevision}</td>
                      <td>{l.quantity}{l.unit ? ` ${l.unit}` : ''}</td>
                      <td>{l.bomLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {compareResult.totalModified > 0 && (
            <div className="bl-compare-section">
              <div className="bl-compare-section-title bl-modified-title">Modified Parts</div>
              <table className="bl-table bl-compare-table">
                <thead><tr><th>Part Number</th><th>Name</th><th>Change</th><th>Old Rev</th><th>New Rev</th><th>Old Qty</th><th>New Qty</th></tr></thead>
                <tbody>
                  {compareResult.modified.map((d, i) => (
                    <tr key={i} className="bl-row-modified">
                      <td className="bl-mono">{d.partNumber}</td>
                      <td>{d.partName}</td>
                      <td><span className="bl-change-chip">{d.change}</span></td>
                      <td className="bl-old-val">{d.oldRevision}</td>
                      <td className="bl-new-val">{d.newRevision}</td>
                      <td className="bl-old-val">{String(d.oldQuantity)}{d.oldUnit ? ` ${d.oldUnit}` : ''}</td>
                      <td className="bl-new-val">{String(d.newQuantity)}{d.newUnit ? ` ${d.newUnit}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {compareResult.totalAdded === 0 && compareResult.totalRemoved === 0 && compareResult.totalModified === 0 && (
            <div className="bl-muted" style={{ padding: 12 }}>No differences found between these baselines.</div>
          )}
        </div>
      )}

      {/* ── Create form ───────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bl-form">
          <div className="bl-form-title">New Baseline</div>
          <div className="bl-form-row">
            <label className="bl-form-label">Name *</label>
            <input
              className="bl-input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Rev B Release"
            />
          </div>
          <div className="bl-form-row">
            <label className="bl-form-label">Type</label>
            <select
              className="bl-select bl-select-full"
              value={form.baselineType}
              onChange={e => setForm({ ...form, baselineType: e.target.value })}
            >
              <option value="PRODUCT">Product</option>
              <option value="MILESTONE">Milestone</option>
              <option value="BUILD">Build</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="bl-form-row">
            <label className="bl-form-label">Description</label>
            <textarea
              className="bl-textarea"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What this baseline captures..."
              rows={3}
            />
          </div>
          <div className="bl-form-actions">
            <Button variant="primary" size="sm" onClick={handleCreate}
                    disabled={!form.name.trim() || creating}>
              {creating ? 'Capturing BOM...' : 'Capture BOM Snapshot'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && baselineOptions.length === 0 && !showForm && (
        <div className="bl-empty">
          <div className="bl-empty-icon">📸</div>
          <div className="bl-empty-title">No baselines created yet</div>
          <div className="bl-empty-text">
            Capture a BOM snapshot to freeze your product configuration.
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            + Create Baseline
          </Button>
        </div>
      )}

      {/* ── Baseline list ─────────────────────────────────────────────────── */}
      {baselineOptions.map(b => (
        <div key={b.id} className={`bl-card ${b.isFrozen ? 'bl-card-frozen' : ''}`}>
          <div className="bl-card-header" onClick={() => handleToggle(b.id)}>
            <div className="bl-card-left">
              <span className="bl-expand-icon">{expandedId === b.id ? '▼' : '▶'}</span>
              <div>
                <div className="bl-card-name">{b.name}</div>
                <div className="bl-card-meta">
                  <span className="bl-type-badge" style={{ background: TYPE_COLORS[b.baselineType] || '#6b7280' }}>
                    {b.baselineType}
                  </span>
                  <span className="bl-mono">{b.partNumber} {b.partName}</span>
                  <span className="bl-rev">Rev {b.partRevision}</span>
                  <span>{b.totalLines ?? '?'} lines</span>
                  {b.isFrozen && <span className="bl-frozen-tag">FROZEN</span>}
                  <span className="bl-date">{b.createdAt ? String(b.createdAt).replace('T', ' ').substring(0, 16) : ''}</span>
                </div>
              </div>
            </div>
            <div className="bl-card-actions" onClick={e => e.stopPropagation()}>
              {!b.isFrozen && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => handleFreeze(b.id)}>Freeze</Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDelete(b.id)}>Delete</Button>
                </>
              )}
              {b.isFrozen && b.frozenAt && (
                <span className="bl-frozen-info" title={`Frozen by ${b.frozenBy || 'system'}`}>
                  Frozen {String(b.frozenAt).replace('T', ' ').substring(0, 16)}
                </span>
              )}
            </div>
          </div>

          {/* ── Expanded lines ──────────────────────────────────────────── */}
          {expandedId === b.id && (
            <div className="bl-lines">
              {linesLoading[b.id] ? (
                <div className="bl-muted">Loading BOM lines...</div>
              ) : (lines[b.id] && lines[b.id].length > 0) ? (
                <table className="bl-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Part Number</th><th>Name</th><th>Revision</th>
                      <th>Qty</th><th>Unit</th><th>Find No.</th><th>Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines[b.id].map((l, i) => (
                      <tr key={l.id || i}>
                        <td>{i + 1}</td>
                        <td className="bl-mono">{l.partNumber}</td>
                        <td>{l.partName}</td>
                        <td>{l.partRevision}</td>
                        <td>{String(l.quantity)}</td>
                        <td>{l.unit}</td>
                        <td className="bl-mono">{l.findNumber || '—'}</td>
                        <td>{l.bomLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="bl-muted">No BOM lines captured in this baseline.</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BaselinePanel;
