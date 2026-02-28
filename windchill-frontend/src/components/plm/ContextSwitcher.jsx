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

const TYPE_ROUTES = {
  PRODUCT: '/plm/parts',
  PROJECT: '/plm/projects',
  LIBRARY: '/plm/library',
};

const TYPE_LABELS = {
  PRODUCT: '📦 Open Workspace →',
  PROJECT: '🗂️ View Projects page →',
  LIBRARY: '📚 View Library →',
};

const ContextSwitcher = () => {
  const navigate = useNavigate();
  const { selectedContextId, setSelectedContextId } = useContext(PlmWorkspaceContext);

  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', contextType: 'PRODUCT', description: '' });

  const selected = useMemo(
    () => contexts.find(c => c.id === selectedContextId) || null,
    [contexts, selectedContextId]
  );

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const data = await plmApi.listContexts();
      const list = data || [];
      setContexts(list);
      if (selectedContextId && !list.some(c => c.id === selectedContextId)) {
        setSelectedContextId(null); return;
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

  const routeForType = (ctx) => TYPE_ROUTES[ctx?.contextType] || '/plm/parts';

  const onChange = (e) => {
    const id  = Number(e.target.value);
    const ctx = contexts.find(c => c.id === id);
    setSelectedContextId(id);
    navigate(routeForType(ctx));
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

  const typeStyle = selected ? (TYPE_COLORS[selected.contextType] || TYPE_COLORS.PRODUCT) : null;

  return (
    <div className="plm-block">
      <div className="plm-block-header">
        <div>
          <div className="plm-block-title">Context</div>
          <div className="plm-block-sub">Select container (Product/Project/Library)</div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowCreate(v => !v)}>
          {showCreate ? 'Close' : 'New'}
        </Button>
      </div>

      {loading ? (
        <div className="plm-muted">Loading contexts...</div>
      ) : (
        <select className="plm-select" value={selectedContextId || ''} onChange={onChange}>
          <option value="" disabled>Select context</option>
          {(contexts || []).map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
          ))}
        </select>
      )}

      {selected && (
        <div className="plm-kv">
          <div>
            <span className="k">Type</span>
            <span
              className="v"
              style={{
                background:   typeStyle?.bg,
                color:        typeStyle?.text,
                padding:      '2px 8px',
                borderRadius: '10px',
                fontWeight:   600,
                fontSize:     '0.75rem',
              }}
            >
              {selected.contextType}
            </span>
          </div>
          <div><span className="k">Code</span><span className="v">{selected.code}</span></div>

          {/* Context-type shortcut button — shown for all 3 types */}
          <div style={{ marginTop: 6 }}>
            <button
              style={{
                fontSize:     '0.75rem',
                color:        'white',
                background:   typeStyle?.btn || '#1e293b',
                border:       'none',
                borderRadius: 6,
                padding:      '4px 11px',
                cursor:       'pointer',
                fontWeight:   600,
                width:        '100%',
                textAlign:    'left',
              }}
              onClick={() => navigate(routeForType(selected))}
            >
              {TYPE_LABELS[selected.contextType] || '→ Open'}
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="plm-form">
          <input className="plm-input" placeholder="Code (e.g., LIB001)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
          <input className="plm-input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <select className="plm-select" value={form.contextType} onChange={e => setForm({ ...form, contextType: e.target.value })}>
            <option value="PRODUCT">PRODUCT</option>
            <option value="PROJECT">PROJECT</option>
            <option value="LIBRARY">LIBRARY</option>
          </select>
          <textarea className="plm-textarea" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <Button variant="primary" size="sm" onClick={create}>Create</Button>
        </div>
      )}

      {error && <div className="plm-error">{error}</div>}
    </div>
  );
};

export default ContextSwitcher;
