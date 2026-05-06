import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StateBadge from '../../components/plm/StateBadge';
import { plmApi } from '../../services/plmApi';
import styles from './PartsPage.module.css';

const LIFECYCLE_TRANSITIONS = {
  INWORK:      ['UNDERREVIEW'],
  UNDERREVIEW: ['RELEASED', 'INWORK'],
  RELEASED:    ['OBSOLETE'],
  OBSOLETE:    [],
};

export default function PartsPage() {
  const navigate = useNavigate();
  const [parts,    setParts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [search,   setSearch]   = useState('');

  // Create panel
  const [creating, setCreating] = useState(false);
  const [form,     setForm]     = useState({ partNumber: '', name: '', description: '' });
  const [saving,   setSaving]   = useState(false);
  const [similar,  setSimilar]  = useState([]);
  const similarTimer = useRef(null);

  // Action dialog
  const [dialog, setDialog] = useState(null);
  const [actBusy, setActBusy] = useState(false);
  const [actError, setActError] = useState(null);

  const contextId = localStorage.getItem('activeContextId') || 1;

  const load = useCallback(() => {
    setLoading(true);
    plmApi.listParts(contextId)
      .then(data => { setParts(Array.isArray(data) ? data : []); setError(null); })
      .catch(e  => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [contextId]);

  useEffect(() => { load(); }, [load]);

  /* ── selection helpers ──────────────────────────────────────────────── */
  const filtered = parts.filter(p =>
    p.partNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleRow = id =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));

  const selectedParts = filtered.filter(p => selected.has(p.id));
  const single        = selectedParts.length === 1 ? selectedParts[0] : null;

  const checkSimilarity = (partNumber, name) => {
    clearTimeout(similarTimer.current);
    if (!partNumber.trim() && !name.trim()) { setSimilar([]); return; }
    similarTimer.current = setTimeout(async () => {
      const results = await plmApi.findSimilarParts(partNumber, name);
      setSimilar(results);
    }, 600);
  };

  const handleFormChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    checkSimilarity(next.partNumber, next.name);
  };

  /* ── create ────────────────────────────────────────────────────────────── */
  const handleNew = async () => {
    if (!form.partNumber.trim() || !form.name.trim()) return;
    setSaving(true);
    try {
      await plmApi.createPart({ ...form, contextId: Number(contextId) });
      setCreating(false);
      setForm({ partNumber: '', name: '', description: '' });
      load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  /* ── dialog actions ────────────────────────────────────────────────────── */
  const openDialog = (type) => {
    if (!selectedParts.length) return;
    const defaults = {
      checkout: {},
      promote: { promoteTarget: (LIFECYCLE_TRANSITIONS[single?.lifecycleState] ?? [])[0] ?? '' },
      revise: {},
      delete: {},
    };
    setActError(null);
    setDialog({ type, parts: selectedParts, ...defaults[type] });
  };

  const closeDialog = () => { setDialog(null); setActError(null); };

  const confirmAction = async () => {
    if (!dialog) return;
    setActBusy(true); setActError(null);
    try {
      if (dialog.type === 'checkout') {
        const working = await plmApi.checkOutPart(single.id);
        closeDialog();
        navigate(`/plm/parts/${working.id}`);
        return;
      }
      if (dialog.type === 'promote') {
        if (!dialog.promoteTarget) { setActError('Choose a target state.'); setActBusy(false); return; }
        await plmApi.promotePart(single.id, dialog.promoteTarget);
      }
      if (dialog.type === 'revise')  await plmApi.revisePart(single.id);
      if (dialog.type === 'delete') {
        await Promise.all(dialog.parts.map(p => plmApi.deletePart(p.id)));
      }
      closeDialog(); load(); setSelected(new Set());
    } catch (e) { setActError(e.response?.data?.message || e.message); }
    finally { setActBusy(false); }
  };

  /* ── render ────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <span className={styles.typeIcon}>⚙️</span>
          <div>
            <h1>Part Management</h1>
            <p className={styles.subtitle}>List and manage system components, assemblies, and physical objects.</p>
          </div>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.btnPrimary} onClick={() => setCreating(!creating)}>
            {creating ? 'Close Panel' : 'New Part'}
          </button>
          <div className={styles.divider} />
          <button className={styles.btnIcon} onClick={load} title="Refresh">🔄</button>
        </div>

        <div className={styles.toolbarRight}>
          <input
            className={styles.searchBox}
            placeholder="Filter by name or number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className={styles.divider} />
          <button className={styles.btnSecondary} disabled={!single || single.checkout} onClick={() => openDialog('checkout')}>Check Out</button>
          <button className={styles.btnSecondary} disabled={!single || !single.checkout} onClick={() => navigate(`/plm/parts/${single.id}`)}>Check In</button>
          <button className={styles.btnSecondary} disabled={!single} onClick={() => openDialog('promote')}>Promote</button>
          <button className={styles.btnSecondary} disabled={!single} onClick={() => openDialog('revise')}>Revise</button>
          <button className={styles.btnSecondary} disabled={!selected.size} onClick={() => openDialog('delete')}>Delete</button>
        </div>
      </div>

      {creating && (
        <div className={styles.createPanel}>
          <div className={styles.createHeader}>
            <span>Create New Part</span>
            <button className={styles.closeBtn} onClick={() => setCreating(false)}>×</button>
          </div>
          <div className={styles.createBody}>
            <label>Part Number <input value={form.partNumber} onChange={e => handleFormChange('partNumber', e.target.value)} /></label>
            <label>Part Name <input value={form.name} onChange={e => handleFormChange('name', e.target.value)} /></label>
            <label>Description <textarea rows="2" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></label>
            {similar.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 6, padding: '8px 12px', fontSize: 12, marginTop: 4 }}>
                <strong>⚠ Possible duplicates detected by AI:</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                  {similar.map(s => (
                    <li key={s.partNumber}>
                      <span style={{ fontFamily: 'monospace' }}>{s.partNumber}</span> — {s.name}
                      <span style={{ color: '#92400e', marginLeft: 6 }}>{Math.round(s.similarity * 100)}% match</span>
                    </li>
                  ))}
                </ul>
                <span style={{ color: '#78350f' }}>Review existing parts before creating a new one.</span>
              </div>
            )}
            <div className={styles.createActions}>
              <button className={styles.btnPrimary} disabled={saving} onClick={handleNew}>
                {saving ? 'Creating…' : 'Create Part'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner}>
          Failed to load parts: {error} <button onClick={load}>Retry</button>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.wcTable}>
          <thead>
            <tr>
              <th className={styles.checkCell}><input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length} onChange={toggleAll} /></th>
              <th>Part Number</th>
              <th>Name</th>
              <th>Version</th>
              <th>State</th>
              <th>Context</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className={styles.loadingBar}>Fetching parts from repository…</td></tr>
            ) : filtered.length ? (
              filtered.map(p => (
                <tr key={p.id} className={`${styles.row} ${selected.has(p.id) ? styles.rowSelected : ''}`} onClick={() => toggleRow(p.id)}>
                  <td className={styles.checkCell} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleRow(p.id)} /></td>
                  <td className={styles.linkCell}>
                    <span className={styles.link} onClick={e => { e.stopPropagation(); navigate(`/plm/parts/${p.id}`); }}>
                      {p.partNumber}
                    </span>
                    {p.checkout && <span className={styles.checkoutDot} title={`Checked out by ${p.checkoutUser}`}>●</span>}
                  </td>
                  <td className={styles.titleCell}>{p.name}</td>
                  <td>
                    <span className={styles.versionChip}>{p.version || 'A'}</span>
                    {!p.latest && <span className={styles.notLatest} title="Not Latest">(!)</span>}
                  </td>
                  <td><StateBadge state={p.lifecycleState} size="sm" /></td>
                  <td className={styles.dimCell}>{p.contextType}</td>
                  <td className={styles.dimCell}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className={styles.emptyRow}>No parts match your filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className={styles.statusBar}>
        Showing {filtered.length} parts in {contextId === 1 ? 'Global Context' : `Context ID: ${contextId}`}
      </footer>

      {dialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <div className={`${styles.dialogHeader} ${dialog.type === 'delete' ? styles.dialogHeaderRed : dialog.type === 'promote' ? styles.dialogHeaderGreen : styles.dialogHeaderBlue}`}>
              {dialog.type.charAt(0).toUpperCase() + dialog.type.slice(1)} Object(s)
            </div>
            <div className={styles.dialogBody}>
              {dialog.type === 'delete' ? (
                <>
                  <p>Are you sure you want to delete <strong>{dialog.parts.length}</strong> object(s)? This cannot be undone.</p>
                  <ul className={styles.deleteList}>
                    {dialog.parts.map(p => <li key={p.id} className={styles.mono}>{p.partNumber} - {p.name}</li>)}
                  </ul>
                </>
              ) : dialog.type === 'promote' ? (
                <>
                  <p>Set new lifecycle state for <strong>{single?.partNumber}</strong>.</p>
                  <label className={styles.dialogLabel}>
                    Target State
                    <select value={dialog.promoteTarget} onChange={e => setDialog({...dialog, promoteTarget: e.target.value})}>
                      {(LIFECYCLE_TRANSITIONS[single?.lifecycleState] || []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <p className={styles.dialogHint}>Promotion will trigger workflow notifications.</p>
                </>
              ) : dialog.type === 'revise' ? (
                <p>Create a new version (<strong>{(single?.version || 'A').charCodeAt(0) + 1}</strong>) for <strong>{single?.partNumber}</strong>?</p>
              ) : (
                <p>Check out <strong>{single?.partNumber}</strong> for editing?</p>
              )}

              {actError && <div className={styles.actError}>{actError}</div>}

              <div className={styles.dialogActions}>
                <button className={styles.btnCancel} onClick={closeDialog}>Cancel</button>
                <button 
                  className={dialog.type === 'delete' ? styles.btnRed : dialog.type === 'promote' ? styles.btnGreen : styles.btnBlue} 
                  disabled={actBusy} 
                  onClick={confirmAction}
                >
                  {actBusy ? 'Working…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
