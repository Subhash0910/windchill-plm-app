import React, { useEffect, useState } from 'react';
import { plmApi } from '../../services/plmApi';
import './AuditPanel.css';

const AuditPanel = ({ entityType, entityId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!entityType || !entityId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await plmApi.getAudit(entityType, entityId);
      setLogs(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  return (
    <div className="audit-wrap">
      <div className="audit-title">Audit</div>
      {loading && <div className="plm-muted">Loading audit...</div>}
      {error && <div className="plm-error">{error}</div>}

      {!loading && !error && (
        <div className="audit-list">
          {(logs || []).map(l => (
            <div key={l.id} className="audit-row">
              <div className="audit-action">{l.action}</div>
              <div className="audit-meta">
                <span className="mono">{l.actor || 'system'}</span>
                <span className="dot">•</span>
                <span className="mono">{l.createdAt || ''}</span>
              </div>
              {l.details && <div className="audit-details">{l.details}</div>}
            </div>
          ))}
          {(!logs || logs.length === 0) && <div className="plm-muted">No audit events yet.</div>}
        </div>
      )}
    </div>
  );
};

export default AuditPanel;
