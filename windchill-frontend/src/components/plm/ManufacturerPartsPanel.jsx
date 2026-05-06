import React, { useCallback, useEffect, useState } from 'react';
import Button from '../atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import './ManufacturerPartsPanel.css';

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'KRW'];

const EMPTY_FORM = {
  manufacturerName: '',
  manufacturerPartNumber: '',
  supplierName: '',
  unitCost: '',
  currency: 'USD',
  leadTimeDays: '',
  preferred: false,
  qualificationStatus: 'PENDING',
  minOrderQty: '',
  packagingQty: '',
};

const QUAL_MAP = {
  PENDING:  { label: 'Pending',  className: 'mfr-status--pending' },
  APPROVED: { label: 'Approved', className: 'mfr-status--approved' },
  REJECTED: { label: 'Rejected', className: 'mfr-status--rejected' },
};

const ManufacturerPartsPanel = ({ partId }) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);

  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [preferringId, setPreferringId] = useState(null);

  /* ── load ─────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!partId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await plmApi.getManufacturers(partId);
      setManufacturers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load manufacturer parts');
    } finally {
      setLoading(false);
    }
  }, [partId]);

  useEffect(() => { load(); }, [load]);

  /* ── add ──────────────────────────────────────────── */
  const handleAdd = async () => {
    if (!form.manufacturerName || !form.manufacturerPartNumber) {
      setFormError('Manufacturer name and part number are required');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      await plmApi.createManufacturer({
        partId: Number(partId),
        manufacturerName: form.manufacturerName,
        manufacturerPartNumber: form.manufacturerPartNumber,
        supplierName: form.supplierName || null,
        unitCost: form.unitCost ? Number(form.unitCost) : null,
        currency: form.currency,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : null,
        preferred: form.preferred,
        qualificationStatus: form.qualificationStatus,
        minOrderQty: form.minOrderQty ? Number(form.minOrderQty) : null,
        packagingQty: form.packagingQty ? Number(form.packagingQty) : null,
      });
      setForm(EMPTY_FORM);
      setShowAdd(false);
      await load();
    } catch (e) {
      setFormError(e.response?.data?.message || e.message || 'Failed to add manufacturer');
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this manufacturer from the AML?')) return;
    try {
      setDeletingId(id);
      setError(null);
      await plmApi.deleteManufacturer(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete manufacturer');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── set preferred ────────────────────────────────── */
  const handleSetPreferred = async (id) => {
    try {
      setPreferringId(id);
      setError(null);
      // Re-create with preferred=true via create then delete old, or use a PATCH.
      // For now, we reuse the existing data and re-create.
      const existing = manufacturers.find(m => m.id === id);
      if (!existing) return;
      await plmApi.deleteManufacturer(id);
      await plmApi.createManufacturer({
        partId: Number(partId),
        manufacturerName: existing.manufacturerName,
        manufacturerPartNumber: existing.manufacturerPartNumber,
        supplierName: existing.supplierName || null,
        unitCost: existing.unitCost || null,
        currency: existing.currency || 'USD',
        leadTimeDays: existing.leadTimeDays || null,
        preferred: true,
        qualificationStatus: existing.qualificationStatus || 'PENDING',
        minOrderQty: existing.minOrderQty || null,
        packagingQty: existing.packagingQty || null,
      });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to set preferred');
    } finally {
      setPreferringId(null);
    }
  };

  /* ── format cost ──────────────────────────────────── */
  const formatCost = (m) => {
    if (m.unitCost == null) return '—';
    const sym = { USD:'$', EUR:'€', GBP:'£', JPY:'¥', CNY:'¥', INR:'₹', KRW:'₩' }[m.currency] || m.currency || '$';
    return `${sym}${Number(m.unitCost).toFixed(2)}`;
  };

  /* ── states ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="mfr-panel">
        <div className="wc-spinner-wrap"><div className="wc-spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mfr-panel">
        <div className="mfr-error">
          <span>{error}</span>
          <button onClick={() => { setError(null); load(); }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mfr-panel">

      {/* ══ Header ═══════════════════════════════════════ */}
      <div className="mfr-header">
        <div>
          <span className="mfr-count">{manufacturers.length} source{manufacturers.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="mfr-header-actions">
          <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(v => !v)}>
            {showAdd ? 'Cancel' : '+ Add Manufacturer'}
          </Button>
        </div>
      </div>

      {/* ══ Add form ═════════════════════════════════════ */}
      {showAdd && (
        <div className="mfr-add-form">
          <div className="mfr-add-grid">
            <div className="mfr-field">
              <label className="mfr-label">Manufacturer Name *</label>
              <input
                className="plm-input"
                value={form.manufacturerName}
                onChange={e => setForm({ ...form, manufacturerName: e.target.value })}
                placeholder="e.g. Texas Instruments"
                disabled={saving}
              />
            </div>
            <div className="mfr-field">
              <label className="mfr-label">Manufacturer Part Number *</label>
              <input
                className="plm-input"
                value={form.manufacturerPartNumber}
                onChange={e => setForm({ ...form, manufacturerPartNumber: e.target.value })}
                placeholder="e.g. LM358N"
                disabled={saving}
              />
            </div>
            <div className="mfr-field">
              <label className="mfr-label">Supplier Name</label>
              <input
                className="plm-input"
                value={form.supplierName}
                onChange={e => setForm({ ...form, supplierName: e.target.value })}
                placeholder="e.g. Digi-Key"
                disabled={saving}
              />
            </div>

            <div className="mfr-row-2">
              <div className="mfr-field">
                <label className="mfr-label">Unit Cost</label>
                <input
                  className="plm-input"
                  type="number" min="0" step="0.01"
                  value={form.unitCost}
                  onChange={e => setForm({ ...form, unitCost: e.target.value })}
                  placeholder="0.00"
                  disabled={saving}
                />
              </div>
              <div className="mfr-field">
                <label className="mfr-label">Currency</label>
                <select
                  className="plm-select"
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}
                  disabled={saving}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="mfr-row-2">
              <div className="mfr-field">
                <label className="mfr-label">Lead Time (days)</label>
                <input
                  className="plm-input"
                  type="number" min="0" step="1"
                  value={form.leadTimeDays}
                  onChange={e => setForm({ ...form, leadTimeDays: e.target.value })}
                  placeholder="e.g. 14"
                  disabled={saving}
                />
              </div>
              <div className="mfr-field">
                <label className="mfr-label">Qualification Status</label>
                <select
                  className="plm-select"
                  value={form.qualificationStatus}
                  onChange={e => setForm({ ...form, qualificationStatus: e.target.value })}
                  disabled={saving}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="mfr-row-2">
              <div className="mfr-field">
                <label className="mfr-label">Min Order Qty</label>
                <input
                  className="plm-input"
                  type="number" min="0" step="1"
                  value={form.minOrderQty}
                  onChange={e => setForm({ ...form, minOrderQty: e.target.value })}
                  placeholder="e.g. 100"
                  disabled={saving}
                />
              </div>
              <div className="mfr-field">
                <label className="mfr-label">Packaging Qty</label>
                <input
                  className="plm-input"
                  type="number" min="0" step="1"
                  value={form.packagingQty}
                  onChange={e => setForm({ ...form, packagingQty: e.target.value })}
                  placeholder="e.g. 1000"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Preferred toggle */}
            <div className="mfr-field mfr-field--toggle">
              <label className="mfr-label">Preferred Source</label>
              <label className="mfr-toggle">
                <input
                  type="checkbox"
                  checked={form.preferred}
                  onChange={e => setForm({ ...form, preferred: e.target.checked })}
                  disabled={saving}
                />
                <span className="mfr-toggle-track" />
                <span className="mfr-toggle-text">{form.preferred ? 'Yes' : 'No'}</span>
              </label>
            </div>
          </div>

          {formError && <div className="mfr-form-error">{formError}</div>}

          <div className="mfr-form-actions">
            <Button variant="secondary" size="sm" onClick={() => { setShowAdd(false); setFormError(null); }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={saving || !form.manufacturerName || !form.manufacturerPartNumber}
            >
              {saving ? 'Adding...' : 'Add to AML'}
            </Button>
          </div>
        </div>
      )}

      {/* ══ Table / Empty ═════════════════════════════════ */}
      {manufacturers.length === 0 ? (
        <div className="mfr-empty">
          <span className="mfr-empty-icon">🏭</span>
          <p className="mfr-empty-title">No manufacturer parts defined</p>
          <p className="mfr-empty-sub">Add AML entries to track supply sources.</p>
        </div>
      ) : (
        <div className="mfr-table-wrap">
          <table className="mfr-table">
            <thead>
              <tr>
                <th></th>
                <th>Manufacturer</th>
                <th>MPN</th>
                <th>Supplier</th>
                <th>Cost</th>
                <th>Lead Time</th>
                <th>Qual Status</th>
                <th>Min / Pkg Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {manufacturers.map(m => {
                const q = QUAL_MAP[m.qualificationStatus] || QUAL_MAP.PENDING;
                return (
                  <tr key={m.id} className={m.preferred ? 'mfr-row--preferred' : ''}>
                    <td>
                      {m.preferred && <span className="mfr-star" title="Preferred source">&#9733;</span>}
                    </td>
                    <td className="mfr-name-cell">{m.manufacturerName || '-'}</td>
                    <td className="mono">{m.manufacturerPartNumber || '-'}</td>
                    <td>{m.supplierName || '-'}</td>
                    <td className="mono">{formatCost(m)}</td>
                    <td className="mono">{m.leadTimeDays != null ? `${m.leadTimeDays} days` : '—'}</td>
                    <td>
                      <span className={`mfr-status ${q.className}`}>{q.label}</span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {m.minOrderQty != null ? `Min ${m.minOrderQty}` : '—'}
                      {m.packagingQty != null ? ` / Pkg ${m.packagingQty}` : ''}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {!m.preferred && (
                        <button
                          className="mfr-action-btn mfr-action-btn--prefer"
                          onClick={() => handleSetPreferred(m.id)}
                          disabled={preferringId === m.id}
                          title="Set as preferred source"
                        >
                          {preferringId === m.id ? '...' : 'Set Preferred'}
                        </button>
                      )}
                      <button
                        className="mfr-action-btn mfr-action-btn--delete"
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        title="Remove from AML"
                      >
                        {deletingId === m.id ? '...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManufacturerPartsPanel;
