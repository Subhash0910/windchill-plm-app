import { useState, useEffect, useCallback } from 'react';
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

  // Action dialog
  const [dialog, setDialog] = useState(null);
  // dialog = { type: 'checkout'|'promote'|'revise'|'delete', parts: [...], promoteTarget: '' }
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
      if (dialog.type === 'revise') {
        if (single.lifecycleState !== 'RELEASED') { setActError('Part must be RELEASED to revise.'); setActBusy(false); return; }
        const newRev = await plmApi.revisePart(single.id);
        closeDialog();
        navigate(`/plm/parts/${newRev.id}`);
        return;
      }
      if (dialog.type === 'delete') {
        await Promise.all(dialog.parts.map(p => plmApi.deletePart(p.id)));
        setSelected(new Set());
      }
      closeDialog();
      load();
    } catch (e) {
      setActError(e.response?.data?.message || e.message || 'Action failed.');
    } finally { setActBusy(false); }
  };

  /* ── version label ────────────────────────────────────────────────────── */
  const versionLabel = p => {
    if (p.revision && p.iteration != null) return `${p.revision}.${p.iteration}`;
    if (p.version) return p.version;
    return 'A.1';
  };

  /* ── toolbar button states ────────────────────────────────────────────── */
  const canCheckOut = single && !single.checkedOutBy
    && single.lifecycleState !== 'RELEASED'
    && single.lifecycleState !== 'OBSOLETE';

  const canPromote = single
    && (LIFECYCLE_TRANSITIONS[single.lifecycleState] ?? []).length > 0
    && !single.checkedOutBy;

  const canRevise = single
    && single.lifecycleState === 'RELEASED'
    && single.isLatest;

  const canDelete = selectedParts.length > 0
    && selectedParts.every(p => p.lifecycleState === 'INWORK' || p.lifecycleState === 'OBSOLETE');

  /* ── dialog meta ─────────────────────────────────────────────────────── */
  const DIALOG_META = {
    checkout: { title: '🔒 Check Out Part', headerCls: styles.dialogHeaderBlue,  confirmLabel: 'Check Out',  confirmCls: styles.btnBlue  },
    promote:  { title: '⬆ Promote Part',      headerCls: styles.dialogHeaderGreen, confirmLabel: 'Promote',    confirmCls: styles.btnGreen },
    revise:   { title: '📄 Revise Part',       headerCls: styles.dialogHeaderBlue,  confirmLabel: 'Revise',     confirmCls: styles.btnBlue  },
    delete:   { title: '⚠ Delete Part(s)',     headerCls: styles.dialogHeaderRed,   confirmLabel: 'Delete',     confirmCls: styles.btnRed   },
  };

  /* ──────────────────────────────────────────────────────────────────── */
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

          <div className={styles.divider} />

          <button
            className={styles.btnSecondary}
            disabled={selected.size !== 1}
            onClick={() => navigate(`/plm/parts/${single?.id}`)}
            title="Open detail page"
          >Edit</button>

          <button
            className={styles.btnSecondary}
            disabled={!canDelete}
            onClick={() => openDialog('delete')}
            title={canDelete ? '' : 'Select INWORK or OBSOLETE parts to delete'}
          >Delete</button>

          <div className={styles.divider} />

          <button
            className={styles.btnSecondary}
            disabled={!canCheckOut}
            onClick={() => openDialog('checkout')}
            title={canCheckOut ? '' : 'Select a single part that is not checked out, not RELEASED/OBSOLETE'}
          >🔒 Check Out</button>

          <button
            className={styles.btnSecondary}
            disabled={!canPromote}
            onClick={() => openDialog('promote')}
            title={canPromote ? '' : 'Select a single unlocked part that can advance its lifecycle'}
          >⬆ Promote</button>

          <button
            className={styles.btnSecondary}
            disabled={!canRevise}
            onClick={() => openDialog('revise')}
            title={canRevise ? '' : 'Select a single RELEASED latest part to create new revision'}
          >📄 Revise</button>
        </div>

        <div className={styles.toolbarRight}>
          <input
            className={styles.searchBox}
            placeholder="Search parts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={styles.btnIcon} title="Refresh" onClick={load}>↻</button>
          <button className={styles.btnIcon} title="Export to CSV" onClick={() => exportCsv(filtered)}>⬇</button>
        </div>
      </div>

      {/* Create panel */}
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

      {/* Action dialog */}
      {dialog && (() => {
        const meta = DIALOG_META[dialog.type];
        return (
          <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
              <div className={`${styles.dialogHeader} ${meta.headerCls}`}>{meta.title}</div>
              <div className={styles.dialogBody}>

                {/* CHECKOUT */}
                {dialog.type === 'checkout' && (
                  <>
                    <p>Check out <strong>{single.partNumber}</strong> ({versionLabel(single)})?</p>
                    <p className={styles.dialogHint}>
                      A new working iteration will be created (Iter {single.iteration + 1}).
                      The current iteration will become read-only until you check in.
                    </p>
                  </>
                )}

                {/* PROMOTE */}
                {dialog.type === 'promote' && (
                  <>
                    <p>Promote <strong>{single.partNumber}</strong> from <StateBadge state={single.lifecycleState} size="sm" />?</p>
                    <label className={styles.dialogLabel}>
                      Target state
                      <select
                        value={dialog.promoteTarget}
                        onChange={e => setDialog(d => ({ ...d, promoteTarget: e.target.value }))}
                      >
                        <option value="">-- select --</option>
                        {(LIFECYCLE_TRANSITIONS[single.lifecycleState] ?? []).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    {dialog.promoteTarget === 'UNDERREVIEW' && (
                      <p className={styles.dialogHint}>A promotion request will be created and a worklist item assigned to reviewers.</p>
                    )}
                    {dialog.promoteTarget === 'RELEASED' && (
                      <p className={styles.dialogHint}>⚠️ Releasing bumps to the next revision letter when next revised. Ensure BOM is complete.</p>
                    )}
                  </>
                )}

                {/* REVISE */}
                {dialog.type === 'revise' && (
                  <>
                    <p>Create a new revision of <strong>{single.partNumber}</strong>?</p>
                    <p className={styles.dialogHint}>
                      Current: <span className={styles.mono}>{versionLabel(single)}</span> (RELEASED).
                      A new part row with the next revision letter and iteration 1 will be created.
                      You will be redirected to the new revision.
                    </p>
                  </>
                )}

                {/* DELETE */}
                {dialog.type === 'delete' && (
                  <>
                    <p>Permanently delete {dialog.parts.length} part{dialog.parts.length > 1 ? 's' : ''}?</p>
                    <ul className={styles.deleteList}>
                      {dialog.parts.map(p => (
                        <li key={p.id}><span className={styles.mono}>{p.partNumber}</span> — {p.name}</li>
                      ))}
                    </ul>
                    <p className={styles.dialogHint}>⚠️ This action cannot be undone. BOM lines referencing these parts will also be removed.</p>
                  </>
                )}

                {actError && <div className={styles.actError}>{actError}</div>}

                <div className={styles.dialogActions}>
                  <button className={meta.confirmCls} onClick={confirmAction} disabled={actBusy}>
                    {actBusy ? 'Working…' : meta.confirmLabel}
                  </button>
                  <button className={styles.btnCancel} onClick={closeDialog} disabled={actBusy}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                <th>Number</th>
                <th>Name</th>
                <th>Version</th>
                <th>State</th>
                <th>Checked Out By</th>
                <th>Modified By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={styles.emptyRow}>No parts found.</td></tr>
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
                    {!p.isLatest && <span className={styles.notLatest} title="Not the latest iteration">*</span>}
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

/* ── CSV export helper ──────────────────────────────────────────────────── */
function exportCsv(parts) {
  const header = 'Part Number,Name,Revision,Iteration,State,Checked Out By\n';
  const rows   = parts.map(p =>
    [p.partNumber, p.name, p.revision, p.iteration, p.lifecycleState, p.checkedOutBy ?? '']
      .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = 'parts.csv'; a.click();
  URL.revokeObjectURL(url);
}
