import React, { useState, useEffect } from 'react';
import './ActionToolbar.css';

export default function ActionToolbar({ targetType, targetId, category, onActionComplete }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(null);
  const token = () => localStorage.getItem('token') || '';

  useEffect(() => {
    if (!targetType) return;
    setLoading(true);
    let url = `/api/v1/plm/actions?targetType=${targetType}`;
    if (targetId) url += `&targetId=${targetId}`;
    if (category) url += `&category=${category}`;
    fetch(url, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(r => setActions(r.data || []))
      .finally(() => setLoading(false));
  }, [targetType, targetId, category]);

  const execute = async (action) => {
    setExecuting(action.actionName);
    try {
      const r = await fetch('/api/v1/plm/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ actionName: action.actionName, targetId, targetType, parameters: {} })
      });
      const d = await r.json();
      if (d.success && d.data?.success) {
        if (onActionComplete) onActionComplete(action);
      }
    } finally { setExecuting(null); }
  };

  if (loading) return <div className="at-bar">{Array(3).fill(0).map((_,i) => <div key={i} className="at-skel-btn" />)}</div>;
  if (!actions.length) return null;

  return (
    <div className="at-bar">
      {actions.map(a => (
        <button
          key={a.actionName}
          className={`at-btn ${executing === a.actionName ? 'at-btn-loading' : ''}`}
          onClick={() => execute(a)}
          disabled={!!executing}
          title={a.description || a.displayName}
        >
          {a.icon && <span className="at-icon">{a.icon}</span>}
          {a.displayName || a.actionName}
        </button>
      ))}
    </div>
  );
}
