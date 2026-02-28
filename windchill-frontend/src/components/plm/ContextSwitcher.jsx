import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './ContextSwitcher.css';

const TYPE_COLORS = {
  PRODUCT: { bg: '#dbeafe', text: '#1e40af', btn: '#1d4ed8' },
  PROJECT: { bg: '#ede9fe', text: '#5b21b6', btn: '#5b21b6' },
  LIBRARY: { bg: '#dcfce7', text: '#166534', btn: '#166534' },
};
const TYPE_ROUTES = { PRODUCT: '/plm/parts', PROJECT: '/plm/projects', LIBRARY: '/plm/library' };
const TYPE_LABELS = { PRODUCT: '📦 Open Workspace →', PROJECT: '🗂️ View Projects →', LIBRARY: '📚 View Library →' };

const ContextSwitcher = () => {
  const navigate = useNavigate();
  const { selectedContextId, setSelectedContextId } = useContext(PlmWorkspaceContext);

  const [contexts,  setContexts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState({ code: '', name: '', contextType: 'PRODUCT', description: '' });

  // Edit form
  const [showEdit,   setShowEdit]   = useState(false);
  const [editForm,   setEditForm]   = useState({ name: '', description: '' });
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);

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
      setError(e.response?.data?.message || e.message || 'Failed to load contexts');
      setSelectedContextId(null);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const routeFor = (ctx) => TYPE_ROUTES[ctx?.contextType] || '/plm/parts';

  const onChange = (e) => {
    const id = Number(e.target.value);
    setSelectedContextId(id);
    navigate(routeFor(contexts.find(c => c.id === id)));
    setShowEdit(false);
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
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create context');
    }
  };

  const openEdit = () => {
    if (!selected) return;
    setEditForm({ name: selected.name || '', description: selected.description || '' });
    setShowEdit(true);
    setShowCreate(false);
  };

  const saveEdit = async () => {
    if (!selectedContextId || !editForm.name.trim()) return;
    setSaving(true); setError(null);
    try {
      await plmApi.updateContext(selectedContextId, editForm);
      setShowEdit(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to update context');
    } finally { setSaving(false); }
  };

  const deleteCtx = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete context “${selected.name}” (${selected.code})?

This will also remove all folders and parts inside it.`)) return;
    setDeleting(true); setError(null);
    try {
      await plmApi.deleteContext(selectedContextId);
      setShowEdit(false);
      const remaining = contexts.filter(c => c.id !== selectedContextId);
      setSelectedContextId(remaining[0]?.id ?? null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete context');
    } finally { setDeleting(false); }
  };

  const typeStyle = selected ? (TYPE_COLORS[selected.contextType] || TYPE_COLORS.PRODUCT) : null;

  return (
    <div className="plm-block">
      <div className="plm-block-header">
        <div>
          <div className="plm-block-title">Context</div>
          <div className="plm-block-sub">Select container</div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setShowCreate(v => !v); setShowEdit(false); }}>
          {showCreate ? 'Close' : 'New'}
        </Button>
      </div>

      {loading ? (
        <div className="plm-muted">Loading…</div>
      ) : (
        <select className="plm-select" value={selectedContextId || ''} onChange={onChange}>
          <option value="" disabled>Select context</option>
          {contexts.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
          ))}
        </select>
      )}

      {selected && (
        <div className="plm-kv">
          <div>
            <span className="k">Type</span>
            <span className="v" style={{ background: typeStyle?.bg, color: typeStyle?.text, padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: '0.75rem' }}>
              {selected.contextType}
            </span>
          </div>
          <div><span className="k">Code</span><span className="v">{selected.code}</span></div>

          {/* Navigate shortcut */}
          <div style={{ marginTop: 6 }}>
            <button
              style={{ fontSize: '0.75rem', color: 'white', background: typeStyle?.btn || '#1e293b', border: 'none', borderRadius: 6, padding: '4px 11px', cursor: 'pointer', fontWeight: 600, width: '100%', textAlign: 'left' }}
              onClick={() => navigate(routeFor(selected))}
            >
              {TYPE_LABELS[selected.contextType] || '→ Open'}
            </button>
          </div>

          {/* Edit / Delete */}
          <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
            <button
              style={{ flex: 1, fontSize: '0.72rem', padding: '4px 0', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', color: '#475569', fontWeight: 600 }}
              onClick={openEdit}
            >
              ✏️ Rename
            </button>
            <button
              style={{ flex: 1, fontSize: '0.72rem', padding: '4px 0', background: deleting ? '#fecaca' : '#fee2e2', border: '1px solid #fecaca', borderRadius: 5, cursor: deleting ? 'not-allowed' : 'pointer', color: '#991b1b', fontWeight: 600 }}
              onClick={deleteCtx}
              disabled={deleting}
            >
              {deleting ? '↻…' : '🗑️ Remove'}
            </button>
          </div>
        </div>
      )}

      {/* Edit (rename) form */}
      {showEdit && selected && (
        <div className="plm-form" style={{ marginTop: 8 }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>Code: <strong>{selected.code}</strong> | Type: <strong>{selected.contextType}</strong></div>
          <input
            className="plm-input"
            placeholder="Name *"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
          />
          <textarea
            className="plm-textarea"
            placeholder="Description (optional)"
            value={editForm.description}
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="primary" size="sm" onClick={saveEdit} disabled={saving || !editForm.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="plm-form">
          <input className="plm-input" placeholder="Code (e.g. LIB001)" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
          <input className="plm-input" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <select className="plm-select" value={form.contextType} onChange={e => setForm({...form, contextType: e.target.value})}>
            <option value="PRODUCT">PRODUCT</option>
            <option value="PROJECT">PROJECT</option>
            <option value="LIBRARY">LIBRARY</option>
          </select>
          <textarea className="plm-textarea" placeholder="Description (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <Button variant="primary" size="sm" onClick={create}>Create</Button>
        </div>
      )}

      {error && <div className="plm-error">{error}</div>}
    </div>
  );
};

export default ContextSwitcher;
