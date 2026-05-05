import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import styles from './ProjectsPage.module.css';

const STATUSES = ['DRAFT', 'ACTIVE', 'RELEASED', 'INACTIVE', 'OBSOLETE'];
const EMPTY_FORM = {
  projectCode: '', name: '', description: '', status: 'DRAFT',
  managerId: '', progress: 0, startDate: '', endDate: '',
};

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { setSelectedContextId } = useContext(PlmWorkspaceContext);

  // ── PLM Project Contexts ──
  const [plmContexts,  setPlmContexts]  = useState([]);
  const [ctxLoading,   setCtxLoading]   = useState(true);

  const loadContexts = useCallback(async () => {
    setCtxLoading(true);
    try {
      const all = await plmApi.listContexts();
      setPlmContexts((all || []).filter(c => c.contextType === 'PROJECT'));
    } catch { setPlmContexts([]); }
    finally { setCtxLoading(false); }
  }, []);

  useEffect(() => { loadContexts(); }, [loadContexts]);

  const openContext = (ctx) => {
    setSelectedContextId(ctx.id);
    navigate('/plm/parts');
  };

  // ── Project entities ───────────────────────────────────────────────
  const [projects,       setProjects]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [searching,      setSearching]      = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [editId,         setEditId]         = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [progEdit,       setProgEdit]       = useState({});
  const [progSaving,     setProgSaving]     = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try   { const d = await plmApi.getAllProjects(); setProjects(Array.isArray(d) ? d : []); }
    catch { setProjects([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { load(); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try   { const d = await plmApi.searchProjects(search.trim()); setProjects(Array.isArray(d) ? d : []); }
      catch { setProjects([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setError(''); setShowForm(true); };

  const openEdit = (proj) => {
    setEditId(proj.id);
    setForm({
      projectCode: proj.projectCode || '',
      name:        proj.name        || '',
      description: proj.description || '',
      status:      proj.status      || 'DRAFT',
      managerId:   proj.managerId   || '',
      progress:    proj.progress    ?? 0,
      startDate:   proj.startDate   ? proj.startDate.split('T')[0] : '',
      endDate:     proj.endDate     ? proj.endDate.split('T')[0]   : '',
    });
    setError(''); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.projectCode.trim() || !form.name.trim()) { setError('Project code and name are required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, managerId: form.managerId ? Number(form.managerId) : null, progress: Number(form.progress) };
      editId ? await plmApi.updateProject(editId, payload) : await plmApi.createProject(payload);
      setShowForm(false); setSearch(''); await load();
    } catch (ex) { setError(ex?.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete project ${code}? This cannot be undone.`)) return;
    try   { await plmApi.deleteProject(id); setProjects(prev => prev.filter(p => p.id !== id)); }
    catch { alert('Failed to delete project'); }
  };

  const handleProgressSave = async (id, val) => {
    const pct = Math.max(0, Math.min(100, Number(val)));
    setProgSaving(s => ({ ...s, [id]: true }));
    try {
      await plmApi.updateProjectProgress(id, pct);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, progress: pct } : p));
      setProgEdit(s => { const n = { ...s }; delete n[id]; return n; });
    } catch { alert('Failed to update progress'); }
    finally { setProgSaving(s => ({ ...s, [id]: false })); }
  };

  const cancelProgEdit = (id) => setProgEdit(s => { const n = { ...s }; delete n[id]; return n; });

  const timeAgo = (d) => {
    if (!d) return '—';
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days < 1) return 'today';
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🗂️ Projects</h1>
          <p className={styles.pageSub}>PLM project contexts &amp; tracker</p>
        </div>
        <button className={styles.btnCreate} onClick={openCreate}>+ New Project</button>
      </div>

      <div className={styles.ctxSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🏢 PLM Project Contexts</h2>
          <p className={styles.sectionSub}>Windchill-style project containers</p>
        </div>
        {ctxLoading ? (
          <div className={styles.ctxLoading}>↻ Loading contexts…</div>
        ) : plmContexts.length === 0 ? (
          <div className={styles.ctxEmpty}>No PROJECT contexts found. Use the sidebar to create one.</div>
        ) : (
          <div className={styles.ctxTable}>
            {plmContexts.map(ctx => (
              <div className={styles.ctxRow} key={ctx.id}>
                <span className={styles.ctxTypePill}>PROJECT</span>
                <span className={styles.ctxCode}>{ctx.code}</span>
                <span className={styles.ctxName}>{ctx.name}</span>
                <button className={styles.ctxOpenBtn} onClick={() => openContext(ctx)}>Open Workspace →</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.sectionDivider}><span>📋 Project Tracker</span></div>

      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input className={styles.search} placeholder="Search by code, name…" value={search} onChange={e => setSearch(e.target.value)} />
        {searching && <span className={styles.searchSpin} />}
      </div>

      {showForm && (
        <div className={styles.modalBg} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editId ? 'Edit Project' : 'New Project'}</h2>
              <button className={styles.modalClose} onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form className={styles.form} onSubmit={handleSave}>
              <div className={styles.formRow}>
                <div className={styles.field}><label>Code *</label><input value={form.projectCode} onChange={f('projectCode')} /></div>
                <div className={styles.field}><label>Status</label><select value={form.status} onChange={f('status')}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}><label>Name *</label><input value={form.name} onChange={f('name')} /></div>
              <div className={`${styles.field} ${styles.fieldFull}`}><label>Description</label><textarea value={form.description} onChange={f('description')} rows={2} /></div>
              <div className={styles.formRow}>
                <div className={styles.field}><label>Manager ID</label><input type="number" value={form.managerId} onChange={f('managerId')} /></div>
                <div className={styles.field}><label>Progress — {form.progress}%</label><input type="range" min="0" max="100" value={form.progress} onChange={f('progress')} className={styles.range} /></div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.field}><label>Start Date</label><input type="date" value={form.startDate} onChange={f('startDate')} /></div>
                <div className={styles.field}><label>End Date</label><input type="date" value={form.endDate} onChange={f('endDate')} /></div>
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
        <div className={styles.loading}><div className={styles.spinner} /><p>Loading projects…</p></div>
      ) : projects.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📋</span>
          <h3>No projects found</h3>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {projects.map(proj => {
              const pct = proj.progress ?? 0;
              const isEditing = progEdit[proj.id] !== undefined;
              const editVal   = progEdit[proj.id] ?? pct;
              return (
                <div className={styles.card} key={proj.id}>
                  <div className={styles.cardTop}>
                    <div>
                      <div className={styles.cardCode}>{proj.projectCode}</div>
                      <div className={styles.cardName}>{proj.name || '—'}</div>
                    </div>
                    <span className={styles.statusBadge}>{proj.status}</span>
                  </div>

                  {proj.description && <p className={styles.cardDesc}>{proj.description}</p>}

                  <div className={styles.progSection}>
                    <div className={styles.progLabel}>
                      <span>Progress</span>
                      <span style={{ color: 'var(--wc-blue)', fontWeight: 800 }}>{pct}%</span>
                    </div>
                    <div className={styles.progTrack}>
                      <div className={styles.progFill} style={{ width: `${pct}%` }} />
                    </div>
                    {isEditing ? (
                      <div className={styles.progEditRow}>
                        <input
                          type="number" min="0" max="100"
                          value={editVal}
                          onChange={e => setProgEdit(s => ({ ...s, [proj.id]: Number(e.target.value) }))}
                          className={styles.progInput}
                        />
                        <button className={styles.btnSaveProg} disabled={progSaving[proj.id]} onClick={() => handleProgressSave(proj.id, editVal)}>
                          {progSaving[proj.id] ? '…' : 'Save'}
                        </button>
                        <button className={styles.btnCancelProg} onClick={() => cancelProgEdit(proj.id)}>×</button>
                      </div>
                    ) : (
                      <button className={styles.btnUpdateProg} onClick={() => setProgEdit(s => ({ ...s, [proj.id]: pct }))}>Update %</button>
                    )}
                  </div>

                  <div className={styles.cardMeta}>
                    {proj.managerId && <span>👤 Manager #{proj.managerId}</span>}
                    <span>📅 {timeAgo(proj.createdAt)}</span>
                  </div>

                  <div className={styles.cardActions}>
                    <button className={styles.btnEdit} onClick={() => openEdit(proj)}>Edit</button>
                    <button className={styles.btnDel}  onClick={() => handleDelete(proj.id, proj.projectCode)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.count}>{projects.length} project{projects.length !== 1 ? 's' : ''}</div>
        </>
      )}
    </div>
  );
};

export default ProjectsPage;
