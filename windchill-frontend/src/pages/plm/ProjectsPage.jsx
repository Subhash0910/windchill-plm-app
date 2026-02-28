import React, { useState, useEffect, useCallback } from 'react';
import { plmApi } from '../../services/plmApi';
import './ProjectsPage.css';

const STATUS_COLORS = {
  DRAFT:    { bg: '#fef3c7', text: '#92400e' },
  ACTIVE:   { bg: '#dbeafe', text: '#1e40af' },
  RELEASED: { bg: '#dcfce7', text: '#166534' },
  INACTIVE: { bg: '#f1f5f9', text: '#475569' },
  OBSOLETE: { bg: '#fce7f3', text: '#9d174d' },
};

const STATUSES = ['DRAFT', 'ACTIVE', 'RELEASED', 'INACTIVE', 'OBSOLETE'];

const EMPTY_FORM = {
  projectCode: '', name: '', description: '', status: 'DRAFT',
  managerId: '', progress: 0, startDate: '', endDate: '',
};

const progressColor = (p) => {
  if (p >= 80) return '#22c55e';
  if (p >= 50) return '#3b82f6';
  if (p >= 20) return '#f59e0b';
  return '#ef4444';
};

const ProjectsPage = () => {
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
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
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
    <div className="pj-page">
      <div className="pj-page-header">
        <div>
          <h1 className="pj-page-title">🗂️ Projects</h1>
          <p className="pj-page-sub">Track projects, progress &amp; timelines</p>
        </div>
        <button className="pj-btn-create" onClick={openCreate}>+ New Project</button>
      </div>

      <div className="pj-search-wrap">
        <span className="pj-search-icon">🔍</span>
        <input className="pj-search" placeholder="Search by code, name…" value={search} onChange={e => setSearch(e.target.value)} />
        {searching && <span className="pj-search-spin" />}
      </div>

      {showForm && (
        <div className="pj-modal-bg" onClick={() => setShowForm(false)}>
          <div className="pj-modal" onClick={e => e.stopPropagation()}>
            <div className="pj-modal-header">
              <h2>{editId ? 'Edit Project' : 'New Project'}</h2>
              <button className="pj-modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form className="pj-form" onSubmit={handleSave}>
              <div className="pj-form-row">
                <div className="pj-field"><label>Project Code *</label><input value={form.projectCode} onChange={f('projectCode')} placeholder="e.g. PROJ-001" /></div>
                <div className="pj-field"><label>Status</label><select value={form.status} onChange={f('status')}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="pj-field pj-field--full"><label>Name *</label><input value={form.name} onChange={f('name')} placeholder="Project name" /></div>
              <div className="pj-field pj-field--full"><label>Description</label><textarea value={form.description} onChange={f('description')} placeholder="Optional description…" rows={2} /></div>
              <div className="pj-form-row">
                <div className="pj-field"><label>Manager ID</label><input type="number" value={form.managerId} onChange={f('managerId')} placeholder="Optional" min="1" /></div>
                <div className="pj-field">
                  <label>Initial Progress — {form.progress}%</label>
                  <input type="range" min="0" max="100" value={form.progress} onChange={f('progress')} className="pj-range" />
                </div>
              </div>
              <div className="pj-form-row">
                <div className="pj-field"><label>Start Date</label><input type="date" value={form.startDate} onChange={f('startDate')} /></div>
                <div className="pj-field"><label>End Date</label><input type="date" value={form.endDate} onChange={f('endDate')} /></div>
              </div>
              {error && <div className="pj-form-error">{error}</div>}
              <div className="pj-form-actions">
                <button type="button" className="pj-btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="pj-btn-save" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="pj-loading"><div className="pj-spinner" /><p>Loading projects…</p></div>
      ) : projects.length === 0 ? (
        <div className="pj-empty">
          <span>🗂️</span>
          <h3>{search ? 'No results found' : 'No projects yet'}</h3>
          <p>{search ? `No projects match “${search}”` : 'Create the first project using the button above'}</p>
        </div>
      ) : (
        <>
          <div className="pj-grid">
            {projects.map(proj => {
              const c = STATUS_COLORS[proj.status] || STATUS_COLORS.DRAFT;
              const pct = proj.progress ?? 0;
              const bar = progressColor(pct);
              const isEditing = progEdit[proj.id] !== undefined;
              const editVal   = progEdit[proj.id] ?? pct;
              return (
                <div className="pj-card" key={proj.id}>
                  <div className="pj-card-top">
                    <div>
                      <div className="pj-card-code">{proj.projectCode}</div>
                      <div className="pj-card-name">{proj.name || '—'}</div>
                    </div>
                    <span className="pj-status-badge" style={{ background: c.bg, color: c.text }}>{proj.status}</span>
                  </div>

                  {proj.description && <p className="pj-card-desc">{proj.description}</p>}

                  {/* Progress */}
                  <div className="pj-prog-section">
                    <div className="pj-prog-label">
                      <span>Progress</span>
                      <span style={{ color: bar, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div className="pj-prog-track">
                      <div className="pj-prog-fill" style={{ width: `${pct}%`, background: bar }} />
                    </div>
                    {isEditing ? (
                      <div className="pj-prog-edit-row">
                        <input
                          type="number" min="0" max="100"
                          value={editVal}
                          onChange={e => setProgEdit(s => ({ ...s, [proj.id]: Number(e.target.value) }))}
                          className="pj-prog-input"
                        />
                        <span className="pj-prog-unit">%</span>
                        <button className="pj-btn-save-prog" disabled={progSaving[proj.id]} onClick={() => handleProgressSave(proj.id, editVal)}>
                          {progSaving[proj.id] ? '…' : 'Save'}
                        </button>
                        <button className="pj-btn-cancel-prog" onClick={() => cancelProgEdit(proj.id)}>×</button>
                      </div>
                    ) : (
                      <button className="pj-btn-update-prog" onClick={() => setProgEdit(s => ({ ...s, [proj.id]: pct }))}>
                        Update %
                      </button>
                    )}
                  </div>

                  <div className="pj-card-meta">
                    {proj.managerId && <span>👤 Manager #{proj.managerId}</span>}
                    {proj.startDate  && <span>▶ {proj.startDate.split('T')[0]}</span>}
                    {proj.endDate    && <span>⏹ {proj.endDate.split('T')[0]}</span>}
                    <span>📅 {timeAgo(proj.createdAt)}</span>
                  </div>

                  <div className="pj-card-actions">
                    <button className="pj-btn-edit" onClick={() => openEdit(proj)}>Edit</button>
                    <button className="pj-btn-del"  onClick={() => handleDelete(proj.id, proj.projectCode)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pj-count">{projects.length} project{projects.length !== 1 ? 's' : ''}</div>
        </>
      )}
    </div>
  );
};

export default ProjectsPage;
