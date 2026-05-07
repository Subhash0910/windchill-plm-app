import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import StateBadge from '../../components/plm/StateBadge';
import { documentApi } from '../../services/documentApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import styles from './DocumentsPage.module.css';

const DOC_TYPES = ['SPEC', 'DRAWING', 'PROCEDURE', 'REPORT'];

const DocumentsPage = () => {
  const navigate = useNavigate();
  const { selectedContextId } = useContext(PlmWorkspaceContext);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ docNumber: '', name: '', description: '', docType: 'SPEC' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!selectedContextId) { setDocs([]); setLoading(false); return; }
    setLoading(true);
    documentApi.list(selectedContextId)
      .then(data => { setDocs(Array.isArray(data) ? data : []); setError(null); })
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [selectedContextId]);

  useEffect(() => { load(); }, [load]);

  const filtered = docs.filter(d =>
    d.docNumber?.toLowerCase().includes(search.toLowerCase()) ||
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleRow = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await documentApi.create({ ...form, contextId: Number(selectedContextId) });
      setCreating(false);
      setForm({ docNumber: '', name: '', description: '', docType: 'SPEC' });
      load();
    } catch (ex) { alert(ex.response?.data?.message || ex.message); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <span className={styles.typeIcon}>📄</span>
          <div>
            <h1>Document Management</h1>
            <p className={styles.subtitle}>Control specifications, manuals, and technical reports with revision history.</p>
          </div>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.btnPrimary} onClick={() => setCreating(!creating)}>
            {creating ? 'Close Panel' : 'New Document'}
          </button>
          <div className={styles.divider} />
          <button className={styles.btnSecondary} onClick={load}>Refresh</button>
        </div>
        <div className={styles.toolbarRight}>
          <input
            className={styles.searchBox}
            placeholder="Search documents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className={styles.divider} />
          <button className={styles.btnSecondary} disabled={selected.size === 0}>Actions</button>
        </div>
      </div>

      {creating && (
        <form className={styles.createPanel} onSubmit={handleCreate}>
          <div className={styles.createHeader}>
            <span>Create New Document</span>
            <button type="button" className={styles.closeBtn} onClick={() => setCreating(false)}>×</button>
          </div>
          <div className={styles.createBody}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <label>Number <input value={form.docNumber} onChange={e => setForm({ ...form, docNumber: e.target.value })} placeholder="DOC-0001" /></label>
              <label>Type
                <select value={form.docType} onChange={e => setForm({ ...form, docType: e.target.value })}>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <label>Title <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter document title" /></label>
            <label>Description <textarea rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
            <div className={styles.createActions}>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Creating…' : 'Create Document'}
              </button>
            </div>
          </div>
        </form>
      )}

      {error && <div className={styles.errorBanner}>Error: {error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.wcTable}>
          <thead>
            <tr>
              <th style={{ width: '40px' }} />
              <th>Doc Number</th>
              <th>Title</th>
              <th>Type</th>
              <th>Version</th>
              <th>State</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className={styles.loadingBar}>Loading documents…</td></tr>
            ) : filtered.length ? (
              filtered.map(d => (
                <tr key={d.id} className={selected.has(d.id) ? styles.rowSelected : ''} onClick={() => toggleRow(d.id)}>
                  <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleRow(d.id)} /></td>
                  <td className={styles.linkCell}>
                    <span className={styles.link} onClick={e => { e.stopPropagation(); navigate(`/plm/documents/${d.id}`); }}>
                      {d.docNumber || '—'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td className={styles.dimCell}>{d.docType}</td>
                  <td><span className={styles.versionChip}>{d.versionLabel || `${d.revision || 'A'}.${d.iteration || 1}`}</span></td>
                  <td><StateBadge state={d.lifecycleState} size="sm" /></td>
                  <td className={styles.dimCell}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className={styles.emptyRow}>No documents found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className={styles.statusBar}>
        Showing {filtered.length} documents • Last updated {new Date().toLocaleTimeString()}
      </footer>
    </div>
  );
};

export default DocumentsPage;
