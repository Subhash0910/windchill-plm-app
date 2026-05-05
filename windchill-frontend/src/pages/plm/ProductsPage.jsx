import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import styles from './ProductsPage.module.css';

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
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📦 Products</h1>
          <p className={styles.pageSub}>PLM product contexts &amp; product catalog</p>
        </div>
        <button className={styles.btnCreate} onClick={openCreate}>+ New Product</button>
      </div>

      <div className={styles.ctxSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🏢 PLM Product Contexts</h2>
          <p className={styles.sectionSub}>Windchill-style product containers</p>
        </div>
        {ctxLoading ? (
          <div className={styles.ctxLoading}>↻ Loading contexts…</div>
        ) : plmContexts.length === 0 ? (
          <div className={styles.ctxEmpty}>
            No PRODUCT-type contexts yet.
            Use <strong>Context → New</strong> on the left sidebar.
          </div>
        ) : (
          <div className={styles.ctxTable}>
            {plmContexts.map(ctx => (
              <div className={styles.ctxRow} key={ctx.id}>
                <span className={styles.ctxTypePill}>PRODUCT</span>
                <span className={styles.ctxCode}>{ctx.code}</span>
                <span className={styles.ctxName}>{ctx.name}</span>
                {ctx.description && (
                  <span className={styles.ctxDesc} title={ctx.description}>
                    {ctx.description.length > 50 ? ctx.description.slice(0, 50) + '…' : ctx.description}
                  </span>
                )}
                <button className={styles.ctxOpenBtn} onClick={() => openContext(ctx)}>
                  Open Workspace →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.sectionDivider}><span>📋 Product Catalog</span></div>

      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.search}
          placeholder="Search by code, name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {searching && <span className={styles.searchSpin} />}
      </div>

      {showForm && (
        <div className={styles.modalBg} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editId ? 'Edit Product' : 'New Product'}</h2>
              <button className={styles.modalClose} onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form className={styles.form} onSubmit={handleSave}>
              <div className={styles.formRow}>
                <div className={styles.field}><label>Product Code *</label><input value={form.productCode} onChange={f('productCode')} placeholder="e.g. PRD-001" /></div>
                <div className={styles.field}><label>Status</label><select value={form.status} onChange={f('status')}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}><label>Name *</label><input value={form.name} onChange={f('name')} placeholder="Product name" /></div>
              <div className={`${styles.field} ${styles.fieldFull}`}><label>Description</label><textarea value={form.description} onChange={f('description')} placeholder="Optional description…" rows={2} /></div>
              <div className={styles.formRow}>
                <div className={styles.field}><label>Version</label><input value={form.version} onChange={f('version')} placeholder="e.g. 1.0" /></div>
                <div className={styles.field}><label>Project ID</label><input type="number" value={form.projectId} onChange={f('projectId')} placeholder="Optional" min="1" /></div>
              </div>
              {error && <div className={styles.formError}>{error}</div>}
              <div className={styles.formActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className={styles.btnSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /><p>Loading products…</p></div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📦</span>
          <h3>{search ? 'No results found' : 'No product catalog entries yet'}</h3>
          <p>{search ? `No products match “${search}”` : 'Click “+ New Product” above to add one'}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th><th>Name</th><th>Version</th><th>Status</th><th>Description</th><th>Project ID</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                return (
                  <tr key={p.id}>
                    <td className={styles.code}>{p.productCode}</td>
                    <td className={styles.name}>{p.name}</td>
                    <td>{p.version || '—'}</td>
                    <td><span className={styles.badge}>{p.status}</span></td>
                    <td className={styles.desc}>{p.description || '—'}</td>
                    <td className="mono">{p.projectId || '—'}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.btnEdit} onClick={() => openEdit(p)}>Edit</button>
                        <button className={styles.btnDel}  onClick={() => handleDelete(p.id, p.productCode)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={styles.count}>{products.length} product{products.length !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
