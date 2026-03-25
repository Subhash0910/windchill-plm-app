import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StateBadge from '../../components/plm/StateBadge';
import styles from './ChangesHomePage.module.css';

const API = import.meta.env.VITE_API_URL ?? '';

const TABS = ['ECRs', 'My Tasks'];

export default function ChangesHomePage() {
  const navigate = useNavigate();
  const [tab,      setTab]      = useState('ECRs');
  const [ecrs,     setEcrs]     = useState([]);
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ title: '', description: '', priority: 'MEDIUM', affectedPartNumber: '' });

  const token   = localStorage.getItem('token');
  const contextId = localStorage.getItem('activeContextId') || 1;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const loadEcrs = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/v1/changes/ecr?contextId=${contextId}`, { headers })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => { setEcrs(Array.isArray(data) ? data : (data.data ?? [])); setError(null); })
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, [contextId]);

  const loadTasks = useCallback(() => {
    fetch(`${API}/api/v1/changes/tasks/my`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setTasks(Array.isArray(data) ? data : (data.data ?? [])))
      .catch(() => setTasks([]));
  }, []);

  useEffect(() => { loadEcrs(); loadTasks(); }, [loadEcrs, loadTasks]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/v1/changes/ecr`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...form, contextId: Number(contextId) }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCreating(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', affectedPartNumber: '' });
      loadEcrs();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const fmtDate = s => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const priorityClass = p => ({
    HIGH: styles.priHigh, MEDIUM: styles.priMedium, LOW: styles.priLow,
  })[p] ?? styles.priMedium;

  const stats = [
    { label: 'Total ECRs',  value: ecrs.length },
    { label: 'Open',        value: ecrs.filter(e => e.status === 'OPEN' || e.status === 'DRAFT').length },
    { label: 'In Review',   value: ecrs.filter(e => e.status === 'IN_REVIEW' || e.status === 'UNDERREVIEW').length },
    { label: 'Approved',    value: ecrs.filter(e => e.status === 'APPROVED').length },
    { label: 'My Tasks',    value: tasks.length },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <span className={styles.typeIcon}>🔄</span>
          <div>
            <h1>Change Management</h1>
            <p className={styles.subtitle}>Engineering Change Requests and Notices</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        {stats.map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >{t}</button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          {tab === 'ECRs' && (
            <button className={styles.btnPrimary} onClick={() => setCreating(true)}>+ New ECR</button>
          )}
          <button className={styles.btnIcon} title="Refresh" onClick={() => { loadEcrs(); loadTasks(); }}>↻</button>
        </div>
      </div>

      {/* Create ECR panel */}
      {creating && (
        <div className={styles.createPanel}>
          <div className={styles.createHeader}>
            <span>New Engineering Change Request</span>
            <button className={styles.closeBtn} onClick={() => setCreating(false)}>✕</button>
          </div>
          <div className={styles.createBody}>
            <label>Title *
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Describe the change" />
            </label>
            <div className={styles.row2}>
              <label>Priority
                <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
              <label>Affected Part #
                <input value={form.affectedPartNumber} onChange={e => setForm(f => ({...f, affectedPartNumber: e.target.value}))} placeholder="e.g. ECU-005" />
              </label>
            </div>
            <label>Description
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="Root cause, scope, justification…" />
            </label>
            <div className={styles.createActions}>
              <button className={styles.btnPrimary} onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Create ECR'}</button>
              <button className={styles.btnSecondary} onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={styles.tableWrap}>
        {loading && <div className={styles.loading}>Loading…</div>}
        {error   && <div className={styles.errorBanner}>Error: {error} <button onClick={loadEcrs}>Retry</button></div>}

        {!loading && !error && tab === 'ECRs' && (
          <table className={styles.wcTable}>
            <thead>
              <tr>
                <th>ECR #</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Affected Part</th>
                <th>Status</th>
                <th>Submitted By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {ecrs.length === 0 && (
                <tr><td colSpan={7} className={styles.emptyRow}>No ECRs found. Create one to get started.</td></tr>
              )}
              {ecrs.map(ecr => (
                <tr
                  key={ecr.id}
                  className={styles.tableRow}
                  onDoubleClick={() => navigate(`/plm/changes/ecr/${ecr.id}`)}
                >
                  <td>
                    <span className={styles.ecrLink} onClick={() => navigate(`/plm/changes/ecr/${ecr.id}`)}>
                      ECR-{String(ecr.id).padStart(4, '0')}
                    </span>
                  </td>
                  <td className={styles.titleCell}>{ecr.title}</td>
                  <td><span className={`${styles.priPill} ${priorityClass(ecr.priority)}`}>{ecr.priority}</span></td>
                  <td className={styles.dimCell}>{ecr.affectedPartNumber ?? '—'}</td>
                  <td><StateBadge state={ecr.status} /></td>
                  <td className={styles.dimCell}>{ecr.submittedBy ?? ecr.createdBy ?? '—'}</td>
                  <td className={styles.dimCell}>{fmtDate(ecr.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && tab === 'My Tasks' && (
          <table className={styles.wcTable}>
            <thead>
              <tr>
                <th>Task</th>
                <th>Related ECR</th>
                <th>Action Required</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr><td colSpan={5} className={styles.emptyRow}>No change tasks assigned to you.</td></tr>
              )}
              {tasks.map(t => (
                <tr key={t.id} className={styles.tableRow}>
                  <td className={styles.titleCell}>{t.title ?? `Task #${t.id}`}</td>
                  <td>
                    {t.ecrId ? (
                      <span className={styles.ecrLink} onClick={() => navigate(`/plm/changes/ecr/${t.ecrId}`)}>ECR-{String(t.ecrId).padStart(4,'0')}</span>
                    ) : '—'}
                  </td>
                  <td className={styles.dimCell}>{t.actionRequired ?? '—'}</td>
                  <td className={styles.dimCell}>{fmtDate(t.dueDate)}</td>
                  <td><StateBadge state={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.statusBar}>
        {tab === 'ECRs' ? `${ecrs.length} ECR${ecrs.length !== 1 ? 's' : ''}` : `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
}
