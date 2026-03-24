import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import InfoPage from '../../components/plm/InfoPage';
import AuditPanel from '../../components/plm/AuditPanel';
import { plmApi } from '../../services/plmApi';
import { AuthContext } from '../../context/AuthContext';
import './EcrDetailPage.css';

const PRIORITY_META = {
  CRITICAL: { label: 'Critical', cls: 'priority-critical' },
  HIGH:     { label: 'High',     cls: 'priority-high'     },
  NORMAL:   { label: 'Normal',   cls: 'priority-normal'   },
  LOW:      { label: 'Low',      cls: 'priority-low'      },
};

const STATUS_META = {
  DRAFT:     { label: 'Draft',      cls: 'ecr-status-draft'     },
  SUBMITTED: { label: 'Submitted',  cls: 'ecr-status-submitted' },
  IN_REVIEW: { label: 'In Review',  cls: 'ecr-status-inreview'  },
  APPROVED:  { label: 'Approved',   cls: 'ecr-status-approved'  },
  REJECTED:  { label: 'Rejected',   cls: 'ecr-status-rejected'  },
  CLOSED:    { label: 'Closed',     cls: 'ecr-status-closed'    },
};

const StatusPill = ({ value }) => {
  const m = STATUS_META[value] || { label: value, cls: 'ecr-status-draft' };
  return <span className={`ecr-status-pill ${m.cls}`}>{m.label}</span>;
};

const PriorityPill = ({ value }) => {
  const m = PRIORITY_META[value] || { label: value, cls: 'priority-normal' };
  return <span className={`priority-pill ${m.cls}`}>{m.label}</span>;
};

const TABS = { DETAILS: 'DETAILS', ORDER_ITEMS: 'ORDER_ITEMS', NOTICE: 'NOTICE', AUDIT: 'AUDIT' };

const EcrDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const me = user?.username;

  const [ecr,          setEcr]          = useState(null);
  const [orderItems,   setOrderItems]   = useState([]);
  const [notice,       setNotice]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [actionLoading,setActionLoading]= useState(false);
  const [comment,      setComment]      = useState('');
  const [showComment,  setShowComment]  = useState(false);
  const [pendingAction,setPendingAction]= useState(null); // 'approve'|'reject'
  const [activeTab,    setActiveTab]    = useState(TABS.DETAILS);
  const [releasingEcn, setReleasingEcn] = useState(false);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const data = await plmApi.getEcr(id);
      setEcr(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load ECR');
    } finally { setLoading(false); }
  };

  const loadOrderItems = async () => {
    try {
      const items = await plmApi.getEcrOrderItems(id);
      setOrderItems(items || []);
    } catch { setOrderItems([]); }
  };

  const loadNotice = async () => {
    try {
      const n = await plmApi.getEcrNotice(id);
      setNotice(n || null);
    } catch { setNotice(null); }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line
  useEffect(() => {
    if (!ecr) return;
    if (activeTab === TABS.ORDER_ITEMS) loadOrderItems();
    if (activeTab === TABS.NOTICE)      loadNotice();
  }, [activeTab, ecr?.id]); // eslint-disable-line

  const doAction = async (action, withComment = false) => {
    if (withComment && !showComment) {
      setPendingAction(action);
      setComment('');
      setShowComment(true);
      return;
    }
    try {
      setActionLoading(true); setError(null);
      let updated;
      if      (action === 'submit')       updated = await plmApi.submitEcr(id);
      else if (action === 'start-review') updated = await plmApi.startEcrReview(id);
      else if (action === 'approve')      updated = await plmApi.approveEcr(id, comment);
      else if (action === 'reject')       updated = await plmApi.rejectEcr(id, comment);
      else if (action === 'close')        updated = await plmApi.closeEcr(id);
      else if (action === 'reopen')       updated = await plmApi.reopenEcr(id);
      setEcr(updated);
      setShowComment(false);
      setComment('');
      setPendingAction(null);
      if (action === 'approve') {
        await loadOrderItems();
        await loadNotice();
        setActiveTab(TABS.NOTICE);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Action failed');
    } finally { setActionLoading(false); }
  };

  const releaseNotice = async () => {
    if (!notice) return;
    try {
      setReleasingEcn(true); setError(null);
      const released = await plmApi.releaseEcn(notice.id);
      setNotice(released);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to release ECN');
    } finally { setReleasingEcn(false); }
  };

  if (loading)        return <div className="plm-muted">Loading ECR…</div>;
  if (error && !ecr)  return <div className="plm-error">{error}</div>;
  if (!ecr)           return <div className="plm-muted">ECR not found.</div>;

  const status  = ecr.status;
  const isOwner = ecr.createdBy === me;

  // ── InfoPage attribute rows ──
  const infoRows = [
    { label: 'ECR Number',   value: ecr.changeNumber,                              mono: true },
    { label: 'Priority',     value: ecr.priority                                               },
    { label: 'Status',       value: ecr.status                                                 },
    { label: 'Created By',   value: ecr.createdBy,                                 mono: true },
    { label: 'Created',      value: ecr.createdAt ? new Date(ecr.createdAt).toLocaleString() : '—' },
    { label: 'Submitted By', value: ecr.submittedBy  || '—',                       mono: true },
    { label: 'Reviewed By',  value: ecr.reviewedBy   || '—',                       mono: true },
    { label: 'Context ID',   value: String(ecr.contextId || '—'),                  mono: true },
    { label: 'ECN Linked',   value: ecr.changeNoticeId ? `ECN #${ecr.changeNoticeId}` : '—' },
  ];

  const headerActions = [
    <Button key="refresh" variant="secondary" size="sm" onClick={load} disabled={loading || actionLoading}>Refresh</Button>,
    <Button key="back"    variant="secondary" size="sm" onClick={() => navigate('/plm/changes')}>Back</Button>,
  ];

  const TabBtn = ({ tab, label }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '6px 10px', borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: activeTab === tab ? '#0f4d6d' : '#fff',
        color:      activeTab === tab ? '#fff'    : '#111827',
        cursor: 'pointer', fontWeight: 600, fontSize: 13,
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* ── InfoPage header ── */}
      <InfoPage
        title="Engineering Change Request"
        subtitle={`${ecr.changeNumber} — ${ecr.title}`}
        badge={{ label: ecr.status, variant: ecr.status }}
        actions={headerActions}
        rows={infoRows}
      />

      {error && <div className="plm-error" style={{ margin: '8px 0' }}>{error}</div>}

      {/* ── Two-column grid ── */}
      <div className="ecr-detail-grid">

        {/* ── LEFT: Lifecycle action bar + description ── */}
        <div className="ecr-detail-card">
          <div className="card-title">Lifecycle &amp; Actions</div>

          {/* Action bar */}
          <div className="ecr-action-bar">
            {status === 'DRAFT' && isOwner && (
              <Button variant="primary" size="sm" onClick={() => doAction('submit')} disabled={actionLoading}>
                📤 Submit for Review
              </Button>
            )}
            {status === 'SUBMITTED' && (
              <Button variant="primary" size="sm" onClick={() => doAction('start-review')} disabled={actionLoading}>
                🔍 Start Review
              </Button>
            )}
            {(status === 'IN_REVIEW' || status === 'SUBMITTED') && (
              <>
                <Button variant="primary" size="sm" onClick={() => doAction('approve', true)} disabled={actionLoading}>
                  ✅ Approve
                </Button>
                <Button variant="secondary" size="sm" onClick={() => doAction('reject', true)} disabled={actionLoading}>
                  ❌ Reject
                </Button>
              </>
            )}
            {(status === 'APPROVED' || status === 'REJECTED') && (
              <Button variant="secondary" size="sm" onClick={() => doAction('close')} disabled={actionLoading}>
                🔒 Close
              </Button>
            )}
            {status === 'REJECTED' && isOwner && (
              <Button variant="primary" size="sm" onClick={() => doAction('reopen')} disabled={actionLoading}>
                ↩ Reopen
              </Button>
            )}
            <span className="ecr-action-status">
              <StatusPill value={status} />
            </span>
          </div>

          {/* Comment input for approve/reject */}
          {showComment && (
            <div className="ecr-comment-box">
              <label>{pendingAction === 'approve' ? '✅ Approval comment (optional)' : '❌ Rejection reason (required for traceability)'}</label>
              <textarea
                className="plm-textarea"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder={pendingAction === 'approve' ? 'Notes on approval…' : 'Explain why this ECR is being rejected…'}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button
                  variant={pendingAction === 'approve' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => doAction(pendingAction)}
                  disabled={actionLoading || (pendingAction === 'reject' && !comment.trim())}
                >
                  {actionLoading ? 'Processing…' : (pendingAction === 'approve' ? 'Confirm Approve' : 'Confirm Reject')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setShowComment(false); setPendingAction(null); setComment(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Resolution info */}
          {ecr.resolutionComment && (
            <div className="ecr-resolution">
              <div className="ecr-resolution-label">
                {status === 'APPROVED' ? '✅ Approval note' : status === 'REJECTED' ? '❌ Rejection reason' : 'Resolution'}
              </div>
              <div className="ecr-resolution-text">{ecr.resolutionComment}</div>
              {ecr.reviewedAt && (
                <div className="plm-muted" style={{ marginTop: 4, fontSize: 11 }}>
                  by <span className="mono">{ecr.reviewedBy}</span> · {new Date(ecr.reviewedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Description + Reason */}
          <div style={{ marginTop: 14 }}>
            <div className="ecr-section-label">Description</div>
            <div className="ecr-text-block">{ecr.description || <span className="plm-muted">No description.</span>}</div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="ecr-section-label">Reason / Justification</div>
            <div className="ecr-text-block">{ecr.reason || <span className="plm-muted">No reason provided.</span>}</div>
          </div>

          {/* Impacted Parts list */}
          <div style={{ marginTop: 14, borderTop: '1px solid #eef0f7', paddingTop: 10 }}>
            <div className="ecr-section-label">Impacted Parts ({(ecr.impactedPartIds || []).length})</div>
            {(ecr.impactedPartIds || []).length === 0 ? (
              <div className="plm-muted">No parts specified.</div>
            ) : (
              <div className="ecr-part-id-list">
                {(ecr.impactedPartIds || []).map(pid => (
                  <button
                    key={pid}
                    type="button"
                    className="ecr-part-id-chip"
                    onClick={() => navigate(`/plm/parts/${pid}`)}
                    title={`Open Part #${pid}`}
                  >
                    Part #{pid}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Tabs ── */}
        <div className="ecr-detail-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Details</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <TabBtn tab={TABS.DETAILS}     label="Info" />
              <TabBtn tab={TABS.ORDER_ITEMS} label="Change Order" />
              <TabBtn tab={TABS.NOTICE}      label="ECN" />
              <TabBtn tab={TABS.AUDIT}       label="Audit" />
            </div>
          </div>

          {/* INFO tab */}
          {activeTab === TABS.DETAILS && (
            <div className="ecr-info-grid">
              <div className="ecr-info-row"><span className="ecr-info-label">Number</span>    <span className="mono">{ecr.changeNumber}</span></div>
              <div className="ecr-info-row"><span className="ecr-info-label">Status</span>    <StatusPill value={ecr.status} /></div>
              <div className="ecr-info-row"><span className="ecr-info-label">Priority</span>  <PriorityPill value={ecr.priority} /></div>
              <div className="ecr-info-row"><span className="ecr-info-label">Created By</span><span className="mono">{ecr.createdBy}</span></div>
              <div className="ecr-info-row"><span className="ecr-info-label">Created</span>   <span>{ecr.createdAt ? new Date(ecr.createdAt).toLocaleString() : '—'}</span></div>
              {ecr.submittedBy && <div className="ecr-info-row"><span className="ecr-info-label">Submitted By</span><span className="mono">{ecr.submittedBy}</span></div>}
              {ecr.submittedAt && <div className="ecr-info-row"><span className="ecr-info-label">Submitted At</span><span>{new Date(ecr.submittedAt).toLocaleString()}</span></div>}
              {ecr.reviewedBy  && <div className="ecr-info-row"><span className="ecr-info-label">Reviewed By</span> <span className="mono">{ecr.reviewedBy}</span></div>}
              {ecr.reviewedAt  && <div className="ecr-info-row"><span className="ecr-info-label">Reviewed At</span> <span>{new Date(ecr.reviewedAt).toLocaleString()}</span></div>}
              {ecr.closedBy    && <div className="ecr-info-row"><span className="ecr-info-label">Closed By</span>   <span className="mono">{ecr.closedBy}</span></div>}
              {ecr.closedAt    && <div className="ecr-info-row"><span className="ecr-info-label">Closed At</span>   <span>{new Date(ecr.closedAt).toLocaleString()}</span></div>}
              {ecr.changeNoticeId && <div className="ecr-info-row"><span className="ecr-info-label">ECN</span>  <span className="mono">#{ecr.changeNoticeId}</span></div>}
            </div>
          )}

          {/* CHANGE ORDER tab */}
          {activeTab === TABS.ORDER_ITEMS && (
            <div>
              <div className="plm-muted" style={{ marginBottom: 10 }}>Parts revised when this ECR was approved.</div>
              {orderItems.length === 0 ? (
                <div className="plm-muted">No change order items yet. Approve the ECR to auto-generate them.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ecr-order-table">
                    <thead>
                      <tr>
                        <th>Original Part</th>
                        <th>Orig. Rev</th>
                        <th>New Part</th>
                        <th>New Rev</th>
                        <th>Note</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map(item => (
                        <tr key={item.id}>
                          <td className="mono">{item.originalPartNumber || `#${item.originalPartId}`}</td>
                          <td>{item.originalRevision || '—'}</td>
                          <td className="mono">{item.newPartId ? `#${item.newPartId}` : '—'}</td>
                          <td>{item.newRevision || '—'}</td>
                          <td>{item.actionNote || '—'}</td>
                          <td>
                            {item.newPartId && (
                              <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/parts/${item.newPartId}`)}>Open New</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ECN tab */}
          {activeTab === TABS.NOTICE && (
            <div>
              {!notice ? (
                <div className="plm-muted">No Change Notice linked yet. Approve the ECR to auto-generate an ECN.</div>
              ) : (
                <div className="ecr-notice-panel">
                  <div className="ecr-notice-header">
                    <div>
                      <div className="ecr-notice-number">{notice.noticeNumber}</div>
                      <div className="ecr-notice-title">{notice.title}</div>
                    </div>
                    <span className={`ecr-status-pill ecr-status-${(notice.status || '').toLowerCase()}`}>{notice.status}</span>
                  </div>

                  <div className="ecr-notice-body">{notice.summary}</div>

                  <div className="ecr-info-grid" style={{ marginTop: 12 }}>
                    <div className="ecr-info-row"><span className="ecr-info-label">Created By</span>  <span className="mono">{notice.createdBy}</span></div>
                    <div className="ecr-info-row"><span className="ecr-info-label">Created At</span>  <span>{notice.createdAt ? new Date(notice.createdAt).toLocaleString() : '—'}</span></div>
                    {notice.releasedBy && <div className="ecr-info-row"><span className="ecr-info-label">Released By</span><span className="mono">{notice.releasedBy}</span></div>}
                    {notice.releasedAt && <div className="ecr-info-row"><span className="ecr-info-label">Released At</span><span>{new Date(notice.releasedAt).toLocaleString()}</span></div>}
                  </div>

                  {notice.status === 'OPEN' && (
                    <div style={{ marginTop: 14 }}>
                      <Button variant="primary" size="sm" onClick={releaseNotice} disabled={releasingEcn}>
                        📢 {releasingEcn ? 'Releasing…' : 'Release ECN'}
                      </Button>
                      <div className="plm-muted" style={{ marginTop: 6, fontSize: 12 }}>
                        Releasing distributes this notice to all stakeholders.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AUDIT tab */}
          {activeTab === TABS.AUDIT && (
            <div>
              <div className="plm-muted" style={{ marginBottom: 10 }}>Full audit trail for this ECR.</div>
              <AuditPanel entityType="CHANGE_REQUEST" entityId={ecr.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EcrDetailPage;
