import React, { useEffect, useState, useMemo } from 'react';
import { plmApi } from '../../services/plmApi';
import Button from '../../components/atoms/Button/Button';
import styles from './AuditLogPage.module.css';

const TYPES = ['ALL', 'PART', 'DOCUMENT', 'CHANGE', 'WORK_ITEM', 'USER', 'TEAM'];

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(new Set());

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await plmApi.getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const matchesType = filterType === 'ALL' || l.entityType === filterType;
      const q = search.toLowerCase();
      const matchesSearch = !q || 
        String(l.entityType).toLowerCase().includes(q) ||
        String(l.entityId).toLowerCase().includes(q) ||
        String(l.action).toLowerCase().includes(q) ||
        String(l.actor).toLowerCase().includes(q) ||
        String(l.details).toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [logs, filterType, search]);

  if (loading) {
    return (
      <div className={styles.alLoading}>
        <div className={styles.alSpinner} />
        <p>Retrieving secure audit records…</p>
      </div>
    );
  }

  return (
    <div className={styles.alPage}>
      <div className={styles.alHeader}>
        <div>
          <h2 className={styles.alTitle}>System Audit Log</h2>
          <p className={styles.alSub}>Permanent, tamper-proof record of all managed object modifications.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>Refresh Log</Button>
      </div>

      <div className={styles.alFilters}>
        <div className={styles.alTypeChips}>
          {TYPES.map(t => (
            <button
              key={t}
              className={filterType === t ? `${styles.alChip} ${styles.alChipActive}` : styles.alChip}
              onClick={() => setFilterType(t)}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className={styles.alSearchWrap}>
          <span className={styles.alSearchIcon}>🔍</span>
          <input
            className={styles.alSearch}
            placeholder="Search by ID, user, or action details…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.alSearchClear} onClick={() => setSearch('')}>×</button>
          )}
        </div>
      </div>

      <div className={styles.alCount}>
        Showing <strong>{filtered.length}</strong> of <strong>{logs.length}</strong> system events
      </div>

      {error && <div className={styles.alError}><p>{error}</p><Button size="sm" onClick={load}>Retry</Button></div>}

      {!error && filtered.length === 0 && (
        <div className={styles.alEmpty}>
          <span className={styles.alEmptyIcon}>📄</span>
          <h3>No records found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      <div className={styles.alTimeline}>
        {filtered.map(l => {
          const isExp = expanded.has(l.id);
          const actionClass = styles[`badge-${l.action}`] || '';
          
          return (
            <div key={l.id} className={styles.alEntry}>
              <div className={styles.alEntryLeft}>
                <div className={`${styles.alDot} ${l.action === 'CREATE' ? styles.alDotActive : ''}`} />
                <div className={styles.alLine} />
              </div>
              <div className={styles.alEntryBody}>
                <div className={styles.alEntryTop}>
                  <span className={`${styles.alActionBadge} ${actionClass}`}>{l.action.replace('_', ' ')}</span>
                  <div className={styles.alEntity}>
                    <strong>{l.entityType}</strong>
                    <span className={styles.alEntityId}>{l.entityId}</span>
                  </div>
                  <div className={styles.alEntryMeta}>
                    <span className={styles.alActor}>{l.actor}</span>
                    <span className={styles.alTime}>{new Date(l.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                
                {l.details && (
                  <button className={styles.alExpandBtn} onClick={() => toggleExpand(l.id)}>
                    {isExp ? '▼ Hide Details' : '▶ View Details'}
                  </button>
                )}
                
                {isExp && l.details && (
                  <div className={styles.alDetails}>{l.details}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditLogPage;
