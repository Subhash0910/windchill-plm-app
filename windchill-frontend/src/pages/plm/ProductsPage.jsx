import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './ProductsPage.css';

const STATUS_COLORS = {
  DRAFT:    { bg: '#fef3c7', text: '#92400e' },
  ACTIVE:   { bg: '#dbeafe', text: '#1e40af' },
  RELEASED: { bg: '#dcfce7', text: '#166534' },
  INACTIVE: { bg: '#f1f5f9', text: '#475569' },
  OBSOLETE: { bg: '#fce7f3', text: '#9d174d' },
};
const STATUSES = ['DRAFT', 'ACTIVE', 'RELEASED', 'INACTIVE', 'OBSOLETE'];
const EMPTY_FORM = { productCode: '', name: '', description: '', status: 'DRAFT', version: '', projectId: '' };

const ProductsPage = () => {
  const navigate = useNavigate();
  const { setSelectedContextId } = useContext(PlmWorkspaceContext);

  // ── PLM Product Contexts ────────────────────────────────────────────
  const [plmContexts, setPlmContexts] = useState([]);
  const [ctxLoading,  setCtxLoading]  = useState(true);

  const loadContexts = useCallback(async () => {
    setCtxLoading(true);
    try {
      const all = await plmApi.listContexts();
      setPlmContexts((all || []).filter(c => c.contextType === 'PRODUCT'));
    } catch { setPlmContexts([]); }
    finally { setCtxLoading(false); }
  }, []);
  useEffect(() => { loadContexts(); }, [loadContexts]);

  const openContext = (ctx) => {
    setSelectedContextId(ctx.id);
    navigate('/plm/parts');
  };

  // ── Product entities ──────────────────────────────────────────────
  const [products,  setProducts]  = useState([]);
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
    try   { const d = await plmApi.getAllProducts(); setProducts(Array.isArray(d) ? d : []); }
    catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { load(); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try   { const d = await plmApi.searchProducts(search.trim()); setProducts(Array.isArray(d) ? d : []); }
      catch { setProducts([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setError(''); setShowForm(true); };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      productCode: p.productCode || '',
      name:        p.name        || '',
      description: p.description || '',
      status:      p.status      || 'DRAFT',
      version:     p.version     || '',
      projectId:   p.projectId   || '',
    });
    setError(''); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.productCode.trim() || !form.name.trim()) { setError('Product code and name are required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, projectId: form.projectId ? Number(form.projectId) : null };
      editId ? await plmApi.updateProduct(editId, payload) : await plmApi.createProduct(payload);
      setShowForm(false); setSearch(''); await load();
    } catch (ex) { setError(ex?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete product ${code}?`)) return;
    try   { await plmApi.deleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id)); }
    catch { alert('Failed to delete product'); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="pd-page">
      <div className="pd-page-header">
        <div>
          <h1 className="pd-page-title">📦 Products</h1>
          <p className="pd-page-sub">PLM product contexts &amp; product catalog</p>
        </div>
        <button className="pd-btn-create" onClick={openCreate}>+ New Product</button>
      </div>

      {/* ──────────────── SECTION 1 — PLM Product Contexts ──────────────── */}
      <div className="pd-ctx-section">
        <div className="pd-section-header">
          <h2 className="pd-section-title">🏢 PLM Product Contexts</h2>
          <p className="pd-section-sub">Windchill-style product containers (created via the Context panel on the left)</p>
        </div>
        {ctxLoading ? (
          <div className="pd-ctx-loading">↻ Loading contexts…</div>
        ) : plmContexts.length === 0 ? (
          <div className="pd-ctx-empty">
            No PRODUCT-type contexts yet.
            Use <strong>Context → New</strong> on the left sidebar and choose type <strong>PRODUCT</strong>.
          </div>
        ) : (
          <div className="pd-ctx-table">
            {plmContexts.map(ctx => (
              <div className="pd-ctx-row" key={ctx.id}>
                <span className="pd-ctx-type-pill">PRODUCT</span>
                <span className="pd-ctx-code">{ctx.code}</span>
                <span className="pd-ctx-name">{ctx.name}</span>
                {ctx.description && (
                  <span className="pd-ctx-desc" title={ctx.description}>
                    {ctx.description.length > 50 ? ctx.description.slice(0, 50) + '…' : ctx.description}
                  </span>
                )}
                <button className="pd-ctx-open-btn" onClick={() => openContext(ctx)}>
                  Open Workspace →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="pd-section-divider"><span>📋 Product Catalog</span></div>

      {/* ──────────────── SECTION 2 — Product entities CRUD ─────────────── */}
      <div className="pd-search-wrap">
        <span className="pd-search-icon">🔍</span>
        <input
          className="pd-search"
          placeholder="Search by code, name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {searching && <span className="pd-search-spin" />}
      </div>

      {showForm && (
        <div className="pd-modal-bg" onClick={() => setShowForm(false)}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-modal-header">
              <h2>{editId ? 'Edit Product' : 'New Product'}</h2>
              <button className="pd-modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form className="pd-form" onSubmit={handleSave}>
              <div className="pd-form-row">
                <div className="pd-field"><label>Product Code *</label><input value={form.productCode} onChange={f('productCode')} placeholder="e.g. PRD-001" /></div>
                <div className="pd-field"><label>Status</label><select value={form.status} onChange={f('status')}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div className="pd-field pd-field--full"><label>Name *</label><input value={form.name} onChange={f('name')} placeholder="Product name" /></div>
              <div className="pd-field pd-field--full"><label>Description</label><textarea value={form.description} onChange={f('description')} placeholder="Optional description…" rows={2} /></div>
              <div className="pd-form-row">
                <div className="pd-field"><label>Version</label><input value={form.version} onChange={f('version')} placeholder="e.g. 1.0" /></div>
                <div className="pd-field"><label>Project ID</label><input type="number" value={form.projectId} onChange={f('projectId')} placeholder="Optional" min="1" /></div>
              </div>
              {error && <div className="pd-form-error">{error}</div>}
              <div className="pd-form-actions">
                <button type="button" className="pd-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="pd-btn-save" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="pd-loading"><div className="pd-spinner" /><p>Loading products…</p></div>
      ) : products.length === 0 ? (
        <div className="pd-empty">
          <span>📦</span>
          <h3>{search ? 'No results found' : 'No product catalog entries yet'}</h3>
          <p>{search ? `No products match “${search}”` : 'Click “+ New Product” above to add one'}</p>
        </div>
      ) : (
        <div className="pd-table-wrap">
          <table className="pd-table">
            <thead>
              <tr>
                <th>Code</th><th>Name</th><th>Version</th><th>Status</th><th>Description</th><th>Project ID</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const c = STATUS_COLORS[p.status] || STATUS_COLORS.DRAFT;
                return (
                  <tr key={p.id}>
                    <td className="pd-code">{p.productCode}</td>
                    <td className="pd-name">{p.name}</td>
                    <td>{p.version || '—'}</td>
                    <td><span className="pd-badge" style={{ background: c.bg, color: c.text }}>{p.status}</span></td>
                    <td className="pd-desc">{p.description || '—'}</td>
                    <td>{p.projectId || '—'}</td>
                    <td>
                      <div className="pd-actions">
                        <button className="pd-btn-edit" onClick={() => openEdit(p)}>Edit</button>
                        <button className="pd-btn-del"  onClick={() => handleDelete(p.id, p.productCode)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="pd-count">{products.length} product{products.length !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
