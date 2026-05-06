import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import './AlternatePartsPanel.css';

const EMPTY_FORM = {
  alternatePartId: '',
  priority: 1,
  quantityFactor: 1.0,
  substitutionCondition: '',
  twoWay: false,
};

const AlternatePartsPanel = ({ partId, contextId }) => {
  const navigate = useNavigate();

  const [alternates, setAlternates] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);

  /* add form */
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [formError,    setFormError]    = useState(null);

  /* part search */
  const [partSearch,   setPartSearch]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching,    setSearching]    = useState(false);

  /* delete confirmation */
  const [deletingId, setDeletingId] = useState(null);

  /* ── load alternates ──────────────────────────────── */
  const load = useCallback(async () => {
    if (!partId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await plmApi.getAlternates(partId);
      setAlternates(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load alternate parts');
    } finally {
      setLoading(false);
    }
  }, [partId]);

  useEffect(() => { load(); }, [load]);

  /* ── part search ──────────────────────────────────── */
  useEffect(() => {
    if (!partSearch || partSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await plmApi.searchParts(partSearch, contextId);
        setSearchResults((results || []).filter(p => String(p.id) !== String(partId)));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [partSearch, contextId, partId]);

  /* ── add ──────────────────────────────────────────── */
  const handleAdd = async () => {
    if (!form.alternatePartId) {
      setFormError('Please select an alternate part');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      await plmApi.createAlternate({
        partId: Number(partId),
        alternatePartId: Number(form.alternatePartId),
        priority: Number(form.priority),
        quantityFactor: Number(form.quantityFactor),
        substitutionCondition: form.substitutionCondition || null,
        twoWay: form.twoWay,
      });
      setForm(EMPTY_FORM);
      setPartSearch('');
      setSearchResults([]);
      setShowAdd(false);
      await load();
    } catch (e) {
      setFormError(e.response?.data?.message || e.message || 'Failed to add alternate part');
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this alternate part?')) return;
    try {
      setDeletingId(id);
      setError(null);
      await plmApi.deleteAlternate(id);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete alternate part');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── render helpers ────────────────────────────────── */
  const formatAltLabel = (alt) => {
    const num = alt.alternatePartNumber || alt.alternatePartId;
    const name = alt.alternatePartName || '';
    return name ? `${num} — ${name}` : String(num);
  };

  /* ── states ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="alt-panel">
        <div className="wc-spinner-wrap"><div className="wc-spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alt-panel">
        <div className="alt-error">
          <span>{error}</span>
          <button onClick={() => { setError(null); load(); }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="alt-panel">

      {/* ══ Header ═══════════════════════════════════════ */}
      <div className="alt-header">
        <div>
          <span className="alt-count">{alternates.length} alternate{alternates.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="alt-header-actions">
          <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(v => !v)}>
            {showAdd ? 'Cancel' : '+ Add Alternate'}
          </Button>
        </div>
      </div>

      {/* ══ Add form ═════════════════════════════════════ */}
      {showAdd && (
        <div className="alt-add-form">
          <div className="alt-add-grid">
            {/* Part picker with search */}
            <div className="alt-field">
              <label className="alt-label">Alternate Part</label>
              <input
                className="plm-input"
                value={partSearch}
                onChange={e => {
                  setPartSearch(e.target.value);
                  if (form.alternatePartId) setForm({ ...form, alternatePartId: '' });
                }}
                placeholder="Type to search parts..."
                disabled={saving}
              />
              {searching && <span className="alt-searching">Searching...</span>}
              {!searching && searchResults.length > 0 && !form.alternatePartId && (
                <div className="alt-search-results">
                  {searchResults.slice(0, 10).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className="alt-search-item"
                      onClick={() => {
                        setForm({ ...form, alternatePartId: String(p.id) });
                        setPartSearch(`${p.partNumber} — ${p.name || ''}`);
                        setSearchResults([]);
                      }}
                    >
                      <span className="mono">{p.partNumber}</span>
                      <span>{p.name}</span>
                      {p.revision && <span className="alt-rev">Rev {p.revision}.{p.iteration ?? ''}</span>}
                    </button>
                  ))}
                </div>
              )}
              {form.alternatePartId && (
                <div className="alt-selected-part">
                  Selected: <span className="mono">{partSearch}</span>
                  <button
                    type="button"
                    className="alt-clear-select"
                    onClick={() => { setForm({ ...form, alternatePartId: '' }); setPartSearch(''); }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="alt-field">
              <label className="alt-label">Priority</label>
              <input
                className="plm-input"
                type="number" min="1" step="1"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                disabled={saving}
              />
            </div>

            {/* Quantity Factor */}
            <div className="alt-field">
              <label className="alt-label">Quantity Factor</label>
              <input
                className="plm-input"
                type="number" min="0" step="0.01"
                value={form.quantityFactor}
                onChange={e => setForm({ ...form, quantityFactor: e.target.value })}
                disabled={saving}
              />
            </div>

            {/* Substitution Condition */}
            <div className="alt-field">
              <label className="alt-label">Substitution Condition</label>
              <input
                className="plm-input"
                value={form.substitutionCondition}
                onChange={e => setForm({ ...form, substitutionCondition: e.target.value })}
                placeholder="e.g. When primary is out of stock"
                disabled={saving}
              />
            </div>

            {/* Two-Way toggle */}
            <div className="alt-field alt-field--toggle">
              <label className="alt-label">Two-Way Substitution</label>
              <label className="alt-toggle">
                <input
                  type="checkbox"
                  checked={form.twoWay}
                  onChange={e => setForm({ ...form, twoWay: e.target.checked })}
                  disabled={saving}
                />
                <span className="alt-toggle-track" />
                <span className="alt-toggle-text">{form.twoWay ? 'Both directions' : 'One-way only'}</span>
              </label>
            </div>
          </div>

          {formError && <div className="alt-form-error">{formError}</div>}

          <div className="alt-form-actions">
            <Button variant="secondary" size="sm" onClick={() => { setShowAdd(false); setFormError(null); }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={saving || !form.alternatePartId}
            >
              {saving ? 'Adding...' : 'Add Alternate'}
            </Button>
          </div>
        </div>
      )}

      {/* ══ Table / Empty ═════════════════════════════════ */}
      {alternates.length === 0 ? (
        <div className="alt-empty">
          <span className="alt-empty-icon">🔄</span>
          <p className="alt-empty-title">No alternate parts defined</p>
          <p className="alt-empty-sub">Click "+ Add Alternate" to define substitute parts for this assembly.</p>
        </div>
      ) : (
        <div className="alt-table-wrap">
          <table className="alt-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Alternate Part</th>
                <th>Name</th>
                <th>Qty Factor</th>
                <th>Condition</th>
                <th>Two-Way</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alternates.map(alt => (
                <tr key={alt.id}>
                  <td className="mono">{alt.priority ?? '-'}</td>
                  <td>
                    <button
                      type="button"
                      className="alt-part-link"
                      onClick={() => alt.alternatePartId && navigate(`/plm/parts/${alt.alternatePartId}`)}
                    >
                      <span className="mono">{alt.alternatePartNumber || alt.alternatePartId || '-'}</span>
                    </button>
                  </td>
                  <td>{alt.alternatePartName || '-'}</td>
                  <td className="mono">{alt.quantityFactor ?? 1.0}</td>
                  <td style={{ fontSize: 12, color: 'var(--wc-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {alt.substitutionCondition || '—'}
                  </td>
                  <td>{alt.twoWay ? <span className="alt-badge alt-badge--yes">Both</span> : <span className="alt-badge alt-badge--no">One-Way</span>}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="alt-delete-btn"
                      onClick={() => handleDelete(alt.id)}
                      disabled={deletingId === alt.id}
                      title="Remove alternate"
                    >
                      {deletingId === alt.id ? '...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AlternatePartsPanel;
