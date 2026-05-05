import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import StateBadge from '../../components/plm/StateBadge';
import { plmApi } from '../../services/plmApi';
import styles from './DocumentDetailPage.module.css';

const TAB = {
  DETAILS: 'DETAILS',
  CONTENT: 'CONTENT',
  HISTORY: 'HISTORY',
};

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB.DETAILS);

  const load = async () => {
    setLoading(true);
    try {
      const data = await plmApi.getDocumentDetails(id);
      setDoc(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className={styles.docLoading}>Accessing document repository…</div>;
  if (error) return <div className={styles.docError}>{error}</div>;
  if (!doc) return <div className={styles.docLoading}>Document not found.</div>;

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
            <span className={styles.docNumber}>{doc.documentNumber}</span>
            <span className={styles.docVersion}>{doc.version || 'A'}.{doc.iteration || '1'}</span>
            <StateBadge state={doc.lifecycleState} />
          </div>
          <div className={styles.docTitle}>{doc.title}</div>
        </div>

        <div className={styles.docActions}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/documents')}>Back</Button>
          <Button variant="primary" size="sm" onClick={() => {}}>Check Out</Button>
          <Button variant="secondary" size="sm" onClick={() => {}}>Revise</Button>
        </div>
      </header>

      <div className={styles.docBody}>
        <div className={styles.docTabs}>
          <TabBtn tab={TAB.DETAILS}>Properties</TabBtn>
          <TabBtn tab={TAB.CONTENT}>Content</TabBtn>
          <TabBtn tab={TAB.HISTORY}>History</TabBtn>
        </div>

        {activeTab === TAB.DETAILS && (
          <div className={styles.docGrid}>
            <div className={styles.docCard}>
              <div className={styles.docCardTitle}>General Attributes</div>
              <div className={styles.docKv}>
                <div className={styles.docK}>Type</div>
                <div className={styles.docV}>{doc.type}</div>
                <div className={styles.docK}>State</div>
                <div className={styles.docV}>{doc.lifecycleState}</div>
                <div className={styles.docK}>Created By</div>
                <div className={styles.docVMono}>{doc.createdBy}</div>
                <div className={styles.docK}>Created At</div>
                <div className={styles.docV}>{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '-'}</div>
              </div>
            </div>

            <div className={styles.docCard}>
              <div className={styles.docCardTitle}>Description</div>
              <p className={styles.docDesc}>{doc.description || <span className={styles.muted}>No description available.</span>}</p>
            </div>

            <div className={`${styles.docCard} ${styles.docCardFull}`}>
              <div className={styles.docCardTitle}>Security & Context</div>
              <div className={styles.docKv}>
                <div className={styles.docK}>Context</div>
                <div className={styles.docV}>{doc.contextType} (ID: {doc.contextId})</div>
                <div className={styles.docK}>Access Level</div>
                <div className={styles.docV} style={{ color: 'var(--wc-success-text)', fontWeight: 800 }}>RESTRICTED</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === TAB.CONTENT && (
          <div className={styles.docCard}>
            <div className={styles.docCardTitle}>Primary Content</div>
            <div className={styles.docFiles}>
              <div className={styles.docFileItem}>
                <div>
                  <div style={{ fontWeight: 700 }}>{doc.documentNumber}_v{doc.version}.pdf</div>
                  <div className={styles.muted}>4.2 MB • Portable Document Format</div>
                </div>
                <Button variant="secondary" size="sm">Download</Button>
              </div>
              <div className={styles.docFileItem}>
                <div>
                  <div style={{ fontWeight: 700 }}>Source_Archive.zip</div>
                  <div className={styles.muted}>12.8 MB • Compressed Archive</div>
                </div>
                <Button variant="secondary" size="sm">Download</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === TAB.HISTORY && (
          <div className={styles.docCard}>
            <div className={styles.docCardTitle}>Revision History</div>
            <p className={styles.muted}>Loading history records…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetailPage;
