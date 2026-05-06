import React, { useState, useEffect, useCallback } from 'react';
import './ClassificationPanel.css';

export default function ClassificationPanel({ partId }) {
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [assigned, setAssigned] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [attrs, setAttrs] = useState([]);
  const [values, setValues] = useState({});
  const token = () => localStorage.getItem('token') || '';

  const api = (url, opts = {}) => fetch(url, { headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }, ...opts }).then(r => r.json());

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api('/api/v1/plm/classifications/tree'),
      partId ? api(`/api/v1/plm/classifications/parts/${partId}`) : Promise.resolve(null)
    ]).then(([t, a]) => {
      setTree(t.data || []);
      if (a?.data) setAssigned(a.data);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [partId]);

  useEffect(() => { load(); }, [load]);

  const toggleNode = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const selectNode = (node) => {
    setSelectedNode(node);
    setShowAssign(true);
    api(`/api/v1/plm/classifications/${node.id}/attributes`).then(r => {
      setAttrs(r.data || []);
      const v = {};
      (r.data || []).forEach(a => { v[a.attrName] = a.defaultValue || ''; });
      setValues(v);
    });
  };

  const assignClassification = () => {
    const valueList = Object.entries(values).map(([k, v]) => ({ attrName: k, attrValue: v }));
    api('/api/v1/plm/classifications/assign', {
      method: 'POST',
      body: JSON.stringify({ partId, nodeId: selectedNode.id, values: valueList })
    }).then(r => { if (r.success) { setShowAssign(false); load(); } }).catch(e => alert(e.message));
  };

  const renderNode = (node, depth = 0) => {
    const hasChildren = node.children?.length > 0;
    const isExpanded = expanded[node.id];
    const isAssigned = assigned?.some(a => a.nodeId === node.id);
    return (
      <div key={node.id} className="cn-node">
        <div className="cn-row" style={{ paddingLeft: depth * 20 }} onClick={() => hasChildren && toggleNode(node.id)}>
          <span className="cn-chevron">{hasChildren ? (isExpanded ? '▼' : '▶') : '•'}</span>
          <span className="cn-icon">{node.icon || (hasChildren ? '📁' : '🏷️')}</span>
          <span className="cn-name">{node.name}</span>
          <span className="cn-type">{node.nodeType}</span>
          {isAssigned && <span className="cn-assigned-badge">✓ Assigned</span>}
          <button className="cn-assign-btn btn-sm" onClick={e => { e.stopPropagation(); selectNode(node); }}>Assign</button>
        </div>
        {isExpanded && hasChildren && node.children.map(c => renderNode(c, depth + 1))}
      </div>
    );
  };

  if (loading) return <div className="cn-panel"><div className="cn-spinner" /></div>;
  if (error) return <div className="cn-panel"><div className="cn-error">Failed: {error} <button onClick={load}>Retry</button></div></div>;

  return (
    <div className="cn-panel">
      <div className="cn-header">
        <div><h3>Part Classification</h3><span className="cn-subtitle">Categorize parts with typed attributes</span></div>
        <button className="btn-primary btn-sm" onClick={() => setShowAssign(false)}>🔄 Refresh</button>
      </div>

      {assigned?.length > 0 && (
        <div className="cn-assigned">
          <div className="cn-assigned-title">Current Classification</div>
          {assigned.map(a => (
            <div key={a.nodeId + a.attrName} className="cn-assigned-row">
              <span className="cn-assigned-attr">{a.attrName}</span>
              <span className="cn-assigned-val">{a.attrValue || '—'}</span>
            </div>
          ))}
        </div>
      )}

      <div className="cn-tree">
        {tree.length === 0 ? <div className="cn-empty">No classification tree defined yet.</div> : tree.map(n => renderNode(n))}
      </div>

      {showAssign && selectedNode && (
        <div className="cn-modal-overlay" onClick={() => setShowAssign(false)}>
          <div className="cn-modal" onClick={e => e.stopPropagation()}>
            <h4>Assign: {selectedNode.name}</h4>
            {attrs.length === 0 ? (
              <p className="cn-muted">No attributes defined for this classification node.</p>
            ) : (
              attrs.map(a => (
                <div key={a.id} className="cn-field">
                  <label>{a.attrName} {a.required && <span className="cn-req">*</span>} {a.unit && <span className="cn-unit">({a.unit})</span>}</label>
                  {a.attrType === 'BOOLEAN' ? (
                    <select value={values[a.attrName] || ''} onChange={e => setValues({...values, [a.attrName]: e.target.value})} className="cn-input">
                      <option value="">—</option><option value="true">Yes</option><option value="false">No</option>
                    </select>
                  ) : a.attrType === 'OPTION' ? (
                    <select value={values[a.attrName] || ''} onChange={e => setValues({...values, [a.attrName]: e.target.value})} className="cn-input">
                      <option value="">—</option>{(a.options || '').split(',').map(o => <option key={o} value={o.trim()}>{o.trim()}</option>)}
                    </select>
                  ) : a.attrType === 'NUMBER' ? (
                    <input type="number" value={values[a.attrName] || ''} onChange={e => setValues({...values, [a.attrName]: e.target.value})} className="cn-input" />
                  ) : a.attrType === 'DATE' ? (
                    <input type="date" value={values[a.attrName] || ''} onChange={e => setValues({...values, [a.attrName]: e.target.value})} className="cn-input" />
                  ) : (
                    <input type="text" value={values[a.attrName] || ''} onChange={e => setValues({...values, [a.attrName]: e.target.value})} className="cn-input" />
                  )}
                </div>
              ))
            )}
            <div className="cn-modal-actions">
              <button className="btn-sm" onClick={() => setShowAssign(false)}>Cancel</button>
              <button className="btn-primary btn-sm" onClick={assignClassification}>Save Classification</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
