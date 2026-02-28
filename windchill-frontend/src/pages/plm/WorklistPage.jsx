import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import { clearAuth } from '../../utils/localStorage';
import './WorklistPage.css';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};

const STATUS_CLASS = {
  PENDING:  'wl-pending',
  APPROVED: 'wl-approved',
  REJECTED: 'wl-rejected',
};

const WorklistPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusWorkItemId = searchParams.get('workItemId');

  const [loading,     setLoading]     = useState(false);
  const [items,       setItems]       = useState([]);
  const [error,       setError]       = useState('');
  const [commentById, setCommentById] = useState({});
  const [highlightId, setHighlightId] = useState(null);
  const scrollDoneRef = useRef(false);

  const pendingCount = useMemo(
    () => items.filter(i => i.status === 'PENDING').length,
    [items]
  );

  const forceRelogin = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await plmApi.listMyWorkItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) { forceRelogin(); return; }
      setError(e?.response?.data?.message || e?.message || 'Failed to load worklist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Deep-link: /plm/worklist?workItemId=123
  useEffect(() => {
    scrollDoneRef.current = false;
    setHighlightId(focusWorkItemId ? String(focusWorkItemId) : null);
  }, [focusWorkItemId]);

  useEffect(() => {
    if (!highlightId || loading || scrollDoneRef.current) return;
    const row = document.getElementById(`wl-row-${highlightId}`);
    if (!row) return;
    scrollDoneRef.current = true;
    setTimeout(() => row.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }, [highlightId, loading, items.length]);

  const onApprove = async (id) => {
    setError('');
    try {
      const comment = (commentById[id] || '').trim();
      await plmApi.approveWorkItem(id, comment || null);
      await load();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) { forceRelogin(); return; }
      setError(e?.response?.data?.message || e?.message || 'Approve failed');
    }
  };

  const onReject = async (id) => {
    setError('');
    const comment = (commentById[id] || '').trim();
    if (!comment) { setError('A rejection comment is required.'); return; }
    try {
      await plmApi.rejectWorkItem(id, comment);
      await load();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) { forceRelogin(); return; }
      setError(e?.response?.data?.message || e?.message || 'Reject failed');
    }
  };

  return (
    <div className="wl-page">
      {/* ── Header ── */}
      <div className="wl-header">
        <div>
          <h2 className="wl-title">Worklist</h2>
          <div className="wl-sub">
            {pendingCount > 0
              ? <span style={{ color: '#dc2626', fontWeight: 600 }}>{pendingCount} pending review{pendingCount > 1 ? 's' : ''} awaiting you</span>
              : <span style={{ color: '#16a34a' }}>✅ All caught up — no pending tasks</span>
            }
          </div>
        </div>
        <button className="wl-btn" onClick={load} disabled={loading}>Refresh</button>
      </div>

      {error && <div className="wl-error">{error}</div>}

      <div className="wl-card">
        {loading ? (
          <div className="wl-empty">Loading…</div>
        ) : items.length === 0 ? (
          <div className="wl-empty">
            <div style={{ fontSize: '2em', marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No work items assigned to you</div>
            <div style={{ color: '#64748b', fontSize: '0.9em' }}>
              When a part is promoted for review and you are a context manager,
              a work item will appear here.
            </div>
          </div>
        ) : (
          <table className="wl-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Part</th>
                <th>Status</th>
                <th>Due</th>
                <th>Completed</th>
                <th>Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => {
                const comment     = commentById[it.id] || '';
                const isPending   = it.status === 'PENDING';
                const isHighlight = highlightId && String(it.id) === String(highlightId);

                return (
                  <tr
                    key={it.id}
                    id={`wl-row-${it.id}`}
                    className={isHighlight ? 'wl-highlight' : ''}
                  >
                    {/* Work item # */}
                    <td className="mono" style={{ color: '#94a3b8', fontSize: '0.85em' }}>#{it.id}</td>

                    {/* Part — show part number as link, part name as subtitle */}
                    <td>
                      <button
                        type="button"
                        className="wl-link"
                        onClick={() => it.partId && navigate(`/plm/parts/${it.partId}`)}
                        title={it.partId ? `Open Part #${it.partId}` : ''}
                      >
                        {it.partNumber || `#${it.partId}`}
                      </button>
                      {it.partName && (
                        <div style={{ fontSize: '0.78em', color: '#64748b', marginTop: 2, fontStyle: 'italic' }}>
                          {it.partName}
                        </div>
                      )}
                    </td>

                    {/* Status badge */}
                    <td>
                      <span className={`wl-status ${STATUS_CLASS[it.status] || ''}`}>
                        {it.status}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.85em', color: '#64748b' }}>{fmtDate(it.dueAt)}</td>
                    <td style={{ fontSize: '0.85em', color: '#64748b' }}>{fmtDate(it.completedAt)}</td>

                    {/* Comment input */}
                    <td>
                      <input
                        className="wl-input"
                        placeholder={isPending ? 'Optional (required for reject)' : '—'}
                        value={comment}
                        disabled={!isPending}
                        onChange={e => setCommentById(p => ({ ...p, [it.id]: e.target.value }))}
                      />
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="wl-row-actions">
                        <button
                          className="wl-btn wl-approve"
                          onClick={() => onApprove(it.id)}
                          disabled={!isPending}
                          title="Approve this work item"
                        >
                          ✔ Approve
                        </button>
                        <button
                          className="wl-btn wl-reject"
                          onClick={() => onReject(it.id)}
                          disabled={!isPending}
                          title="Reject (comment required)"
                        >
                          ✖ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WorklistPage;
