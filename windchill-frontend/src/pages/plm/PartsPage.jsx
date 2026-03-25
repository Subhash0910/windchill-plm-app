import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StateBadge from '../../components/plm/StateBadge';
import styles from './PartsPage.module.css';

const API = import.meta.env.VITE_API_URL ?? '';

const COLS = [
  { key: 'partNumber', label: 'Number' },
  { key: 'name',       label: 'Name' },
  { key: 'version',    label: 'Version' },
  { key: 'state',      label: 'State' },
  { key: 'checkedOutBy', label: 'Checked Out By' },
  { key: 'modifiedBy', label: 'Modified By' },
];

export default function PartsPage() {
  const navigate = useNavigate();
  const [parts,    setParts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [search,   setSearch]   = useState('');
  const [creating, setCreating] = useState(false);
  const [form,     setForm]     = useState({ partNumber: '', name: '', description: '' });
  const [saving,   setSaving]   = useState(false);

  const contextId = localStorage.getItem('activeContextId') || 1;
  const token     = localStorage.getItem('token');
  const headers   = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/v1/plm/parts?contextId=${contextId}`, { headers })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => { setParts(Array.isArray(data) ? data : (data.data ?? [])); setError(null); })
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, [contextId]);

  useEffect(() => { load(); }, [load]);

  const filtered = parts.filter(p =>
    p.partNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleRow = id =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));

  const handleNew = async () => {
    if (!form.partNumber.trim() || !form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/v1/plm/parts`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...form, contextId: Number(contextId) }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCreating(false);
      setForm({ partNumber: '', name: '', description: '' });
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const versionLabel = p => {
    if (p.revision && p.iteration != null) return `${p.revision}.${p.iteration}`;
    if (p.version) return p.version;
    return 'A.1';
  };

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <span className={styles.typeIcon}>⚙</span>
          <div>
            <h1>Parts</h1>
            <p className={styles.subtitle}>Product structures and part masters</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.btnPrimary} onClick={() => setCreating(true)}>+ New</button>
          <button
            className={styles.btnSecondary}
            disabled={selected.size !== 1}
            onClick={() => navigate(`/plm/parts/${[...selected][0]}`)}
          >Edit</button>
          <button className={styles.btnSecondary} disabled={selected.size === 0}>Delete</button>
          <div className={styles.divider} />
          <button className={styles.btnSecondary} disabled={selected.size === 0}>Check Out</button>
          <button className={styles.btnSecondary} disabled={selected.size === 0}>Promote</button>
          <button className={styles.btnSecondary} disabled={selected.size === 0}>Revise</button>
        </div>
        <div className={styles.toolbarRight}>
          <input
            className={styles.searchBox}
            placeholder="Search parts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={styles.btnIcon} title="Refresh" onClick={load}>↻</button>
          <button className={styles.btnIcon} title="Export">⬇</button>
        </div>
      </div>

      {/* Create form slide-in */}
      {creating && (
        <div className={styles.createPanel}>
          <div className={styles.createHeader}>
            <span>New Part</span>
            <button className={styles.closeBtn} onClick={() => setCreating(false)}>✕</button>
          </div>
          <div className={styles.createBody}>
            <label>Part Number *
              <input value={form.partNumber} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} placeholder="e.g. ECU-010" />
            </label>
            <label>Name *
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Part name" />
            </label>
            <label>Description
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </label>
            <div className={styles.createActions}>
              <button className={styles.btnPrimary} onClick={handleNew} disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
              <button className={styles.btnSecondary} onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading && <div className={styles.loadingBar}><span>Loading…</span></div>}
        {error   && <div className={styles.errorBanner}>Error: {error} <button onClick={load}>Retry</button></div>}
        {!loading && !error && (
          <table className={styles.wcTable}>
            <thead>
              <tr>
                <th className={styles.checkCell}>
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                </th>
                {COLS.map(c => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={COLS.length + 1} className={styles.emptyRow}>No parts found.</td></tr>
              )}
              {filtered.map(p => (
                <tr
                  key={p.id}
                  className={`${styles.row} ${selected.has(p.id) ? styles.rowSelected : ''}`}
                  onClick={() => toggleRow(p.id)}
                  onDoubleClick={() => navigate(`/plm/parts/${p.id}`)}
                >
                  <td className={styles.checkCell} onClick={e => { e.stopPropagation(); toggleRow(p.id); }}>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleRow(p.id)} onClick={e => e.stopPropagation()} />
                  </td>
                  <td className={styles.linkCell}>
                    <span className={styles.link} onClick={e => { e.stopPropagation(); navigate(`/plm/parts/${p.id}`); }}>
                      {p.partNumber}
                    </span>
                  </td>
                  <td>{p.name}</td>
                  <td>
                    <span className={styles.versionChip}>{versionLabel(p)}</span>
                    {p.checkedOutBy && <span className={styles.checkoutDot} title={`Checked out by ${p.checkedOutBy}`}>●</span>}
                  </td>
                  <td><StateBadge state={p.lifecycleState} /></td>
                  <td className={styles.dimCell}>{p.checkedOutBy ?? '—'}</td>
                  <td className={styles.dimCell}>{p.updatedBy ?? p.createdBy ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.statusBar}>
        {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        {selected.size > 0 && <span> · {selected.size} selected</span>}
      </div>
    </div>
  );
}
