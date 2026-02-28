import React, { useState, useEffect, useCallback } from 'react';
import { plmApi } from '../../services/plmApi';
import './DocumentsPage.css';

const STATUS_COLORS = {
  DRAFT:    { bg: '#fef3c7', text: '#92400e' },
  ACTIVE:   { bg: '#dbeafe', text: '#1e40af' },
  RELEASED: { bg: '#dcfce7', text: '#166534' },
  INACTIVE: { bg: '#f1f5f9', text: '#475569' },
  OBSOLETE: { bg: '#fce7f3', text: '#9d174d' },
};

const DOC_TYPES = ['SPECIFICATION', 'DRAWING', 'PROCEDURE', 'REPORT', 'MANUAL', 'TEMPLATE', 'OTHER'];
const STATUSES  = ['DRAFT', 'ACTIVE', 'RELEASED', 'INACTIVE', 'OBSOLETE'];

const EMPTY_FORM = {
  documentNumber: '',
  title:          '',
  description:    '',
  documentType:   'SPECIFICATION',
  version:        '1.0',
  status:         'DRAFT',
  projectId:      '',
};

const DocumentsPage = () => {
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [searching, setSearching] = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await plmApi.getAllDocuments();
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* live search with 300ms debounce */
  useEffect(() => {
    if (!search.trim()) { load(); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await plmApi.searchDocuments(search.trim());
        setDocs(Array.isArray(data) ? data : []);
      } catch { setDocs([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (doc) => {
    setEditId(doc.id);
    setForm({
      documentNumber: doc.documentNumber || '',
      title:          doc.title          || '',
      description:    doc.description    || '',
      documentType:   doc.documentType   || 'SPECIFICATION',
      version:        doc.version        || '1.0',
      status:         doc.status         || 'DRAFT',
      projectId:      doc.projectId      || '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.documentNumber.trim() || !form.title.trim()) {
      setError('Document number and title are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, projectId: form.projectId ? Number(form.projectId) : null };
      if (editId) {
        await plmApi.updateDocument(editId, payload);
      } else {
        await plmApi.createDocument(payload);
      }
      setShowForm(false);
      setSearch('');
      await load();
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Save failed. Check all fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, docNumber) => {
    if (!window.confirm(`Delete document ${docNumber}? This cannot be undone.`)) return;
    try {
      await plmApi.deleteDocument(id);
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch {
      alert('Failed to delete document');
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    if (d < 1) return 'today';
    if (d < 7) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="dp-page">

      {/* Page header */}
      <div className="dp-page-header">
        <div>
          <h1 className="dp-page-title">📄 Documents</h1>
          <p className="dp-page-sub">Document library — specs, drawings, procedures &amp; reports</p>
        </div>
        <button className="dp-btn-create" onClick={openCreate}>+ New Document</button>
      </div>

      {/* Search */}
      <div className="dp-search-wrap">
        <span className="dp-search-icon">🔍</span>
        <input
          className="dp-search"
          placeholder="Search by number, title, type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {searching && <span className="dp-search-spin" />}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="dp-modal-bg" onClick={() => setShowForm(false)}>
          <div className="dp-modal" onClick={e => e.stopPropagation()}>
            <div className="dp-modal-header">
              <h2>{editId ? 'Edit Document' : 'New Document'}</h2>
              <button className="dp-modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form className="dp-form" onSubmit={handleSave}>
              <div className="dp-form-row">
                <div className="dp-field">
                  <label>Document Number *</label>
                  <input value={form.documentNumber} onChange={f('documentNumber')} placeholder="e.g. DOC-001" />
                </div>
                <div className="dp-field">
                  <label>Version</label>
                  <input value={form.version} onChange={f('version')} placeholder="1.0" />
                </div>
              </div>
              <div className="dp-field dp-field--full">
                <label>Title *</label>
                <input value={form.title} onChange={f('title')} placeholder="Document title" />
              </div>
              <div className="dp-field dp-field--full">
                <label>Description</label>
                <textarea value={form.description} onChange={f('description')} placeholder="Optional description…" rows={3} />
              </div>
              <div className="dp-form-row">
                <div className="dp-field">
                  <label>Type</label>
                  <select value={form.documentType} onChange={f('documentType')}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="dp-field">
                  <label>Status</label>
                  <select value={form.status} onChange={f('status')}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="dp-field">
                  <label>Project ID</label>
                  <input type="number" value={form.projectId} onChange={f('projectId')} placeholder="Optional" min="1" />
                </div>
              </div>
              {error && <div className="dp-form-error">{error}</div>}
              <div className="dp-form-actions">
                <button type="button" className="dp-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="dp-btn-save" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="dp-loading"><div className="dp-spinner" /><p>Loading documents…</p></div>
      ) : docs.length === 0 ? (
        <div className="dp-empty">
          <span>📄</span>
          <h3>{search ? 'No results found' : 'No documents yet'}</h3>
          <p>{search ? `No documents match “${search}”` : 'Create the first document using the button above'}</p>
        </div>
      ) : (
        <div className="dp-table-wrap">
          <table className="dp-table">
            <thead>
              <tr>
                <th>Doc Number</th>
                <th>Title</th>
                <th>Type</th>
                <th>Ver</th>
                <th>Status</th>
                <th>Project</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => {
                const c = STATUS_COLORS[d.status] || STATUS_COLORS.DRAFT;
                return (
                  <tr key={d.id}>
                    <td className="dp-docnum">{d.documentNumber}</td>
                    <td className="dp-title">{d.title || '—'}</td>
                    <td><span className="dp-type-tag">{d.documentType || '—'}</span></td>
                    <td className="dp-version">v{d.version || '?'}</td>
                    <td><span className="dp-status-badge" style={{ background: c.bg, color: c.text }}>{d.status}</span></td>
                    <td className="dp-proj">{d.projectId || '—'}</td>
                    <td className="dp-date">{timeAgo(d.createdAt)}</td>
                    <td>
                      <div className="dp-actions">
                        <button className="dp-btn-edit" onClick={() => openEdit(d)}>Edit</button>
                        <button className="dp-btn-del"  onClick={() => handleDelete(d.id, d.documentNumber)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="dp-table-footer">{docs.length} document{docs.length !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
