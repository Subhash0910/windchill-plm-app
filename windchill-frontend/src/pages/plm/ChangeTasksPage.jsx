import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import './ChangeTasksPage.css';

const ChangeTasksPage = () => {
  const navigate = useNavigate();

  const [pendingOnly, setPendingOnly] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [comments, setComments] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await plmApi.getMyChangeTasks(pendingOnly);
      setTasks(Array.isArray(res) ? res : []);
    } catch (e) {
      setTasks([]);
      setError(e?.response?.data?.message || e?.message || 'Failed to load change tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOnly]);

  const pendingCount = useMemo(() => tasks.filter((t) => t.decision === 'PENDING').length, [tasks]);

  const setRowLoading = (id, v) => setActionLoading((m) => ({ ...m, [id]: v }));

  const approve = async (t) => {
    setRowLoading(t.id, true);
    setError('');
    try {
      await plmApi.approveChangeTask(t.id, comments[t.id] || '');
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Approve failed');
    } finally {
      setRowLoading(t.id, false);
    }
  };

  const reject = async (t) => {
    const c = (comments[t.id] || '').trim();
    if (!c) {
      setError('Rejection comment is required (Windchill-style).');
      return;
    }
    setRowLoading(t.id, true);
    setError('');
    try {
      await plmApi.rejectChangeTask(t.id, c);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Reject failed');
    } finally {
      setRowLoading(t.id, false);
    }
  };

  return (
    <div className="ct-page">
      <div className="ct-head">
        <div>
          <div className="ct-title">Change Tasks</div>
          <div className="ct-sub">Your assigned review/implementation tasks for ECR/ECN.</div>
        </div>

        <div className="ct-actions">
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes')}>Back to Changes</Button>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>Refresh</Button>
        </div>
      </div>

      {error ? <div className="plm-error">{error}</div> : null}

      <div className="ct-card">
        <div className="ct-card-title">My tasks ({pendingCount} pending)</div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} />
            Pending only
          </label>
          <div className="plm-muted">Approve all review tasks to auto-create ECN + implementation task.</div>
        </div>

        {loading ? (
          <div className="plm-muted">Loading tasks…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ct-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>For</th>
                  <th>Decision</th>
                  <th>Comment</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const forText = t.changeRequestId
                    ? `ECR ${t.changeRequestId}`
                    : t.changeNoticeId
                      ? `ECN ${t.changeNoticeId}`
                      : '-';

                  const canAct = t.decision === 'PENDING' && !actionLoading[t.id];

                  return (
                    <tr key={t.id}>
                      <td className="mono">{t.id}</td>
                      <td>{t.type}</td>
                      <td className="mono">
                        {forText}
                        {t.changeRequestId ? (
                          <span style={{ marginLeft: 8 }}>
                            <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/changes/ecr/${t.changeRequestId}`)}>Open</Button>
                          </span>
                        ) : null}
                      </td>
                      <td>{t.decision}</td>
                      <td>
                        <textarea
                          className="plm-input ct-comment"
                          rows={2}
                          value={comments[t.id] ?? (t.comment || '')}
                          onChange={(e) => setComments((m) => ({ ...m, [t.id]: e.target.value }))}
                          placeholder={t.decision === 'PENDING' ? 'Add comment (required for reject)…' : ''}
                          disabled={t.decision !== 'PENDING'}
                        />
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Button variant="primary" size="sm" onClick={() => approve(t)} disabled={!canAct}>
                          {actionLoading[t.id] ? 'Working…' : 'Approve'}
                        </Button>
                        <span style={{ display: 'inline-block', width: 8 }} />
                        <Button variant="secondary" size="sm" onClick={() => reject(t)} disabled={!canAct}>Reject</Button>
                      </td>
                    </tr>
                  );
                })}

                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="plm-muted" style={{ padding: 12 }}>No tasks found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeTasksPage;
