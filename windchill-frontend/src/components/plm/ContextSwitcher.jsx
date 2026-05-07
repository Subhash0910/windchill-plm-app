import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './ContextSwitcher.css';

const TYPE_STYLE = {
  PRODUCT: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', btn: '#6366f1' },
  PROJECT: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', btn: '#6366f1' },
  LIBRARY: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', btn: '#6366f1' },
};
const TYPE_ROUTES = { PRODUCT: '/plm/parts', PROJECT: '/plm/projects', LIBRARY: '/plm/library' };
const TYPE_LABELS = { PRODUCT: 'Open Workspace →', PROJECT: 'View Projects →', LIBRARY: 'View Library →' };

const ContextSwitcher = () => {
  const navigate = useNavigate();
  const { selectedContextId, setSelectedContextId } = useContext(PlmWorkspaceContext);

  const [contexts,  setContexts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', contextType: 'PRODUCT', description: '' });

  const [showEdit, setShowEdit]   = useState(false);
  const [editForm, setEditForm]   = useState({ name: '', description: '' });
  const [saving,   setSaving]     = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const selected = useMemo(
    () => contexts.find(c => c.id === selectedContextId) || null,
    [contexts, selectedContextId]
  );

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const list = (await plmApi.listContexts()) || [];
      setContexts(list);
      if (selectedContextId && !list.some(c => c.id === selectedContextId)) {
        setSelectedContextId(list[0]?.id ?? null); return;
      }
      if (!selectedContextId && list.length > 0) setSelectedContextId(list[0].id);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const routeFor = (ctx) => TYPE_ROUTES[ctx?.contextType] || '/plm/parts';

  const onChange = (e) => {
    const id = Number(e.target.value);
    setSelectedContextId(id);
    navigate(routeFor(contexts.find(c => c.id === id)));
    setShowEdit(false); setShowCreate(false);
  };

  const create = async () => {
    try {
      setError(null);
      const created = await plmApi.createContext(form);
      setShowCreate(false);
      setForm({ code: '', name: '', contextType: 'PRODUCT', description: '' });
      await load();
      setSelectedContextId(created.id);
      navigate(TYPE_ROUTES[created.contextType] || '/plm/parts');
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed'); }
  };

  const openEdit = () => {
    if (!selected) return;
    setEditForm({ name: selected.name || '', description: selected.description || '' });
    setShowEdit(true); setShowCreate(false);
  };

  const saveEdit = async () => {
    if (!selectedContextId || !editForm.name.trim()) return;
    setSaving(true); setError(null);
    try {
      await plmApi.updateContext(selectedContextId, editForm);
      setShowEdit(false); await load();
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const deleteCtx = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete context "${selected.name}" (${selected.code})?\n\nThis will remove all folders and parts inside it.`)) return;
    setDeleting(true); setError(null);
    try {
      await plmApi.deleteContext(selectedContextId);
      setShowEdit(false);
      const remaining = contexts.filter(c => c.id !== selectedContextId);
      setSelectedContextId(remaining[0]?.id ?? null);
      await load();
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  const ts = selected ? (TYPE_STYLE[selected.contextType] || TYPE_STYLE.PRODUCT) : null;

  return (
    <div className="cs-panel">
      {/* ── Top row ── */}
      <div className="cs-panel__top">
        <span className="cs-panel__label">Context</span>
        <button
          className="cs-panel__new-btn"
          onClick={() => { setShowCreate(v => !v); setShowEdit(false); }}
        >
          {showCreate ? '✕' : '+ New'}
        </button>
      </div>

      {/* ── Select ── */}
      {loading ? (
        <div className="cs-panel__muted">Loading…</div>
      ) : (
        <select className="cs-panel__select" value={selectedContextId || ''} onChange={onChange}>
          <option value="" disabled>Select context</option>
          {contexts.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
          ))}
        </select>
      )}

      {/* ── Selected context meta ── */}
      {selected && (
        <>
          <div className="cs-panel__meta">
            <span
              className="cs-panel__type"
              style={{ background: ts?.bg, color: ts?.text }}
            >
              {selected.contextType}
            </span>
            <span className="cs-panel__code">{selected.code}</span>
          </div>

          <button
            className="cs-panel__nav-btn"
            style={{ background: ts?.btn, marginTop: 6, width: '100%' }}
            onClick={() => navigate(routeFor(selected))}
          >
            {TYPE_LABELS[selected.contextType] || '→ Open'}
          </button>

          <div className="cs-panel__actions">
            <button className="cs-panel__action-btn cs-panel__action-btn--rename" onClick={openEdit}>
              ✏️ Rename
            </button>
            <button
              className="cs-panel__action-btn cs-panel__action-btn--delete"
              onClick={deleteCtx}
              disabled={deleting}
            >
              {deleting ? '…' : '🗑 Remove'}
            </button>
          </div>
        </>
      )}

      {/* ── Edit form ── */}
      {showEdit && selected && (
        <div className="cs-panel__form">
          <div className="cs-panel__muted">Code: <strong>{selected.code}</strong> · {selected.contextType}</div>
          <input
            className="cs-panel__input"
            placeholder="Name *"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
          />
          <textarea
            className="cs-panel__textarea"
            placeholder="Description (optional)"
            value={editForm.description}
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
          />
          <div className="cs-panel__form-row">
            <button
              className="cs-panel__nav-btn"
              style={{ background: 'var(--wc-blue)', flex: 1 }}
              onClick={saveEdit}
              disabled={saving || !editForm.name.trim()}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              className="cs-panel__action-btn cs-panel__action-btn--rename"
              onClick={() => setShowEdit(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Create form ── */}
      {showCreate && (
        <div className="cs-panel__form">
          <input className="cs-panel__input" placeholder="Code (e.g. ECU001)" value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value })} />
          <input className="cs-panel__input" placeholder="Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <select className="cs-panel__select" value={form.contextType}
            onChange={e => setForm({ ...form, contextType: e.target.value })}>
            <option value="PRODUCT">PRODUCT</option>
            <option value="PROJECT">PROJECT</option>
            <option value="LIBRARY">LIBRARY</option>
          </select>
          <button
            className="cs-panel__nav-btn"
            style={{ background: 'var(--wc-blue)', width: '100%' }}
            onClick={create}
            disabled={!form.code.trim() || !form.name.trim()}
          >
            Create Context
          </button>
        </div>
      )}

      {error && <div className="cs-panel__error">⚠ {error}</div>}
    </div>
  );
};

export default ContextSwitcher;
