import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import LifecycleActions from '../../components/plm/LifecycleActions';
import BomEditor from '../../components/plm/BomEditor';
import BomRiskTree from '../../components/plm/BomRiskTree';
import ImpactNetworkGraph from '../../components/plm/ImpactNetworkGraph';
import AuditPanel from '../../components/plm/AuditPanel';
import AttachmentsPanel from '../../components/plm/AttachmentsPanel';
import AlternatePartsPanel from '../../components/plm/AlternatePartsPanel';
import ManufacturerPartsPanel from '../../components/plm/ManufacturerPartsPanel';
import BaselinePanel from '../../components/plm/BaselinePanel';
import ClassificationPanel from '../../components/plm/ClassificationPanel';
import BomCompareView from '../../components/plm/BomCompareView';
import SavedSearchPanel from '../../components/plm/SavedSearchPanel';
import ReportExport from '../../components/plm/ReportExport';
import ActionToolbar from '../../components/plm/ActionToolbar';
import IbaPanel from '../../components/plm/IbaPanel';
import StateBadge from '../../components/plm/StateBadge';
import InfoPage from '../../components/plm/InfoPage';
import ContextualInsightPanel from '../../components/ai/ContextualInsightPanel';
import ImpactVisualizer from '../../components/plm/ImpactVisualizer';
import { plmApi } from '../../services/plmApi';
import { aiService } from '../../services/aiService';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { AuthContext } from '../../context/AuthContext';

import styles from './PartDetailPage.module.css';

const TAB = {
  STRUCTURE:     'STRUCTURE',
  IMPACT_NETWORK:'IMPACT_NETWORK',
  HISTORY:       'HISTORY',
  RELATED:       'RELATED',
  ALTERNATES:    'ALTERNATES',
  SOURCES:       'SOURCES',
  BASELINES:      'BASELINES',
  BOM_COMPARE:    'BOM_COMPARE',
  CLASSIFICATION: 'CLASSIFICATION',
  SEARCHES:       'SEARCHES',
  IBA:            'IBA',
  ATTACHMENTS:   'ATTACHMENTS',
};

const RELATED_VIEW = {
  VERSIONS:   'VERSIONS',
  WHERE_USED: 'WHERE_USED',
};

const PartDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedContextId } = useContext(PlmWorkspaceContext);
  const auth = useContext(AuthContext);
  const meUsername = auth?.user?.username;
  const meUserId   = auth?.user?.userId;

  /* ── state ─────────────────────────────────────────────────────────────── */
  const [part,             setPart]             = useState(null);
  const [partsInCtx,       setPartsInCtx]       = useState([]);
  const [promotion,        setPromotion]        = useState(null);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError,   setPromotionError]   = useState(null);
  const [whereUsed,        setWhereUsed]        = useState([]);
  const [whereUsedLoading, setWhereUsedLoading] = useState(false);
  const [whereUsedError,   setWhereUsedError]   = useState(null);
  const [whereUsedLoaded,  setWhereUsedLoaded]  = useState(false);
  const [guidance,         setGuidance]         = useState(null);
  const [guidanceLoading,  setGuidanceLoading]  = useState(false);
  const [guidanceError,    setGuidanceError]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [coLoading,  setCoLoading]  = useState(false);
  const [activeTab,  setActiveTab]  = useState(TAB.STRUCTURE);
  const [relatedView, setRelatedView] = useState(RELATED_VIEW.VERSIONS);
  const [edit, setEdit] = useState({ name: '', description: '' });

  /* ── loaders ────────────────────────────────────────────────────────────── */
  const loadPromotion = async (partId) => {
    if (!partId) { setPromotion(null); return; }
    try {
      setPromotionLoading(true); setPromotionError(null);
      const data = await plmApi.getLatestPromotion(partId);
      setPromotion(data || null);
    } catch (e) {
      setPromotion(null);
      setPromotionError(e.response?.data?.message || e.message || 'Failed to load promotion status');
    } finally { setPromotionLoading(false); }
  };

  const loadGuidance = async (partId) => {
    if (!partId) { setGuidance(null); return; }
    try {
      setGuidanceLoading(true); setGuidanceError(null);
      const data = await aiService.getPartGuidance(partId);
      setGuidance(data || null);
    } catch (e) {
      setGuidance(null);
      setGuidanceError(e.response?.data?.message || e.message || 'Failed to load AI guidance');
    } finally { setGuidanceLoading(false); }
  };

  const load = async () => {
    try {
      setLoading(true); setError(null);
      setWhereUsed([]); setWhereUsedError(null);
      setWhereUsedLoaded(false); setWhereUsedLoading(false);
      setRelatedView(RELATED_VIEW.VERSIONS);

      const p = await plmApi.getPart(id);
      setPart(p);
      setEdit({ name: p.name || '', description: p.description || '' });
      await Promise.all([loadPromotion(p.id), loadGuidance(p.id)]);

      const ctxId = p.contextId || selectedContextId;
      if (ctxId) {
        const list = await plmApi.listParts(ctxId);
        setPartsInCtx(list || []);
      } else { setPartsInCtx([]); }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load part');
    } finally { setLoading(false); }
  };

  const loadWhereUsed = async (partId) => {
    if (!partId) return;
    try {
      setWhereUsedLoading(true); setWhereUsedError(null);
      const parents = await plmApi.getWhereUsed(partId);
      setWhereUsed(parents || []); setWhereUsedLoaded(true);
    } catch (e) {
      setWhereUsed([]);
      setWhereUsedError(e.response?.data?.message || e.message || 'Failed to load where used');
      setWhereUsedLoaded(true);
    } finally { setWhereUsedLoading(false); }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [id]); // eslint-disable-line
  useEffect(() => {
    if (!part || activeTab !== TAB.RELATED || relatedView !== RELATED_VIEW.WHERE_USED) return;
    if (whereUsedLoaded || whereUsedLoading) return;
    loadWhereUsed(part.id);
  }, [activeTab, relatedView, part?.id, whereUsedLoaded]); // eslint-disable-line

  /* ── standard actions ───────────────────────────────────────────────────── */
  const save = async () => {
    if (!part) return;
    try {
      setSaving(true); setError(null);
      const updated = await plmApi.updatePart(part.id, { name: edit.name, description: edit.description });
      setPart(updated);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed to update part');
    } finally { setSaving(false); }
  };

  const promote = async (target) => {
    if (!part) return;
    try {
      setSaving(true); setError(null);
      const updated = await plmApi.promotePart(part.id, target);
      setPart(updated); await loadPromotion(part.id);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed to promote');
    } finally { setSaving(false); }
  };

  const revise = async () => {
    if (!part) return;
    try {
      setSaving(true); setError(null);
      const newRev = await plmApi.revisePart(part.id);
      navigate(`/plm/parts/${newRev.id}`);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Failed to revise');
    } finally { setSaving(false); }
  };

  /* ── checkout actions ───────────────────────────────────────────────────── */
  const checkOut = async () => {
    try {
      setCoLoading(true); setError(null);
      const working = await plmApi.checkOutPart(part.id);
      navigate(`/plm/parts/${working.id}`);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Check out failed');
    } finally { setCoLoading(false); }
  };

  const checkIn = async () => {
    try {
      setCoLoading(true); setError(null);
      const committed = await plmApi.checkInPart(part.id, { name: edit.name, description: edit.description });
      setPart(committed);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Check in failed');
    } finally { setCoLoading(false); }
  };

  const undoCheckOut = async () => {
    try {
      setCoLoading(true); setError(null);
      const restored = await plmApi.undoCheckOut(part.id);
      navigate(`/plm/parts/${restored.id}`);
    } catch (e) { setError(e.response?.data?.message || e.message || 'Undo checkout failed');
    } finally { setCoLoading(false); }
  };

  /* ── derived ────────────────────────────────────────────────────────────── */
  const childrenOptions = useMemo(() => {
    if (!part) return [];
    return (partsInCtx || []).filter(p => p.id !== part.id);
  }, [partsInCtx, part]);

  const versions = useMemo(() => {
    if (!part) return [];
    const master = part.masterId || part.id;
    const list = (partsInCtx || []).filter(p =>
      (p.masterId != null && p.masterId === master) || p.id === master
    );
    return list.sort((a, b) => {
      const r = String(b.revision || '').localeCompare(String(a.revision || ''));
      if (r !== 0) return r;
      return (b.iteration || 0) - (a.iteration || 0);
    });
  }, [partsInCtx, part]);

  /* ── guards ─────────────────────────────────────────────────────────────── */
  if (loading)        return <div className={styles.plmMuted}>Loading part…</div>;
  if (error && !part) return <div className={styles.plmError}>{error}</div>;
  if (!part)          return <div className={styles.plmMuted}>Part not found.</div>;

  /* ── helpers ────────────────────────────────────────────────────────────── */
  const checkedOutByMe    = part.checkedOutBy && part.checkedOutBy === meUsername;
  const checkedOutByOther = part.checkedOutBy && part.checkedOutBy !== meUsername;
  const canCheckOut       = !part.checkedOutBy
    && part.lifecycleState !== 'RELEASED'
    && part.lifecycleState !== 'OBSOLETE';
  const versionLabel = `${part.revision}.${part.iteration}`;

  const TabButton = ({ tab, children }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
    >
      {children}
    </button>
  );

  const RelatedNavItem = ({ view, label, count, loading: isLoading }) => {
    const active    = relatedView === view;
    const countText = isLoading ? '…' : (count == null ? '' : String(count));
    return (
      <button
        type="button"
        className={active ? `${styles.relatedNavItem} ${styles.relatedNavItemActive}` : styles.relatedNavItem}
        onClick={() => setRelatedView(view)}
      >
        <span>{label}</span>
        <span className={styles.relatedCount}>{countText}</span>
      </button>
    );
  };

  const StatusPill = ({ value }) => {
    const v = String(value || '').toUpperCase();
    let variant = 'default';
    if (v.includes('APPROVED') || v === 'RELEASED' || v === 'COMPLETED') variant = 'success';
    else if (v.includes('REJECT') || v === 'CANCELLED' || v === 'CRITICAL') variant = 'danger';
    else if (v.includes('PENDING') || v === 'IN_REVIEW') variant = 'warning';

    // Using StateBadge directly or mapping to its classes would be better,
    // but for now let's use the semantic tokens in a robust way.
    return (
      <span className={`wc-state-badge badge--${variant} wc-state-badge--sm`}>
        {v || '-'}
      </span>
    );
  };

  const pr         = promotion?.request;
  const prItems    = promotion?.workItems  || [];
  const prComments = promotion?.comments   || [];

  const openWorkItemInWorklist = (workItemId) => {
    if (!workItemId) return;
    navigate(`/plm/worklist?workItemId=${encodeURIComponent(String(workItemId))}`);
  };

  /* ── InfoPage attribute rows ────────────────────────────────────────────── */
  const infoRows = [
    { label: 'Part Number',   value: part.partNumber,      mono: true  },
    { label: 'Version',       value: versionLabel,         mono: true  },
    { label: 'State',         value: part.lifecycleState               },
    { label: 'Latest',        value: part.isLatest ? 'Yes' : 'No'      },
    { label: 'Checked Out By',value: part.checkedOutBy || '—'          },
    { label: 'Context ID',    value: String(part.contextId || '—'),    mono: true },
    { label: 'Master ID',     value: part.masterId ? String(part.masterId) : '—', mono: true },
    { label: 'Folder',        value: part.folderName || (part.folderId ? String(part.folderId) : '—') },
  ];

  const headerActions = [
    <Button key="refresh" variant="secondary" size="sm" onClick={load}                    disabled={loading || saving}>Refresh</Button>,
    <Button key="back"    variant="secondary" size="sm" onClick={() => navigate('/plm/parts')}>Back</Button>,
  ];

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* ══ Windchill-style Info Page header ══════════════════════════════ */}
      <div className={styles.infoHeader}>
        {/* Row 1: type icon + object identity */}
        <div className={styles.infoHeaderTop}>
          <div className={styles.infoHeaderLeft}>
            <span className={styles.typeIcon}>⚙️</span>
            <div>
              <div className={styles.infoTitle}>
                <span className={styles.partNumber}>{part.partNumber}</span>
                <span className={styles.partName}>{part.name}</span>
                <span className={styles.versionChip}>{versionLabel}</span>
                <StateBadge state={part.lifecycleState} size="md" />
                {!part.isLatest && (
                  <span className={styles.notLatestBadge}>Not Latest</span>
                )}
              </div>
              <div className={styles.infoSubtitle}>
                {part.description || 'No description'}
              </div>
            </div>
          </div>
          <div className={styles.infoHeaderRight}>
            {headerActions}
          </div>
        </div>

        {/* Row 2: checkout banner (only when checked out) */}
        {part.checkedOutBy && (
          <div className={`${styles.checkoutBanner} ${checkedOutByMe ? styles.checkoutBannerMine : styles.checkoutBannerOther}`}>
            {checkedOutByMe
              ? <>🔒 Checked out by <strong>you</strong>. Changes will create a new working copy (iteration {part.iteration}).</>
              : <>🔒 Locked by <strong>{part.checkedOutBy}</strong>. You cannot edit this part until it is checked in.</>
            }
            {checkedOutByMe && (
              <div className={styles.checkoutBannerActions}>
                <button className={styles.checkoutBannerBtn} onClick={checkIn}     disabled={coLoading}>✅ Check In</button>
                <button className={styles.checkoutBannerBtn} onClick={undoCheckOut} disabled={coLoading}>↩ Undo</button>
              </div>
            )}
          </div>
        )}

        {/* Row 3: attribute grid */}
        <div className={styles.attrGrid}>
          {infoRows.map(r => (
            <div key={r.label} className={styles.attrCell}>
              <span className={styles.attrLabel}>{r.label}</span>
              <span className={`${styles.attrValue} ${r.mono ? styles.mono : ''}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Two-column workspace ══════════════════════════════════════════ */}
      <div className={styles.detailGrid} style={{ marginTop: 16 }}>

        {/* ── LEFT: Checkout bar + Edit fields + Lifecycle + Promotion ── */}
        <div className={styles.detailCard}>
          <ContextualInsightPanel
            title="AI change readiness"
            subtitle="Guidance based on lifecycle state, structure visibility, and open control signals."
            insight={guidance}
            loading={guidanceLoading}
            error={guidanceError}
            footer={(
              <>
                <Button variant="secondary" size="sm" onClick={() => loadGuidance(part.id)} disabled={guidanceLoading}>
                  Refresh guidance
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setActiveTab(TAB.RELATED);
                    setRelatedView(RELATED_VIEW.WHERE_USED);
                  }}
                >
                  Review where used
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes')}>
                  Open changes
                </Button>
              </>
            )}
          />

          <div className={styles.cardTitle}>Edit &amp; Actions</div>

          {/* Checkout bar (compact, for non-banner context) */}
          <div className={styles.coBar}>
            {canCheckOut && (
              <Button variant="primary" size="sm" onClick={checkOut} disabled={coLoading || saving}>
                🔒 Check Out
              </Button>
            )}
            {checkedOutByOther && (
              <span className="co-locked-msg">🔒 Locked by <strong>{part.checkedOutBy}</strong></span>
            )}
            {!part.checkedOutBy && (
              <span className="co-version-label">Version: <strong>{versionLabel}</strong></span>
            )}
          </div>

          {/* Editable fields */}
          <div className={styles.formRow}>
            <label>Name</label>
            <input
              className={styles.plmInput}
              value={edit.name}
              onChange={e => setEdit({ ...edit, name: e.target.value })}
              disabled={checkedOutByOther}
            />
          </div>
          <div className={styles.formRow}>
            <label>Description</label>
            <textarea
              className={styles.plmTextarea}
              value={edit.description}
              onChange={e => setEdit({ ...edit, description: e.target.value })}
              disabled={checkedOutByOther}
            />
          </div>

          {/* Lifecycle toolbar */}
          <div className={styles.detailBar}>
            <LifecycleActions
              state={part.lifecycleState}
              onPromote={promote}
              disabled={saving || checkedOutByOther}
            />
            <div className="revise-area">
              <Button
                variant="primary" size="sm"
                onClick={revise}
                disabled={saving || part.lifecycleState !== 'RELEASED'}
              >
                Revise
              </Button>
              <div className="hint">Revise enabled only when RELEASED.</div>
            </div>
          </div>

          <div className={styles.detailSave}>
            <Button variant="secondary" size="sm" onClick={save} disabled={saving || checkedOutByOther}>
              Save
            </Button>
          </div>

          {error && <div className="plm-error" style={{ marginTop: 8 }}>{error}</div>}

          {/* ── Promotion panel ── */}
          <div style={{ marginTop: 14, borderTop: '1px solid #eef2f7', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 800 }}>Promotion Request</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {promotionLoading
                  ? <span className="plm-muted">Loading…</span>
                  : (pr?.status ? <StatusPill value={pr.status} /> : null)}
                <Button variant="secondary" size="sm" onClick={() => loadPromotion(part.id)} disabled={promotionLoading}>
                  Reload
                </Button>
              </div>
            </div>

            {promotionError && <div className="plm-error" style={{ marginTop: 8 }}>{promotionError}</div>}

            {!promotionLoading && !promotionError && !pr && (
              <div className="plm-muted" style={{ marginTop: 8 }}>
                No promotion request found. Use lifecycle buttons above to submit for review.
              </div>
            )}

            {pr && (
              <div style={{ marginTop: 10 }}>
                <div className="plm-muted">
                  Requested by: <span className="mono">{pr.requestedBy || pr.requestedByUserId}</span>
                </div>
                {pr.completedAt && (
                  <div className="plm-muted">
                    Completed: <span className="mono">{String(pr.completedAt)}</span>
                    {' '}by <span className="mono">{pr.completedBy || pr.completedByUserId}</span>
                  </div>
                )}

                <div style={{ overflowX: 'auto', marginTop: 10 }}>
                  <table className="parts-table" style={{ width: '100%' }}>
                    <thead>
                      <tr><th>Approver</th><th>Status</th><th>Due</th><th>Completed</th><th></th></tr>
                    </thead>
                    <tbody>
                      {prItems.map(w => {
                        const isMe = meUserId && String(meUserId) === String(w.assigneeUserId);
                        return (
                          <tr key={w.id}>
                            <td className={styles.mono}>
                              {w.assignee || w.assigneeUserId}
                              {isMe && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 800, color: '#0f4d6d' }}>(You)</span>}
                            </td>
                            <td><StatusPill value={w.status} /></td>
                            <td className="mono">{w.dueAt       ? String(w.dueAt)       : '—'}</td>
                            <td className="mono">{w.completedAt ? String(w.completedAt) : '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <Button variant="secondary" size="sm" onClick={() => openWorkItemInWorklist(w.id)}>Open in Worklist</Button>
                            </td>
                          </tr>
                        );
                      })}
                      {prItems.length === 0 && (
                        <tr><td colSpan={5} className={styles.plmMuted} style={{ padding: 12 }}>No approver work items.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Review Comments</div>
                  {prComments.length === 0 && <div className="plm-muted">No comments yet.</div>}
                  {prComments.map(c => (
                    <div key={c.id} style={{
                      border: '1px solid #e5e7eb', borderRadius: 10,
                      padding: 10, background: '#fff', marginBottom: 8,
                    }}>
                      <div className="plm-muted" style={{ marginBottom: 6 }}>
                        <span className="mono">{c.commentedBy || c.commentedByUserId}</span>
                        {' · '}
                        <span className="mono">{String(c.createdAt)}</span>
                      </div>
                      <div>{c.comment}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Tab workspace ── */}
        <div className={styles.detailCard}>
          <div className="card-title" style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <div>Workspace</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <TabButton tab={TAB.STRUCTURE}>Structure</TabButton>
              <TabButton tab={TAB.IMPACT_NETWORK}>Impact Network</TabButton>
              <TabButton tab={TAB.HISTORY}>History</TabButton>
              <TabButton tab={TAB.RELATED}>Related Objects</TabButton>
              <TabButton tab={TAB.ALTERNATES}>🔄 Alternates</TabButton>
              <TabButton tab={TAB.SOURCES}>🏭 Sources</TabButton>
              <TabButton tab={TAB.BASELINES}>📸 Baselines</TabButton>
              <TabButton tab={TAB.BOM_COMPARE}>🔍 BOM Compare</TabButton>
              <TabButton tab={TAB.CLASSIFICATION}>🏷️ Classification</TabButton>
              <TabButton tab={TAB.SEARCHES}>🔖 Searches</TabButton>
              <TabButton tab={TAB.IBA}>📋 IBA</TabButton>
              <TabButton tab={TAB.ATTACHMENTS}>📎 Attachments</TabButton>
            </div>
          </div>

          {activeTab === TAB.STRUCTURE && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 8 }}>
                BOM structure tree with AI risk overlay &mdash; toggle Risk View to see AI-assessed risk scores per component.
              </div>
              <BomRiskTree partId={part.id} contextId={part.contextId} />
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                  Add / Remove BOM Lines
                </div>
                <BomEditor parentPartId={part.id} candidateChildren={childrenOptions} />
              </div>
            </div>
          )}

          {activeTab === TAB.IMPACT_NETWORK && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 12 }}>
                Interactive network graph showing how a change to this part propagates through assemblies and sub-components.
                Click <strong>Analyze Impact</strong> to run AI risk assessment on all connected parts.
              </div>
              <ImpactNetworkGraph part={part} contextId={part.contextId} />
            </div>
          )}

          {activeTab === TAB.HISTORY && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 8 }}>Audit trail for this exact version.</div>
              <AuditPanel entityType="PART" entityId={part.id} />
            </div>
          )}

          {activeTab === TAB.RELATED && (
            <div className={styles.relatedSplit}>
              <div className={styles.relatedNav}>
                <RelatedNavItem view={RELATED_VIEW.VERSIONS}   label="Versions"   count={(versions || []).length} loading={false} />
                <RelatedNavItem view={RELATED_VIEW.WHERE_USED} label="Where Used" count={whereUsedLoaded ? (whereUsed || []).length : null} loading={whereUsedLoading} />
              </div>
              <div className={styles.relatedPanel}>
                {relatedView === RELATED_VIEW.VERSIONS && (
                  <div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Version History</div>
                      <div className={styles.plmMuted}>All revisions/iterations sharing the same master part.</div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.partsTable} style={{ width: '100%' }}>
                        <thead>
                          <tr><th>Number</th><th>Rev</th><th>Iter</th><th>State</th><th>Latest</th><th>Locked</th><th></th></tr>
                        </thead>
                        <tbody>
                          {(versions || []).map(v => (
                            <tr key={v.id} style={{ background: String(v.id) === String(part.id) ? '#f0f9ff' : undefined }}>
                              <td className="mono">{v.partNumber}</td>
                              <td>{v.revision}</td>
                              <td>{v.iteration}</td>
                              <td><StateBadge state={v.lifecycleState} size="sm" /></td>
                              <td>{v.isLatest ? '✅' : '—'}</td>
                              <td>{v.checkedOutBy ? <span title={v.checkedOutBy}>🔒</span> : '—'}</td>
                              <td style={{ textAlign: 'right' }}>
                                <Button
                                  variant="secondary" size="sm"
                                  onClick={() => navigate(`/plm/parts/${v.id}`)}
                                  disabled={String(v.id) === String(part.id)}
                                >
                                  {String(v.id) === String(part.id) ? 'Current' : 'Open'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {(versions || []).length === 0 && (
                            <tr><td colSpan={7} className="plm-muted" style={{ padding: 12 }}>No related versions found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {relatedView === RELATED_VIEW.WHERE_USED && (
                  <div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Where Used</div>
                      <div className={styles.plmMuted}>Parent assemblies that reference this part via BOM lines.</div>
                    </div>
                    {whereUsedLoading && <div className={styles.plmMuted}>Loading where used…</div>}
                    {whereUsedError   && <div className={styles.plmError}>{whereUsedError}</div>}
                    {!whereUsedLoading && !whereUsedError && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {whereUsed && whereUsed.length > 0 && (
                          <div style={{ width: '100%', height: '500px', border: '1px solid var(--wc-border)', borderRadius: 'var(--wc-radius-md)' }}>
                             <ImpactVisualizer part={part} whereUsed={whereUsed} />
                          </div>
                        )}
                        <div style={{ overflowX: 'auto' }}>
                          <table className="parts-table" style={{ width: '100%' }}>
                            <thead><tr><th>Number</th><th>Name</th><th>State</th><th></th></tr></thead>
                            <tbody>
                              {(whereUsed || []).map(p => (
                                <tr key={p.id}>
                                  <td className="mono">{p.partNumber}</td>
                                  <td>{p.name}</td>
                                  <td><StateBadge state={p.lifecycleState} size="sm" /></td>
                                  <td style={{ textAlign: 'right' }}>
                                    <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/parts/${p.id}`)}>Open</Button>
                                  </td>
                                </tr>
                              ))}
                              {(whereUsed || []).length === 0 && (
                                <tr><td colSpan={4} className="plm-muted" style={{ padding: 12 }}>Not used in any parent assembly.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === TAB.ALTERNATES && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 12 }}>
                Alternate / substitute parts that can replace this part in assemblies.
              </div>
              <AlternatePartsPanel partId={part.id} contextId={part.contextId} />
            </div>
          )}

          {activeTab === TAB.SOURCES && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 12 }}>
                Approved Manufacturer List (AML) &mdash; qualified supply sources for this part.
              </div>
              <ManufacturerPartsPanel partId={part.id} />
            </div>
          )}

          {activeTab === TAB.BASELINES && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 12 }}>Point-in-time BOM snapshots &mdash; capture and freeze product configurations.</div>
              <BaselinePanel partId={part.id} contextId={part.contextId} />
            </div>
          )}

          {activeTab === TAB.BOM_COMPARE && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 12 }}>Side-by-side BOM diff &mdash; compare two parts or revisions to see added, removed, and modified lines.</div>
              <BomCompareView partId={part.id} contextId={part.contextId} />
            </div>
          )}

          {activeTab === TAB.CLASSIFICATION && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 12 }}>Part classification &mdash; categorize with typed attributes in a hierarchical tree.</div>
              <ClassificationPanel partId={part.id} />
            </div>
          )}

          {activeTab === TAB.SEARCHES && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 12 }}>Saved searches &mdash; named queries with filters. Also export data from this page.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <SavedSearchPanel entityType="PART" />
                <div><h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Export</h4><ReportExport partId={part.id} contextId={part.contextId} /></div>
              </div>
            </div>
          )}

          {activeTab === TAB.IBA && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 12 }}>Inter-Business Attributes (IBA) &mdash; custom soft-type attributes for {part.partNumber}.</div>
              <IbaPanel entityId={part.id} targetType="PART" />
            </div>
          )}

          {activeTab === TAB.ATTACHMENTS && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 12 }}>Files and documents attached to this part.</div>
              <AttachmentsPanel entityType="PART" entityId={part.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartDetailPage;
