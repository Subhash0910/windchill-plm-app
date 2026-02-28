import React, { useState, useEffect, useCallback } from 'react';
import { plmApi } from '../../services/plmApi';
import './ProductsPage.css';

const STATUS_COLORS = {
  DRAFT:    { bg: '#fef3c7', text: '#92400e' },
  ACTIVE:   { bg: '#dbeafe', text: '#1e40af' },
  RELEASED: { bg: '#dcfce7', text: '#166534' },
  INACTIVE: { bg: '#f1f5f9', text: '#475569' },
  OBSOLETE: { bg: '#fce7f3', text: '#9d174d' },
};

const STATUSES = ['DRAFT', 'ACTIVE', 'RELEASED', 'INACTIVE', 'OBSOLETE'];

const EMPTY_FORM = { productCode: '', name: '', description: '', status: 'DRAFT', version: '1.0', projectId: '' };

const ProductsPage = () => {
  const [products, setProducts]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [searching,setSearching]  = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editId,   setEditId]     = useState(null);
  const [form,     setForm]       = useState(EMPTY_FORM);
  const [saving,   setSaving]     = useState(false);
  const [error,    setError]      = useState('');

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
    setForm({ productCode: p.productCode||'', name: p.name||'', description: p.description||'',
              status: p.status||'DRAFT', version: p.version||'1.0', projectId: p.projectId||'' });
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
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete product ${code}?`)) return;
    try   { await plmApi.deleteProduct(id); setProducts(prev => prev.filter(p => p.id !== id)); }
    catch { alert('Failed to delete product'); }
  };

  const timeAgo = (d) => {
    if (!d) return '—';
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days < 1) return 'today';
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="pp-page">
      <div className="pp-page-header">
        <div>
          <h1 className="pp-page-title">📦 Products</h1>
          <p className="pp-page-sub">Product registry — manage your product catalog</p>
        </div>
        <button className="pp-btn-create" onClick={openCreate}>+ New Product</button>
      </div>

      <div className="pp-search-wrap">
        <span className="pp-search-icon">🔍</span>
        <input className="pp-search" placeholder="Search by code, name…" value={search} onChange={e => setSearch(e.target.value)} />
        {searching && <span className="pp-search-spin" />}
      </div>

      {showForm && (
        <div className="pp-modal-bg" onClick={() => setShowForm(false)}>
          <div className="pp-modal" onClick={e => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h2>{editId ? 'Edit Product' : 'New Product'}</h2>
              <button className="pp-modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form className="pp-form" onSubmit={handleSave}>
              <div className="pp-form-row">
                <div className="pp-field"><label>Product Code *</label><input value={form.productCode} onChange={f('productCode')} placeholder="e.g. PROD-001" /></div>
                <div className="pp-field"><label>Version</label><input value={form.version} onChange={f('version')} placeholder="1.0" /></div>
              </div>
              <div className="pp-field pp-field--full"><label>Name *</label><input value={form.name} onChange={f('name')} placeholder="Product name" /></div>
              <div className="pp-field pp-field--full"><label>Description</label><textarea value={form.description} onChange={f('description')} placeholder="Optional description…" rows={3} /></div>
              <div className="pp-form-row">
                <div className="pp-field"><label>Status</label><select value={form.status} onChange={f('status')}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="pp-field"><label>Project ID</label><input type="number" value={form.projectId} onChange={f('projectId')} placeholder="Optional" min="1" /></div>
              </div>
              {error && <div className="pp-form-error">{error}</div>}
              <div className="pp-form-actions">
                <button type="button" className="pp-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="pp-btn-save" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="pp-loading"><div className="pp-spinner" /><p>Loading products…</p></div>
      ) : products.length === 0 ? (
        <div className="pp-empty">
          <span>📦</span>
          <h3>{search ? 'No results found' : 'No products yet'}</h3>
          <p>{search ? `No products match “${search}”` : 'Create the first product using the button above'}</p>
        </div>
      ) : (
        <div className="pp-table-wrap">
          <table className="pp-table">
            <thead><tr>
              <th>Product Code</th><th>Name</th><th>Version</th><th>Status</th><th>Project</th><th>Created</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {products.map(p => {
                const c = STATUS_COLORS[p.status] || STATUS_COLORS.DRAFT;
                return (
                  <tr key={p.id}>
                    <td className="pp-code">{p.productCode}</td>
                    <td className="pp-name">{p.name || '—'}</td>
                    <td className="pp-version">v{p.version || '?'}</td>
                    <td><span className="pp-status-badge" style={{ background: c.bg, color: c.text }}>{p.status}</span></td>
                    <td className="pp-proj">{p.projectId || '—'}</td>
                    <td className="pp-date">{timeAgo(p.createdAt)}</td>
                    <td><div className="pp-actions">
                      <button className="pp-btn-edit" onClick={() => openEdit(p)}>Edit</button>
                      <button className="pp-btn-del" onClick={() => handleDelete(p.id, p.productCode)}>Delete</button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="pp-table-footer">{products.length} product{products.length !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
