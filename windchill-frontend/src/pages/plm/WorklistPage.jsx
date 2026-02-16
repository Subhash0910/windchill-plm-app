import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import { clearAuth } from '../../utils/localStorage';
import './WorklistPage.css';

const fmtDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const WorklistPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [commentById, setCommentById] = useState({});

  const pendingCount = useMemo(
    () => items.filter((i) => i.status === 'PENDING').length,
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
      if (status === 401 || status === 403) {
        forceRelogin();
        return;
      }
      setError(e?.response?.data?.message || e?.message || 'Failed to load worklist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onApprove = async (id) => {
    setError('');
    try {
      const comment = commentById[id] || '';
      await plmApi.approveWorkItem(id, comment.trim() ? comment.trim() : null);
      await load();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        forceRelogin();
        return;
      }
      setError(e?.response?.data?.message || e?.message || 'Approve failed');
    }
  };

  const onReject = async (id) => {
    setError('');
    const comment = (commentById[id] || '').trim();
    if (!comment) {
      setError('Rejection comment is required.');
      return;
    }

    try {
      await plmApi.rejectWorkItem(id, comment);
      await load();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        forceRelogin();
        return;
      }
      setError(e?.response?.data?.message || e?.message || 'Reject failed');
    }
  };

  return (
    <div className="wl-page">
      <div className="wl-header">
        <div>
          <h2 className="wl-title">Worklist</h2>
          <div className="wl-sub">My pending tasks: {pendingCount}</div>
        </div>
        <div className="wl-actions">
          <button className="wl-btn" onClick={load} disabled={loading}>Refresh</button>
        </div>
      </div>

      {error ? <div className="wl-error">{error}</div> : null}

      <div className="wl-card">
        {loading ? (
          <div className="wl-empty">Loading…</div>
        ) : items.length === 0 ? (
          <div className="wl-empty">No work items assigned to you.</div>
        ) : (
          <table className="wl-table">
            <thead>
              <tr>
                <th>Work Item</th>
                <th>Part</th>
                <th>Status</th>
                <th>Due</th>
                <th>Completed</th>
                <th>Comment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const comment = commentById[it.id] || '';
                const isPending = it.status === 'PENDING';

                return (
                  <tr key={it.id}>
                    <td>#{it.id}</td>
                    <td>{it.partId}</td>
                    <td><span className={`wl-status wl-${String(it.status || '').toLowerCase()}`}>{it.status}</span></td>
                    <td>{fmtDateTime(it.dueAt)}</td>
                    <td>{fmtDateTime(it.completedAt)}</td>
                    <td>
                      <input
                        className="wl-input"
                        placeholder={isPending ? 'Optional for approve, required for reject' : '—'}
                        value={comment}
                        disabled={!isPending}
                        onChange={(e) => setCommentById((p) => ({ ...p, [it.id]: e.target.value }))}
                      />
                    </td>
                    <td>
                      <div className="wl-row-actions">
                        <button className="wl-btn wl-approve" onClick={() => onApprove(it.id)} disabled={!isPending}>Approve</button>
                        <button className="wl-btn wl-reject" onClick={() => onReject(it.id)} disabled={!isPending}>Reject</button>
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
