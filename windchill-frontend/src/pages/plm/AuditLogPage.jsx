import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { plmApi } from '../../services/plmApi';
import './AuditLogPage.css';

const ENTITY_ICONS = {
  PART:      '🔩',
  ECR:       '📋',
  PROMOTION: '⬆️',
  CONTEXT:   '🏢',
  USER:      '👤',
  BOM:       '📊',
  WORKITEM:  '✅',
  FOLDER:    '📁',
  DOCUMENT:  '📄',
  PRODUCT:   '📦',
  PROJECT:   '🗂️',
};

const ACTION_STYLES = {
  CREATED:   { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  UPDATED:   { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  DELETED:   { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  PROMOTED:  { bg: '#ede9fe', text: '#5b21b6', dot: '#8b5cf6' },
  APPROVED:  { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  REJECTED:  { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  SUBMITTED: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  REVISED:   { bg: '#fce7f3', text: '#9d174d', dot: '#ec4899' },
  COMPLETED: { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
};

const DEFAULT_STYLE = { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const formatFull = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString();
};

const AuditLogPage = () => {
  const [logs,      setLogs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [typeFilter,setTypeFilter] = useState('ALL');
  const [actionQ,   setActionQ]   = useState('');
  const [expanded,  setExpanded]  = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await plmApi.getAllAuditLogs(200);
      setLogs(Array.isArray(data) ? data : []);
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // collect unique entity types from data
  const entityTypes = useMemo(() => {
    const s = new Set(logs.map(l => l.entityType).filter(Boolean));
    return ['ALL', ...Array.from(s).sort()];
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (typeFilter !== 'ALL' && l.entityType !== typeFilter) return false;
      if (actionQ.trim() && !l.action?.toLowerCase().includes(actionQ.toLowerCase())) return false;
      return true;
    });
  }, [logs, typeFilter, actionQ]);

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const actionStyle = (action) => {
    if (!action) return DEFAULT_STYLE;
    const key = Object.keys(ACTION_STYLES).find(k => action.toUpperCase().includes(k));
    return key ? ACTION_STYLES[key] : DEFAULT_STYLE;
  };

  return (
    <div className="al-page">
      {/* Header */}
      <div className="al-header">
        <div>
          <h1 className="al-title">📋 Audit Log</h1>
          <p className="al-sub">System-wide activity trail — all entity changes, promotions &amp; approvals</p>
        </div>
        <button className="al-btn-refresh" onClick={load} disabled={loading}>
          {loading ? '↻…' : '↻ Refresh'}
        </button>
      </div>

      {/* Filter bar */}
      <div className="al-filters">
        <div className="al-type-chips">
          {entityTypes.map(t => (
            <button
              key={t}
              className={`al-chip ${typeFilter === t ? 'al-chip--active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t !== 'ALL' && <span>{ENTITY_ICONS[t] || '•'}</span>}
              {t}
            </button>
          ))}
        </div>
        <div className="al-search-wrap">
          <span className="al-search-icon">🔍</span>
          <input
            className="al-search"
            placeholder="Filter by action (CREATED, PROMOTED…)"
            value={actionQ}
            onChange={e => setActionQ(e.target.value)}
          />
          {actionQ && <button className="al-search-clear" onClick={() => setActionQ('')}>&times;</button>}
        </div>
      </div>

      {/* Count */}
      {!loading && !error && (
        <div className="al-count">
          Showing <strong>{filtered.length}</strong> of <strong>{logs.length}</strong> entries
        </div>
      )}

      {/* Content */}
      {error ? (
        <div className="al-error">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={load}>Retry</button>
        </div>
      ) : loading ? (
        <div className="al-loading"><div className="al-spinner" /><p>Loading audit log…</p></div>
      ) : filtered.length === 0 ? (
        <div className="al-empty">
          <span>📋</span>
          <h3>{logs.length === 0 ? 'No audit entries yet' : 'No entries match your filters'}</h3>
          <p>{logs.length === 0 ? 'Audit logs appear here as users interact with the system' : 'Try changing the entity type or action filter'}</p>
        </div>
      ) : (
        <div className="al-timeline">
          {filtered.map((log, i) => {
            const s    = actionStyle(log.action);
            const icon = ENTITY_ICONS[log.entityType] || '📜';
            const open = expanded[log.id];
            const hasDetails = log.details && log.details.trim();
            return (
              <div className="al-entry" key={log.id ?? i}>
                {/* Dot + line */}
                <div className="al-entry-left">
                  <div className="al-dot" style={{ background: s.dot }} />
                  {i < filtered.length - 1 && <div className="al-line" />}
                </div>

                {/* Content */}
                <div className="al-entry-body">
                  <div className="al-entry-top">
                    <span className="al-action-badge" style={{ background: s.bg, color: s.text }}>
                      {log.action || 'UNKNOWN'}
                    </span>
                    <span className="al-entity">
                      {icon} <strong>{log.entityType}</strong>
                      {log.entityId && <span className="al-entity-id">#{log.entityId}</span>}
                    </span>
                    <div className="al-entry-meta">
                      {log.actor && <span className="al-actor">👤 {log.actor}</span>}
                      <span className="al-time" title={formatFull(log.createdAt)}>
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                  </div>

                  {hasDetails && (
                    <>
                      <button className="al-expand-btn" onClick={() => toggleExpand(log.id)}>
                        {open ? '▴ Hide details' : '▾ Show details'}
                      </button>
                      {open && (
                        <pre className="al-details">{log.details}</pre>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
