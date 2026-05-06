import React, { useState, useEffect } from 'react';
import './IbaPanel.css';

export default function IbaPanel({ entityId, targetType = 'PART' }) {
  const [definitions, setDefinitions] = useState([]);
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const token = () => localStorage.getItem('token') || '';

  const api = (url, opts = {}) => fetch(url, { headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }, ...opts }).then(r => r.json());

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    Promise.all([
      api(`/api/v1/plm/iba/definitions?targetType=${targetType}`),
      api(`/api/v1/plm/iba/values/${entityId}`)
    ]).then(([defs, vals]) => {
      setDefinitions(defs.data || []);
      const v = {};
      (vals.data || []).forEach(val => { v[val.definitionId] = val.attributeValue || ''; });
      setValues(v); setSaved(v);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [entityId, targetType]);

  const handleChange = (defId, val) => setValues(prev => ({ ...prev, [defId]: val }));

  const save = () => {
    setSaving(true); setMsg(null);
    const valueList = Object.entries(values).map(([defId, val]) => ({ definitionId: parseInt(defId), entityId, attributeValue: val }));
    api('/api/v1/plm/iba/values', { method: 'POST', body: JSON.stringify({ entityId, values: valueList }) })
      .then(r => { if (r.success) { setSaved({...values}); setMsg({ type: 'success', text: 'Saved' }); } else setMsg({ type: 'error', text: r.message }); })
      .catch(e => setMsg({ type: 'error', text: e.message })).finally(() => setSaving(false));
  };

  const hasChanges = JSON.stringify(values) !== JSON.stringify(saved);

  const renderInput = (def) => {
    const val = values[def.id] || '';
    switch (def.dataType) {
      case 'BOOLEAN': return <select value={val} onChange={e => handleChange(def.id, e.target.value)} className="iba-input"><option value="">—</option><option value="true">Yes</option><option value="false">No</option></select>;
      case 'DATE': return <input type="date" value={val} onChange={e => handleChange(def.id, e.target.value)} className="iba-input" />;
      case 'INTEGER': case 'DECIMAL': return <input type="number" step={def.dataType === 'DECIMAL' ? '0.01' : '1'} min={def.minValue || undefined} max={def.maxValue || undefined} value={val} onChange={e => handleChange(def.id, e.target.value)} className="iba-input" />;
      case 'URL': return <input type="url" value={val} onChange={e => handleChange(def.id, e.target.value)} className="iba-input" placeholder="https://..." />;
      default:
        if ((def.optionValues || '').length > 0) {
          return <select value={val} onChange={e => handleChange(def.id, e.target.value)} className="iba-input"><option value="">—</option>{(def.optionValues||'').split(',').map(o => <option key={o} value={o.trim()}>{o.trim()}</option>)}</select>;
        }
        return <input type="text" value={val} onChange={e => handleChange(def.id, e.target.value)} className="iba-input" placeholder={def.defaultValue || ''} />;
    }
  };

  if (loading) return <div className="iba-panel"><div className="iba-spinner" /></div>;
  if (error) return <div className="iba-panel"><div className="iba-error">{error}</div></div>;

  return (
    <div className="iba-panel">
      <div className="iba-header">
        <div><h4>Custom Attributes (IBA)</h4><span className="iba-subtitle">{definitions.length} attribute(s) defined for {targetType}</span></div>
        <button onClick={save} disabled={!hasChanges || saving} className="btn-primary btn-sm">{saving ? 'Saving...' : '💾 Save'}</button>
      </div>
      {msg && <div className={`iba-msg iba-msg-${msg.type}`}>{msg.text}</div>}

      {definitions.length === 0 ? (
        <div className="iba-empty"><span>📋</span><p>No IBA attributes defined for {targetType}.<br/>Use the IBA Definitions API to add custom attributes.</p></div>
      ) : (
        <div className="iba-grid">
          {definitions.map(def => {
            const changed = values[def.id] !== saved[def.id];
            return (
              <div key={def.id} className={`iba-field ${changed ? 'iba-changed' : ''}`}>
                <label className="iba-label">
                  {def.displayName || def.attributeName}
                  {def.isRequired && <span className="iba-req"> *</span>}
                  <span className="iba-type-badge">{def.dataType}</span>
                  {def.unit && <span className="iba-unit">({def.unit})</span>}
                </label>
                {renderInput(def)}
                {def.description && <span className="iba-hint">{def.description}</span>}
                {def.validationRegex && <span className="iba-regex">Pattern: {def.validationRegex}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
