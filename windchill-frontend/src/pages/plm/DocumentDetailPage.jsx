import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import StateBadge from '../../components/plm/StateBadge';
import LifecycleStateflow from '../../components/plm/LifecycleStateflow';
import { documentApi } from '../../services/documentApi';
import { plmApi } from '../../services/plmApi';
import AttachmentsPanel from '../../components/plm/AttachmentsPanel';
import styles from './DocumentDetailPage.module.css';

const TAB = { DETAILS: 'DETAILS', RELATED: 'RELATED', ATTACHMENTS: 'ATTACHMENTS', HISTORY: 'HISTORY' };

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB.DETAILS);
  const [acting, setActing] = useState(null);

  // related parts (RELATED tab)
  const [relatedParts, setRelatedParts] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);

  // audit history (HISTORY tab)
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await documentApi.get(id);
      setDoc(data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (activeTab === TAB.RELATED) {
      setPartsLoading(true);
      documentApi.byDoc(id)
        .then(data => setRelatedParts(Array.isArray(data) ? data : []))
        .catch(() => setRelatedParts([]))
        .finally(() => setPartsLoading(false));
    }
    if (activeTab === TAB.HISTORY) {
      setAuditLoading(true);
      plmApi.getAudit('DOCUMENT', Number(id))
        .then(data => setAuditLogs(Array.isArray(data) ? data : []))
        .catch(() => setAuditLogs([]))
        .finally(() => setAuditLoading(false));
    }
  }, [activeTab, id]);

  const handleCheckOut = async () => {
    setActing('checkout');
    try {
      await documentApi.checkOut(id);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally { setActing(null); }
  };

  const handleCheckIn = async () => {
    setActing('checkin');
    try {
      await documentApi.checkIn(id);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally { setActing(null); }
  };

  if (loading) return <div className={styles.docLoading}>Accessing document repository…</div>;
  if (error) return <div className={styles.docError}>{error}</div>;
  if (!doc) return <div className={styles.docLoading}>Document not found.</div>;

  const isCheckedOut = !!doc.checkedOutBy;
  const currentUser = localStorage.getItem('username') || '';
  const isMyCheckout = doc.checkedOutBy === currentUser;

  const TabBtn = ({ tab, children }) => (
    <button
      className={activeTab === tab ? `${styles.docTab} ${styles.docTabActive}` : styles.docTab}
      onClick={() => setActiveTab(tab)}
    >
      {children}
    </button>
  );

  return (
    <div className={styles.docPage}>
      <header className={styles.docHead}>
        <div>
          <div className={styles.docKicker}>Document Detail</div>
          <div className={styles.docTitleRow}>
            <span className={styles.docNumber}>{doc.docNumber || '—'}</span>
            <span className={styles.docVersion}>{doc.versionLabel || `${doc.revision || 'A'}.${doc.iteration || 1}`}</span>
            <StateBadge state={doc.lifecycleState} />
            {isCheckedOut && (
              <span className={styles.checkoutBadge}>
                Checked out by {doc.checkedOutBy}
              </span>
            )}
          </div>
          <div className={styles.docTitle}>{doc.name}</div>
          <LifecycleStateflow entityType="document" currentState={doc.lifecycleState} />
        </div>

        <div className={styles.docActions}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/documents')}>Back</Button>
          {!isCheckedOut && (
            <Button variant="primary" size="sm" onClick={handleCheckOut} disabled={!!acting}>
              {acting === 'checkout' ? 'Checking out…' : 'Check Out'}
            </Button>
          )}
          {isCheckedOut && isMyCheckout && (
            <Button variant="secondary" size="sm" onClick={handleCheckIn} disabled={!!acting}>
              {acting === 'checkin' ? 'Checking in…' : 'Check In'}
            </Button>
          )}
        </div>
      </header>

      <div className={styles.docBody}>
        <div className={styles.docTabs}>
          <TabBtn tab={TAB.DETAILS}>Properties</TabBtn>
          <TabBtn tab={TAB.RELATED}>Related Parts</TabBtn>
          <TabBtn tab={TAB.ATTACHMENTS}>Attachments</TabBtn>
          <TabBtn tab={TAB.HISTORY}>History</TabBtn>
        </div>

        {activeTab === TAB.DETAILS && (
          <div className={styles.docGrid}>
            <div className={styles.docCard}>
              <div className={styles.docCardTitle}>General Attributes</div>
              <div className={styles.docKv}>
                <div className={styles.docK}>Type</div>
                <div className={styles.docV}>{doc.docType}</div>
                <div className={styles.docK}>State</div>
                <div className={styles.docV}>{doc.lifecycleState}</div>
                <div className={styles.docK}>Latest</div>
                <div className={styles.docV}>{doc.isLatest ? 'Yes' : 'No'}</div>
                <div className={styles.docK}>Created By</div>
                <div className={styles.docVMono}>{doc.createdBy || '—'}</div>
                <div className={styles.docK}>Created At</div>
                <div className={styles.docV}>{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '-'}</div>
                <div className={styles.docK}>Updated By</div>
                <div className={styles.docVMono}>{doc.updatedBy || '—'}</div>
              </div>
            </div>

            <div className={styles.docCard}>
              <div className={styles.docCardTitle}>Description</div>
              <p className={styles.docDesc}>{doc.description || <span className={styles.muted}>No description available.</span>}</p>
            </div>

            <div className={`${styles.docCard} ${styles.docCardFull}`}>
              <div className={styles.docCardTitle}>Context</div>
              <div className={styles.docKv}>
                <div className={styles.docK}>Context ID</div>
                <div className={styles.docV}>{doc.contextId}</div>
                <div className={styles.docK}>Folder ID</div>
                <div className={styles.docV}>{doc.folderId || '—'}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === TAB.RELATED && (
          <div className={styles.docCard}>
            <div className={styles.docCardTitle}>Related Parts</div>
            {partsLoading ? (
              <p className={styles.muted}>Loading related parts…</p>
            ) : relatedParts.length === 0 ? (
              <p className={styles.muted}>No parts linked to this document.</p>
            ) : (
              <table className={styles.relTable}>
                <thead><tr><th>Part Number</th><th>Name</th><th>State</th></tr></thead>
                <tbody>
                  {relatedParts.map(p => (
                    <tr key={p.id}>
                      <td>{p.partNumber}</td>
                      <td>{p.name}</td>
                      <td><StateBadge state={p.lifecycleState} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === TAB.ATTACHMENTS && (
          <div className={styles.docCard}>
            <div className={styles.docCardTitle}>Attachments</div>
            <AttachmentsPanel entityType="DOCUMENT" entityId={Number(id)} />
          </div>
        )}

        {activeTab === TAB.HISTORY && (
          <div className={styles.docCard}>
            <div className={styles.docCardTitle}>Revision History</div>
            {auditLoading ? (
              <p className={styles.muted}>Loading history…</p>
            ) : auditLogs.length === 0 ? (
              <p className={styles.muted}>No audit history recorded.</p>
            ) : (
              <table className={styles.relTable}>
                <thead><tr><th>Action</th><th>By</th><th>When</th></tr></thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={i}>
                      <td>{log.action}</td>
                      <td className={styles.docVMono}>{log.actor || '—'}</td>
                      <td className={styles.muted}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetailPage;
