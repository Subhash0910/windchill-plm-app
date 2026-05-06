import React, { useState, useEffect, useCallback } from 'react';
import './ChangeTaskPanel.css';

const STATUS_MAP = { PENDING: 'badge-amber', IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-green', CANCELLED: 'badge-gray' };
const STATUS_LABEL = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };
const PRIO_LABEL = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };
const FILTERS = ['All', 'Pending', 'In Progress', 'Completed'];

export default function ChangeTaskPanel({ changeOrderId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0 });
  const [form, setForm] = useState({ title: '', description: '', assigneeUserId: '', dueDate: '', priority: 'MEDIUM', estimatedHours: '', affectedPartId: '' });

  const token = () => localStorage.getItem('token') || '';

  const load = useCallback(() => {
    setLoading(true); setError(null);
    fetch(`/api/v1/plm/change-tasks/by-order/${changeOrderId}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(r => {
        const d = r.data;
        setTasks(d?.tasks || []);
        setStats({ total: d?.total || 0, completed: d?.completed || 0 });
      })
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [changeOrderId]);

  useEffect(() => { load(); }, [load]);

  const api = (method, url, body) => fetch(url, {
    method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: body ? JSON.stringify(body) : undefined
  }).then(r => r.json());

  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter.toUpperCase().replace(' ', '_'));

  const handleAction = (id, action, extra = {}) => api('POST', `/api/v1/plm/change-tasks/${id}/${action}`, extra).then(() => load());

  const handleCreate = () => {
    const payload = { ...form, changeOrderId, assigneeUserId: form.assigneeUserId ? Number(form.assigneeUserId) : null, estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null, affectedPartId: form.affectedPartId ? Number(form.affectedPartId) : null };
    api('POST', '/api/v1/plm/change-tasks', payload).then(() => { setShowForm(false); load(); }).catch(e => alert(e.message));
  };

  if (loading) return <div className="ct-panel"><div className="ct-spinner" /></div>;
  if (error) return <div className="ct-panel"><div className="ct-error">Failed: {error} <button onClick={load}>Retry</button></div></div>;

  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="ct-panel">
      <div className="ct-header">
        <div><h3>Change Tasks</h3><span className="ct-subtitle">{stats.completed} of {stats.total} completed</span></div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Task'}</button>
      </div>

      {stats.total > 0 && (
        <div className="ct-progress-bar">
          <div className="ct-progress-fill" style={{ width: `${pct}%` }} />
          <span className="ct-progress-text">{pct}%</span>
        </div>
      )}

      <div className="ct-filters">
        {FILTERS.map(f => <button key={f} className={`ct-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
      </div>

      {showForm && (
        <div className="ct-form">
          <div className="ct-form-row">
            <input placeholder="Task title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="ct-input" />
            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="ct-select">
              {Object.entries(PRIO_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="ct-form-row">
            <input type="number" placeholder="Assignee User ID" value={form.assigneeUserId} onChange={e => setForm({...form, assigneeUserId: e.target.value})} className="ct-input" />
            <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="ct-input" />
            <input type="number" placeholder="Est. hrs" value={form.estimatedHours} onChange={e => setForm({...form, estimatedHours: e.target.value})} className="ct-input ct-input-sm" />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="ct-input ct-textarea" />
          <button onClick={handleCreate} disabled={!form.title} className="btn-primary btn-sm">Create Task</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="ct-empty"><span>{'\u{1F4CB}'}</span><p>{tasks.length === 0 ? 'No tasks yet.' : 'No matching tasks.'}</p></div>
      ) : (
        <div className="ct-table-wrap">
          <table className="ct-table">
            <thead><tr><th>#</th><th>Title</th><th>Assignee</th><th>Due</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(t => {
                const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
                return (
                  <tr key={t.id} className={`${t.status === 'COMPLETED' ? 'ct-row-done' : ''} ${overdue ? 'ct-row-overdue' : ''}`}>
                    <td className="ct-mono">{t.taskNumber}</td>
                    <td><div className="ct-title">{t.title}</div>{t.description && <div className="ct-desc">{(t.description||'').substring(0,80)}</div>}</td>
                    <td>{t.assigneeUserId || '---'}</td>
                    <td className={overdue ? 'ct-overdue' : ''}>{t.dueDate || '---'}</td>
                    <td><span className={`ct-priority ct-prio-${(t.priority||'medium').toLowerCase()}`}>{PRIO_LABEL[t.priority] || t.priority}</span></td>
                    <td><span className={`ct-status ${STATUS_MAP[t.status] || 'badge-gray'}`}>{STATUS_LABEL[t.status] || t.status}</span></td>
                    <td>
                      <div className="ct-actions">
                        {t.status === 'PENDING' && <button className="btn-sm btn-blue" onClick={() => handleAction(t.id, 'start')}>Start</button>}
                        {t.status === 'IN_PROGRESS' && <button className="btn-sm btn-green" onClick={() => handleAction(t.id, 'complete', {actualHours: t.estimatedHours||1, comment:'Done'})}>Done</button>}
                        {(t.status === 'PENDING' || t.status === 'IN_PROGRESS') && <button className="btn-sm btn-red" onClick={() => handleAction(t.id, 'cancel')}>Cancel</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
