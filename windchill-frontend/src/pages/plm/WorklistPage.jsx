import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StateBadge from '../../components/plm/StateBadge';
import ContextualInsightPanel from '../../components/ai/ContextualInsightPanel';
import { plmApi } from '../../services/plmApi';
import { aiService } from '../../services/aiService';
import styles from './WorklistPage.module.css';

const TABS = ['All', 'Pending', 'Completed'];

export default function WorklistPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('All');
  const [acting, setActing] = useState(null);
  const [comment, setComment] = useState('');
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await plmApi.listMyWorkItems();
      const nextItems = Array.isArray(data) ? data : [];
      setItems(nextItems);
      setError(null);

      const requestedId = searchParams.get('workItemId');
      const requestedExists = requestedId && nextItems.some((item) => String(item.id) === String(requestedId));
      if (requestedExists) {
        setSelectedId(Number(requestedId));
      } else if (!nextItems.some((item) => String(item.id) === String(selectedId))) {
        setSelectedId(nextItems[0]?.id ?? null);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load worklist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSummary(null);
      return;
    }

    let active = true;
    setSummaryLoading(true);
    setSummaryError('');
    aiService.getWorkItemSummary(selectedId)
      .then((data) => {
        if (!active) return;
        setSummary(data || null);
      })
      .catch((e) => {
        if (!active) return;
        setSummary(null);
        setSummaryError(e.response?.data?.message || e.message || 'Failed to load AI review summary');
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  const openConfirm = (item, action) => {
    setConfirmItem(item);
    setConfirmAction(action);
    setComment('');
  };

  const closeConfirm = () => {
    setConfirmItem(null);
    setConfirmAction(null);
  };

  const submitAction = async () => {
    if (!confirmItem || !confirmAction) return;
    setActing(confirmItem.id);
    try {
      if (confirmAction === 'approve') {
        await plmApi.approveWorkItem(confirmItem.id, comment);
      } else {
        await plmApi.rejectWorkItem(confirmItem.id, comment);
      }
      closeConfirm();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Action failed');
    } finally {
      setActing(null);
    }
  };

  const statusFilter = (item) => {
    if (tab === 'Pending') return item.status === 'PENDING' || item.status === 'IN_REVIEW';
    if (tab === 'Completed') return item.status === 'APPROVED' || item.status === 'REJECTED';
    return true;
  };

  const filtered = useMemo(() => items.filter(statusFilter), [items, tab]);
  const pending = items.filter((item) => item.status === 'PENDING' || item.status === 'IN_REVIEW').length;
  const selectedItem = items.find((item) => String(item.id) === String(selectedId)) ?? null;
  const fmtDate = (value) => (value
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-');

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleRow}>
          <div className={styles.pageTitle}>
            <span className={styles.typeIcon}>📋</span>
            <div>
              <h1>My Worklist</h1>
              <p className={styles.subtitle}>Review tasks, approvals, and AI-assisted decision support.</p>
            </div>
          </div>
          {pending > 0 && <span className={styles.pendingBadge}>{pending} pending</span>}
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map((item) => (
            <button
              key={item}
              className={`${styles.tab} ${tab === item ? styles.tabActive : ''}`}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          <button className={styles.btnIcon} title="Refresh" onClick={load}>↻</button>
        </div>
      </div>

      {confirmItem && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <div className={`${styles.dialogHeader} ${confirmAction === 'approve' ? styles.approveHeader : styles.rejectHeader}`}>
              {confirmAction === 'approve' ? 'Approve Task' : 'Reject Task'}
            </div>
            <div className={styles.dialogBody}>
              <p className={styles.dialogDesc}>
                <strong>{confirmItem.partNumber || `Work item #${confirmItem.id}`}</strong>
              </p>
              <label>Comment (optional)
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a review comment..."
                  rows={3}
                />
              </label>
              <div className={styles.dialogActions}>
                <button
                  className={confirmAction === 'approve' ? styles.btnApprove : styles.btnReject}
                  onClick={submitAction}
                  disabled={!!acting}
                >
                  {acting ? 'Processing...' : (confirmAction === 'approve' ? 'Approve' : 'Reject')}
                </button>
                <button className={styles.btnCancel} onClick={closeConfirm}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.contentGrid}>
        <div className={styles.tableWrap}>
          {loading && <div className={styles.loading}>Loading worklist...</div>}
          {error && <div className={styles.errorBanner}>Error: {error} <button onClick={load}>Retry</button></div>}
          {!loading && !error && (
            <table className={styles.wcTable}>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Part</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className={styles.emptyRow}>No tasks in this view.</td></tr>
                )}
                {filtered.map((item) => {
                  const selected = String(item.id) === String(selectedId);
                  return (
                    <tr
                      key={item.id}
                      className={`${styles.row} ${selected ? styles.rowSelected : ''}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td className={styles.taskCell}>
                        <span className={styles.taskTitle}>Promotion review</span>
                        <span className={styles.taskDesc}>Task #{item.id}</span>
                      </td>
                      <td>
                        <div className={styles.objBlock}>
                          <span
                            className={styles.objLink}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (item.partId) navigate(`/plm/parts/${item.partId}`);
                            }}
                          >
                            {item.partNumber ?? `Part #${item.partId}`}
                          </span>
                          {item.partName ? <span className={styles.objSub}>{item.partName}</span> : null}
                        </div>
                      </td>
                      <td className={styles.dimCell}>{fmtDate(item.dueAt)}</td>
                      <td><StateBadge state={item.status} /></td>
                      <td className={styles.actionsCell}>
                        {(item.status === 'PENDING' || item.status === 'IN_REVIEW') ? (
                          <>
                            <button
                              className={styles.btnApproveSmall}
                              onClick={(event) => {
                                event.stopPropagation();
                                openConfirm(item, 'approve');
                              }}
                              disabled={acting === item.id}
                            >
                              Approve
                            </button>
                            <button
                              className={styles.btnRejectSmall}
                              onClick={(event) => {
                                event.stopPropagation();
                                openConfirm(item, 'reject');
                              }}
                              disabled={acting === item.id}
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                        {item.status === 'APPROVED' && <span className={styles.completedLabel}>Approved</span>}
                        {item.status === 'REJECTED' && <span className={styles.rejectedLabel}>Rejected</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <aside className={styles.sidePanel}>
          <ContextualInsightPanel
            title="AI review summary"
            subtitle="Use this as reviewer guidance, not an automatic decision."
            insight={summary}
            loading={summaryLoading}
            error={summaryError}
            emptyMessage={selectedItem ? 'No summary is available for this review item yet.' : 'Select a work item to see guidance.'}
            footer={selectedItem ? (
              <>
                <button className={styles.panelButton} onClick={() => navigate(`/plm/parts/${selectedItem.partId}`)}>
                  Open part
                </button>
                <button className={styles.panelButton} onClick={() => setSelectedId(selectedItem.id)}>
                  Keep focused
                </button>
              </>
            ) : null}
          />
        </aside>
      </div>

      <div className={styles.statusBar}>
        {filtered.length} task{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
