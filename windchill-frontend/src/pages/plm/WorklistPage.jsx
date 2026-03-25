import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StateBadge from '../../components/plm/StateBadge';
import styles from './WorklistPage.module.css';

const API = import.meta.env.VITE_API_URL ?? '';

const TABS = ['All', 'Pending', 'Completed'];

export default function WorklistPage() {
  const navigate   = useNavigate();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('All');
  const [acting,  setActing]  = useState(null);
  const [comment, setComment] = useState('');
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const token   = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/v1/plm/worklist`, { headers })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => { setItems(Array.isArray(data) ? data : (data.data ?? [])); setError(null); })
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openConfirm = (item, action) => {
    setConfirmItem(item); setConfirmAction(action); setComment('');
  };
  const closeConfirm = () => { setConfirmItem(null); setConfirmAction(null); };

  const submitAction = async () => {
    if (!confirmItem || !confirmAction) return;
    setActing(confirmItem.id);
    const url = confirmAction === 'approve'
      ? `${API}/api/v1/plm/worklist/${confirmItem.id}/approve`
      : `${API}/api/v1/plm/worklist/${confirmItem.id}/reject`;
    try {
      const res = await fetch(url, {
        method: 'POST', headers,
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) throw new Error(await res.text());
      closeConfirm();
      load();
    } catch (e) { alert(e.message); }
    finally { setActing(null); }
  };

  const statusFilter = item => {
    if (tab === 'Pending')   return item.status === 'PENDING'   || item.status === 'IN_REVIEW';
    if (tab === 'Completed') return item.status === 'APPROVED'  || item.status === 'REJECTED';
    return true;
  };

  const filtered = items.filter(statusFilter);
  const pending  = items.filter(i => i.status === 'PENDING' || i.status === 'IN_REVIEW').length;

  const fmtDate = s => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <div className={styles.pageTitle}>
            <span className={styles.typeIcon}>📋</span>
            <div>
              <h1>My Worklist</h1>
              <p className={styles.subtitle}>Pending approvals and review tasks</p>
            </div>
          </div>
          {pending > 0 && <span className={styles.pendingBadge}>{pending} pending</span>}
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >{t}</button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          <button className={styles.btnIcon} title="Refresh" onClick={load}>↻</button>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmItem && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <div className={`${styles.dialogHeader} ${confirmAction === 'approve' ? styles.approveHeader : styles.rejectHeader}`}>
              {confirmAction === 'approve' ? '✔ Approve Task' : '✖ Reject Task'}
            </div>
            <div className={styles.dialogBody}>
              <p className={styles.dialogDesc}>
                <strong>{confirmItem.title}</strong>
              </p>
              <label>Comment (optional)
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  rows={3}
                />
              </label>
              <div className={styles.dialogActions}>
                <button
                  className={confirmAction === 'approve' ? styles.btnApprove : styles.btnReject}
                  onClick={submitAction}
                  disabled={!!acting}
                >
                  {acting ? 'Processing…' : (confirmAction === 'approve' ? 'Approve' : 'Reject')}
                </button>
                <button className={styles.btnCancel} onClick={closeConfirm}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading && <div className={styles.loading}>Loading worklist…</div>}
        {error   && <div className={styles.errorBanner}>Error: {error} <button onClick={load}>Retry</button></div>}
        {!loading && !error && (
          <table className={styles.wcTable}>
            <thead>
              <tr>
                <th>Task</th>
                <th>Object</th>
                <th>Type</th>
                <th>Target State</th>
                <th>Assigned By</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className={styles.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className={styles.emptyRow}>No tasks in this view.</td></tr>
              )}
              {filtered.map(item => (
                <tr key={item.id} className={styles.row}>
                  <td className={styles.taskCell}>
                    <span className={styles.taskTitle}>{item.title ?? `Task #${item.id}`}</span>
                    {item.description && <span className={styles.taskDesc}>{item.description}</span>}
                  </td>
                  <td>
                    <span
                      className={styles.objLink}
                      onClick={() => item.partId && navigate(`/plm/parts/${item.partId}`)}
                    >
                      {item.partNumber ?? item.objectRef ?? `#${item.relatedObjectId}`}
                    </span>
                  </td>
                  <td><span className={styles.typePill}>{item.workItemType ?? 'REVIEW'}</span></td>
                  <td><StateBadge state={item.targetState} /></td>
                  <td className={styles.dimCell}>{item.assignedBy ?? '—'}</td>
                  <td className={styles.dimCell}>{fmtDate(item.dueDate)}</td>
                  <td><StateBadge state={item.status} /></td>
                  <td className={styles.actionsCell}>
                    {(item.status === 'PENDING' || item.status === 'IN_REVIEW') && (
                      <>
                        <button
                          className={styles.btnApproveSmall}
                          onClick={() => openConfirm(item, 'approve')}
                          disabled={acting === item.id}
                        >Approve</button>
                        <button
                          className={styles.btnRejectSmall}
                          onClick={() => openConfirm(item, 'reject')}
                          disabled={acting === item.id}
                        >Reject</button>
                      </>
                    )}
                    {item.status === 'APPROVED' && <span className={styles.completedLabel}>✔ Approved</span>}
                    {item.status === 'REJECTED' && <span className={styles.rejectedLabel}>✖ Rejected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.statusBar}>
        {filtered.length} task{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
