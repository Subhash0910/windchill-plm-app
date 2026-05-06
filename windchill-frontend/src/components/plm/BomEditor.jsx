import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import './BomEditor.css';

const EFFECTIVITY_TYPE = {
  ALL:    'ALL',
  DATE:   'DATE',
  SERIAL: 'SERIAL',
  LOT:    'LOT',
};

const BomEditor = ({ parentPartId, candidateChildren }) => {
  const navigate = useNavigate();

  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [showAllVersions, setShowAllVersions] = useState(false);

  const [form, setForm] = useState({
    childPartId: '',
    quantity: 1,
    unit: 'EA',
    findNumber: '',
    referenceDesignator: '',
    sortOrder: 10,
    lineNote: '',
    effectivityType: 'ALL',
    effectivityStartDate: '',
    effectivityEndDate: '',
    effectivityStartSerial: '',
    effectivityEndSerial: '',
    effectivityLot: '',
  });

  const childById = useMemo(() => {
    const map = new Map();
    (candidateChildren || []).forEach(p => {
      if (p?.id != null) map.set(String(p.id), p);
    });
    return map;
  }, [candidateChildren]);

  const selectableChildren = useMemo(() => {
    const list = candidateChildren || [];
    const hasIsLatest = list.some(p => p?.isLatest !== undefined && p?.isLatest !== null);
    if (showAllVersions || !hasIsLatest) return list;
    return list.filter(p => p?.isLatest === true);
  }, [candidateChildren, showAllVersions]);

  useEffect(() => {
    if (!form.childPartId) return;
    const exists = (selectableChildren || []).some(p => String(p.id) === String(form.childPartId));
    if (!exists) {
      setForm(prev => ({ ...prev, childPartId: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllVersions, candidateChildren]);

  const load = async () => {
    if (!parentPartId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await plmApi.listBom(parentPartId);
      setLines(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load BOM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentPartId]);

  const resetForm = () => setForm({
    childPartId: '',
    quantity: 1,
    unit: 'EA',
    findNumber: '',
    referenceDesignator: '',
    sortOrder: 10,
    lineNote: '',
    effectivityType: 'ALL',
    effectivityStartDate: '',
    effectivityEndDate: '',
    effectivityStartSerial: '',
    effectivityEndSerial: '',
    effectivityLot: '',
  });

  const add = async () => {
    try {
      setError(null);
      const body = {
        childPartId: Number(form.childPartId),
        quantity: Number(form.quantity),
        unit: form.unit,
        findNumber: form.findNumber,
        referenceDesignator: form.referenceDesignator,
        sortOrder: Number(form.sortOrder),
        lineNote: form.lineNote,
        effectivityType: form.effectivityType,
      };

      if (form.effectivityType === EFFECTIVITY_TYPE.DATE) {
        body.effectivityStartDate = form.effectivityStartDate || null;
        body.effectivityEndDate = form.effectivityEndDate || null;
      }
      if (form.effectivityType === EFFECTIVITY_TYPE.SERIAL) {
        body.effectivityStartSerial = form.effectivityStartSerial || null;
        body.effectivityEndSerial = form.effectivityEndSerial || null;
      }
      if (form.effectivityType === EFFECTIVITY_TYPE.LOT) {
        body.effectivityLot = form.effectivityLot || null;
      }

      await plmApi.addBomLine(parentPartId, body);
      resetForm();
      setShowAdvanced(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to add BOM line');
    }
  };

  const remove = async (id) => {
    try {
      setError(null);
      await plmApi.deleteBomLine(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete BOM line');
    }
  };

  /* ── effectivity summary for table display ── */
  const effSummary = (l) => {
    const t = l.effectivityType || 'ALL';
    if (t === 'ALL')  return null;
    if (t === 'DATE') return `Date: ${l.effectivityStartDate || '…'} – ${l.effectivityEndDate || '…'}`;
    if (t === 'SERIAL') return `Serial: ${l.effectivityStartSerial || '…'} – ${l.effectivityEndSerial || '…'}`;
    if (t === 'LOT')  return `Lot: ${l.effectivityLot || '…'}`;
    return null;
  };

  const renderChild = (childPartId) => {
    const p = childById.get(String(childPartId));
    if (!p) return <span className="mono">{childPartId}</span>;

    return (
      <button
        type="button"
        className="bom-open"
        title="Open child part"
        onClick={() => navigate(`/plm/parts/${p.id}`)}
      >
        <span className="mono">{p.partNumber}</span>
        <span className="bom-open-sub">{p.name}{p.revision ? ` • Rev ${p.revision}.${p.iteration ?? ''}` : ''}</span>
      </button>
    );
  };

  const formatOptionLabel = (p) => {
    const rev = p?.revision != null ? `${p.revision}.${p.iteration ?? ''}` : '';
    const latest = p?.isLatest ? ' (Latest)' : '';
    const revText = rev ? ` • ${rev}` : '';
    return `${p.partNumber}${revText}${latest} — ${p.name || ''}`.trim();
  };

  const effectivityType = form.effectivityType || 'ALL';

  return (
    <div className="bom-wrap">
      <div className="bom-title">BOM</div>

      {loading ? (
        <div className="plm-muted">Loading BOM...</div>
      ) : (
        <table className="bom-table">
          <thead>
            <tr>
              <th>Find</th>
              <th>Ref Des</th>
              <th>Child</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Effectivity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(lines || []).map(l => (
              <tr key={l.id}>
                <td className="mono">{l.findNumber || '-'}</td>
                <td className="mono">{l.referenceDesignator || '-'}</td>
                <td>{renderChild(l.childPartId)}</td>
                <td>{l.quantity}</td>
                <td>{l.unit}</td>
                <td style={{ fontSize: 11, color: 'var(--wc-text-muted)' }}>
                  {effSummary(l) || (l.effectivityType || 'ALL')}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="link-btn" onClick={() => remove(l.id)}>Remove</button>
                </td>
              </tr>
            ))}
            {(!lines || lines.length === 0) && (
              <tr><td colSpan="7" className="plm-muted" style={{ padding: 10 }}>No BOM lines yet.</td></tr>
            )}
          </tbody>
        </table>
      )}

      <div className="bom-filter">
        <label className="bom-filter-label">
          <input type="checkbox" checked={showAllVersions} onChange={e => setShowAllVersions(e.target.checked)} />
          Show all versions (otherwise latest only)
        </label>
      </div>

      {/* ══ Add form ═══════════════════════════════════════════════ */}
      <div className="bom-add">
        <select
          className="plm-select"
          value={form.childPartId}
          onChange={e => setForm({ ...form, childPartId: e.target.value })}
        >
          <option value="">Select child part</option>
          {(selectableChildren || []).map(p => (
            <option key={p.id} value={p.id}>{formatOptionLabel(p)}</option>
          ))}
        </select>
        <input
          className="plm-input"
          type="number" min="0" step="1"
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: e.target.value })}
          placeholder="Qty"
        />
        <input
          className="plm-input"
          value={form.unit}
          onChange={e => setForm({ ...form, unit: e.target.value })}
          placeholder="Unit"
        />
        <input
          className="plm-input"
          value={form.findNumber}
          onChange={e => setForm({ ...form, findNumber: e.target.value })}
          placeholder="Find #"
          title="Find Number = line/item number (example: 10, 20, 30)"
        />
        <Button variant="secondary" size="sm" onClick={add} disabled={!form.childPartId}>Add</Button>
      </div>

      {/* ══ Advanced toggle ════════════════════════════════════════ */}
      <div className="bom-advanced-toggle">
        <button
          type="button"
          className="bom-advanced-btn"
          onClick={() => setShowAdvanced(v => !v)}
        >
          <span className={`bom-chevron ${showAdvanced ? 'bom-chevron--open' : ''}`}>&#9654;</span>
          <span>Advanced: Reference Designators &amp; Effectivity</span>
        </button>
      </div>

      {showAdvanced && (
        <div className="bom-advanced">
          {/* Reference Designator */}
          <div className="bom-adv-field">
            <label className="bom-adv-label">Reference Designators</label>
            <input
              className="plm-input"
              value={form.referenceDesignator}
              onChange={e => setForm({ ...form, referenceDesignator: e.target.value })}
              placeholder="e.g. R1,R2,R3"
              title="Comma-separated reference designators"
            />
            <span className="bom-adv-hint">Comma-separated (e.g. R1,R2,R3)</span>
          </div>

          {/* Effectivity Type */}
          <div className="bom-adv-field">
            <label className="bom-adv-label">Effectivity Type</label>
            <select
              className="plm-select"
              value={form.effectivityType}
              onChange={e => setForm({ ...form, effectivityType: e.target.value })}
            >
              <option value="ALL">All Units</option>
              <option value="DATE">Date Range</option>
              <option value="SERIAL">Serial Range</option>
              <option value="LOT">Lot Number</option>
            </select>
          </div>

          {/* DATE fields */}
          {effectivityType === EFFECTIVITY_TYPE.DATE && (
            <div className="bom-adv-row">
              <div className="bom-adv-field">
                <label className="bom-adv-label">Start Date</label>
                <input
                  className="plm-input"
                  type="date"
                  value={form.effectivityStartDate}
                  onChange={e => setForm({ ...form, effectivityStartDate: e.target.value })}
                />
              </div>
              <div className="bom-adv-field">
                <label className="bom-adv-label">End Date</label>
                <input
                  className="plm-input"
                  type="date"
                  value={form.effectivityEndDate}
                  onChange={e => setForm({ ...form, effectivityEndDate: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* SERIAL fields */}
          {effectivityType === EFFECTIVITY_TYPE.SERIAL && (
            <div className="bom-adv-row">
              <div className="bom-adv-field">
                <label className="bom-adv-label">Start Serial</label>
                <input
                  className="plm-input"
                  value={form.effectivityStartSerial}
                  onChange={e => setForm({ ...form, effectivityStartSerial: e.target.value })}
                  placeholder="e.g. SN-00100"
                />
              </div>
              <div className="bom-adv-field">
                <label className="bom-adv-label">End Serial</label>
                <input
                  className="plm-input"
                  value={form.effectivityEndSerial}
                  onChange={e => setForm({ ...form, effectivityEndSerial: e.target.value })}
                  placeholder="e.g. SN-00500"
                />
              </div>
            </div>
          )}

          {/* LOT field */}
          {effectivityType === EFFECTIVITY_TYPE.LOT && (
            <div className="bom-adv-field">
              <label className="bom-adv-label">Lot Number</label>
              <input
                className="plm-input"
                value={form.effectivityLot}
                onChange={e => setForm({ ...form, effectivityLot: e.target.value })}
                placeholder="e.g. LOT-2026-05"
              />
            </div>
          )}

          {/* Line Note */}
          <div className="bom-adv-field">
            <label className="bom-adv-label">Line Note</label>
            <input
              className="plm-input"
              value={form.lineNote}
              onChange={e => setForm({ ...form, lineNote: e.target.value })}
              placeholder="Optional note for this BOM line"
            />
          </div>

          {/* Sort Order */}
          <div className="bom-adv-field">
            <label className="bom-adv-label">Sort Order</label>
            <input
              className="plm-input"
              type="number" min="0" step="1"
              value={form.sortOrder}
              onChange={e => setForm({ ...form, sortOrder: e.target.value })}
              placeholder="10"
            />
          </div>
        </div>
      )}

      {error && <div className="plm-error">{error}</div>}
    </div>
  );
};

export default BomEditor;
