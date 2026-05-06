import React, { useState, useEffect, useCallback } from 'react';
import './SavedSearchPanel.css';

const TYPES = ['PART', 'DOCUMENT', 'ECR', 'ECO'];

export default function SavedSearchPanel({ entityType = 'PART', onExecute }) {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', entityType, queryJson: '{}', isPublic: false });
  const token = () => localStorage.getItem('token') || '';

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/v1/plm/saved-searches?entityType=${entityType}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(r => setSearches(r.data || []))
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [entityType]);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    fetch('/api/v1/plm/saved-searches', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form)
    }).then(r => r.json()).then(r => { if (r.success) { setShowForm(false); load(); } }).catch(e => alert(e.message));
  };

  const remove = (id) => {
    fetch(`/api/v1/plm/saved-searches/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(() => load());
  };

  const execute = (s) => {
    fetch(`/api/v1/plm/saved-searches/${s.id}/execute`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }
    }).then(r => r.json()).then(r => { if (onExecute) onExecute(r.data || []); });
  };

  if (loading) return <div className="ss-spinner" />;

  return (
    <div className="ss-panel">
      <div className="ss-header">
        <h4>Saved Searches</h4>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Save'}</button>
      </div>

      {showForm && (
        <div className="ss-form">
          <input placeholder="Search name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="ss-input" />
          <select value={form.entityType} onChange={e => setForm({...form, entityType: e.target.value})} className="ss-select">
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea placeholder='Filters JSON e.g. {"lifecycleState":"RELEASED"}' value={form.queryJson} onChange={e => setForm({...form, queryJson: e.target.value})} className="ss-input ss-textarea" rows={3} />
          <label className="ss-check"><input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} /> Public</label>
          <button onClick={save} disabled={!form.name} className="btn-primary btn-sm">Save</button>
        </div>
      )}

      {error && <div className="ss-error">{error}</div>}

      {searches.length === 0 ? (
        <div className="ss-empty">No saved searches</div>
      ) : (
        searches.map(s => (
          <div key={s.id} className="ss-row">
            <div className="ss-info">
              <span className="ss-name">{s.name}</span>
              <span className="ss-type">{s.entityType}</span>
              {s.isPublic && <span className="ss-public">Public</span>}
            </div>
            <div className="ss-actions">
              <button className="btn-sm btn-blue" onClick={() => execute(s)}>Run</button>
              <button className="btn-sm btn-red" onClick={() => remove(s.id)}>Del</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
