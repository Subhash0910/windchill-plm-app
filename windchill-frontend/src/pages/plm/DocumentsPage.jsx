import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../../services/documentApi';
import { usePlmContext } from '../../context/PlmContext';
import StateBadge from '../../components/plm/StateBadge';
import './DocumentsPage.css';

const DOC_TYPES = ['SPEC', 'DRAWING', 'PROCEDURE', 'REPORT'];

const TYPE_ICON = {
  SPEC:      '📌',
  DRAWING:   '📐',
  PROCEDURE: '📋',
  REPORT:    '📊',
};

const EMPTY_FORM = {
  docNumber:   '',
  name:        '',
  description: '',
  docType:     'SPEC',
};

const DocumentsPage = () => {
  const navigate = useNavigate();
  const { activeContext } = usePlmContext();
  const contextId = activeContext?.id;

  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [typeFilter,setTypeFilter]= useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [editDoc,   setEditDoc]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    if (!contextId) return;
    setLoading(true);
    try {
      const data = await documentApi.list(contextId, typeFilter || null);
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [contextId, typeFilter]);

  useEffect(() => { load(); }, [load]);

  // local search filter (no extra round-trip)
  const visible = search.trim()
    ? docs.filter(d =>
        d.docNumber.toLowerCase().includes(search.toLowerCase()) ||
        d.name.toLowerCase().includes(search.toLowerCase())
      )
    : docs;

  // ---- modal helpers ----------------------------------------------------
  const openCreate = () => {
    setEditDoc(null); setForm(EMPTY_FORM); setError(''); setShowForm(true);
  };
  const openEdit = (doc) => {
    setEditDoc(doc);
    setForm({ docNumber: doc.docNumber, name: doc.name, description: doc.description || '', docType: doc.docType });
    setError(''); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.docNumber.trim() || !form.name.trim()) {
      setError('Doc number and name are required'); return;
    }
    setSaving(true); setError('');
    try {
      if (editDoc) {
        await documentApi.update(editDoc.id, { name: form.name, description: form.description, docType: form.docType });
      } else {
        await documentApi.create({ contextId, docNumber: form.docNumber, name: form.name, description: form.description, docType: form.docType });
      }
      setShowForm(false);
      await load();
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete ${doc.docNumber}?`)) return;
    try { await documentApi.delete(doc.id); await load(); }
    catch { alert('Delete failed'); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="docp">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="docp__header">
        <div>
          <h1 className="docp__title">Documents</h1>
          <p className="docp__sub">Specs · Drawings · Procedures · Reports</p>
        </div>
        <button className="docp__btn-new" onClick={openCreate}>+ New Document</button>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="docp__toolbar">
        <div className="docp__search-wrap">
          <span>🔍</span>
          <input
            className="docp__search"
            placeholder="Search doc number or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="docp__type-tabs">
          <button
            className={`docp__tab ${typeFilter === '' ? 'active' : ''}`}
            onClick={() => setTypeFilter('')}
          >All</button>
          {DOC_TYPES.map(t => (
            <button
              key={t}
              className={`docp__tab ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {TYPE_ICON[t]} {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Create / Edit modal ────────────────────────────────────── */}
      {showForm && (
        <div className="docp__modal-bg" onClick={() => setShowForm(false)}>
          <div className="docp__modal" onClick={e => e.stopPropagation()}>
            <div className="docp__modal-hdr">
              <h2>{editDoc ? 'Edit Document' : 'New Document'}</h2>
              <button onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form className="docp__form" onSubmit={handleSave}>
              <div className="docp__row">
                <div className="docp__field">
                  <label>Doc Number *</label>
                  <input
                    value={form.docNumber}
                    onChange={f('docNumber')}
                    disabled={!!editDoc}
                    placeholder="e.g. SPEC-001"
                  />
                </div>
                <div className="docp__field">
                  <label>Type</label>
                  <select value={form.docType} onChange={f('docType')}>
                    {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="docp__field">
                <label>Name *</label>
                <input value={form.name} onChange={f('name')} placeholder="Document name" />
              </div>
              <div className="docp__field">
                <label>Description</label>
                <textarea value={form.description} onChange={f('description')} rows={3} placeholder="Optional description…" />
              </div>
              {error && <p className="docp__err">{error}</p>}
              <div className="docp__form-actions">
                <button type="button" className="docp__btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="docp__btn-save"  disabled={saving}>
                  {saving ? 'Saving…' : editDoc ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="docp__loading"><div className="docp__spin" /><span>Loading documents…</span></div>
      ) : visible.length === 0 ? (
        <div className="docp__empty">
          <span className="docp__empty-icon">📄</span>
          <h3>{search || typeFilter ? 'No matching documents' : 'No documents yet'}</h3>
          <p>{search || typeFilter ? 'Try changing filters' : 'Create the first document using the button above'}</p>
        </div>
      ) : (
        <div className="docp__table-wrap">
          <table className="docp__table">
            <thead>
              <tr>
                <th>Doc Number</th>
                <th>Name</th>
                <th>Type</th>
                <th>Rev</th>
                <th>State</th>
                <th>Checked Out</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(d => (
                <tr
                  key={d.id}
                  className="docp__row"
                  onClick={() => navigate(`/plm/documents/${d.id}`)}
                >
                  <td className="docp__docnum">
                    <span>{TYPE_ICON[d.docType] || '📄'}</span> {d.docNumber}
                  </td>
                  <td>{d.name}</td>
                  <td><span className="docp__type-pill">{d.docType}</span></td>
                  <td className="docp__ver">{d.versionLabel}</td>
                  <td><StateBadge state={d.lifecycleState} /></td>
                  <td className="docp__co">
                    {d.checkedOutBy
                      ? <span className="docp__co-badge">🔒 {d.checkedOutBy}</span>
                      : <span className="docp__co-free">—</span>}
                  </td>
                  <td className="docp__date">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="docp__actions">
                      <button className="docp__act-btn" onClick={() => openEdit(d)}>Edit</button>
                      <button className="docp__act-btn docp__act-del" onClick={() => handleDelete(d)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="docp__footer">{visible.length} document{visible.length !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
