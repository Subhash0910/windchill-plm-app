import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import StateBadge from '../../components/plm/StateBadge';
import LifecycleStateflow from '../../components/plm/LifecycleStateflow';
import AttachmentsPanel from '../../components/plm/AttachmentsPanel';
import { plmApi } from '../../services/plmApi';
import styles from './EcoDetailPage.module.css'; // reuse ECO styles — same visual pattern

const PROMOTE_MAP   = { OPEN: 'RELEASED', RELEASED: 'OBSOLETE' };
const PROMOTE_LABEL = { OPEN: 'Release Notice', RELEASED: 'Obsolete' };

const EcnDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [ecn,       setEcn]       = useState(null);
  const [ecr,       setEcr]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [form,      setForm]      = useState({ title: '', summary: '' });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [activeTab, setActiveTab] = useState('DETAILS');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await plmApi.getEcn(id);
      setEcn(data);
      setForm({ title: data.title || '', summary: data.summary || '' });
      if (data?.changeRequestId) {
        try { setEcr(await plmApi.getEcr(data.changeRequestId)); } catch { setEcr(null); }
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load ECN');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handlePromote = async () => {
    const next = PROMOTE_MAP[ecn.status];
    if (!next) return;
    setPromoting(true);
    try {
      await plmApi.promoteEcn(id, next);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Promote failed');
    } finally { setPromoting(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await plmApi.updateEcn(id, form);
      setEditing(false);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className={styles.ecoLoading}>Loading Engineering Change Notice…</div>;
  if (error && !ecn) return <div className={styles.ecoError}>{error}</div>;
  if (!ecn) return <div className={styles.ecoLoading}>ECN not found.</div>;

  const nextState   = PROMOTE_MAP[ecn.status];
  const promoteLabel = PROMOTE_LABEL[ecn.status];

  const TabBtn = ({ tab, children }) => (
    <button
      type="button"
      className={activeTab === tab ? `${styles.ecoTab} ${styles.ecoTabActive}` : styles.ecoTab}
      onClick={() => setActiveTab(tab)}
    >{children}</button>
  );

  return (
    <div className={styles.ecoPage}>
      <div className={styles.ecoHead}>
        <div>
          <div className={styles.ecoKicker}>Engineering Change Notice</div>
          <div className={styles.ecoNumber}>
            {ecn.noticeNumber}
            <StateBadge state={ecn.status} />
          </div>
          <div className={styles.ecoSub}>{ecn.title}</div>
          <LifecycleStateflow entityType="ecn" currentState={ecn.status} />
        </div>

        <div className={styles.ecoActions}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes')}>Back</Button>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading || promoting}>Refresh</Button>
          {ecn.status === 'OPEN' && !editing && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          )}
          {nextState && (
            <Button variant="primary" size="sm" onClick={handlePromote} disabled={promoting}>
              {promoting ? 'Updating…' : promoteLabel}
            </Button>
          )}
        </div>
      </div>

      <div className={styles.ecoBody}>
        <div className={styles.ecoTabs}>
          <TabBtn tab="DETAILS">Details</TabBtn>
          <TabBtn tab="ATTACHMENTS">Attachments</TabBtn>
        </div>

        {activeTab === 'DETAILS' && (
          <div className={styles.ecoGrid}>
            <div className={styles.ecoCard}>
              <div className={styles.ecoCardTitle}>Notice Information</div>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ fontSize: 12, color: '#64748b' }}>Title
                    <input
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </label>
                  <label style={{ fontSize: 12, color: '#64748b' }}>Summary
                    <textarea
                      rows={4}
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, resize: 'vertical' }}
                      value={form.summary}
                      onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className={styles.ecoKv}>
                  <div className={styles.ecoK}>Notice Number</div>
                  <div className={`${styles.ecoV} mono`}>{ecn.noticeNumber}</div>
                  <div className={styles.ecoK}>Status</div>
                  <div className={styles.ecoV}><StateBadge state={ecn.status} /></div>
                  <div className={styles.ecoK}>Created By</div>
                  <div className={`${styles.ecoV} mono`}>{ecn.createdBy || '—'}</div>
                  <div className={styles.ecoK}>Created At</div>
                  <div className={styles.ecoV}>{ecn.createdAt ? new Date(ecn.createdAt).toLocaleString() : '—'}</div>
                  {ecn.releasedBy && <>
                    <div className={styles.ecoK}>Released By</div>
                    <div className={`${styles.ecoV} mono`}>{ecn.releasedBy}</div>
                    <div className={styles.ecoK}>Released At</div>
                    <div className={styles.ecoV}>{ecn.releasedAt ? new Date(ecn.releasedAt).toLocaleString() : '—'}</div>
                  </>}
                </div>
              )}
            </div>

            <div className={styles.ecoCard}>
              <div className={styles.ecoCardTitle}>Summary</div>
              <p className={styles.ecoText}>{ecn.summary || <span className={styles.ecoMuted}>No summary provided.</span>}</p>
            </div>

            {ecr && (
              <div className={`${styles.ecoCard} ${styles.ecoCardFull}`}>
                <div className={styles.ecoCardTitle}>Originating Change Request</div>
                <div className={styles.ecoLinkedEcr}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{ecr.changeNumber || `ECR-${String(ecr.id).padStart(6, '0')}`}</div>
                    <div className={styles.ecoMuted}>{ecr.title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <StateBadge state={ecr.status ?? ecr.state} size="sm" />
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/changes/ecr/${ecr.id}`)}>View ECR</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ATTACHMENTS' && (
          <div className={styles.ecoCard}>
            <div className={styles.ecoCardTitle}>Attachments</div>
            <AttachmentsPanel entityType="ECN" entityId={Number(id)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EcnDetailPage;
