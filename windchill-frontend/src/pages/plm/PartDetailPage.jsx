import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import LifecycleActions from '../../components/plm/LifecycleActions';
import BomEditor from '../../components/plm/BomEditor';
import AuditPanel from '../../components/plm/AuditPanel';
import AttachmentsPanel from '../../components/plm/AttachmentsPanel';
import InfoPage, { InfoBadge } from '../../components/plm/InfoPage';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { AuthContext } from '../../context/AuthContext';
import './PartDetailPage.css';

const TAB = {
  STRUCTURE:   'STRUCTURE',
  HISTORY:     'HISTORY',
  RELATED:     'RELATED',
  ATTACHMENTS: 'ATTACHMENTS',
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

  const load = async () => {
    try {
      setLoading(true); setError(null);
      setWhereUsed([]); setWhereUsedError(null);
      setWhereUsedLoaded(false); setWhereUsedLoading(false);
      setRelatedView(RELATED_VIEW.VERSIONS);

      const p = await plmApi.getPart(id);
      setPart(p);
      setEdit({ name: p.name || '', description: p.description || '' });
      await loadPromotion(p.id);

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

  /* ── derived data ───────────────────────────────────────────────────────── */
  const childrenOptions = useMemo(() => {
    if (!part) return [];
    return (partsInCtx || []).filter(p => p.id !== part.id);
  }, [partsInCtx, part]);

  const versions = useMemo(() => {
    if (!part) return [];
    const effectiveMasterId = part.masterId || part.id;
    const list = (partsInCtx || []).filter(p =>
      (p.masterId != null && p.masterId === effectiveMasterId) || p.id === effectiveMasterId
    );
    return list.sort((a, b) => {
      const r = String(b.revision || '').localeCompare(String(a.revision || ''));
      if (r !== 0) return r;
      return (b.iteration || 0) - (a.iteration || 0);
    });
  }, [partsInCtx, part]);

  /* ── render guards ──────────────────────────────────────────────────────── */
  if (loading)        return <div className="plm-muted">Loading part…</div>;
  if (error && !part) return <div className="plm-error">{error}</div>;
  if (!part)          return <div className="plm-muted">Part not found.</div>;

  /* ── helpers ────────────────────────────────────────────────────────────── */
  const checkedOutByMe    = part.checkedOutBy && part.checkedOutBy === meUsername;
  const checkedOutByOther = part.checkedOutBy && part.checkedOutBy !== meUsername;
  const canCheckOut       = !part.checkedOutBy
    && part.lifecycleState !== 'RELEASED'
    && part.lifecycleState !== 'OBSOLETE';
  const versionLabel = `${part.revision}.${part.iteration}`;

  /* ── sub-components ─────────────────────────────────────────────────────── */
  const TabButton = ({ tab, children }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '6px 10px', borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: activeTab === tab ? '#0f4d6d' : '#fff',
        color:      activeTab === tab ? '#fff'    : '#111827',
        cursor: 'pointer', fontWeight: 600,
      }}
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
        className={active ? 'related-nav-item related-nav-item-active' : 'related-nav-item'}
        onClick={() => setRelatedView(view)}
      >
        <span>{label}</span>
        <span className="related-count">{countText}</span>
      </button>
    );
  };

  const StatusPill = ({ value }) => {
    const v  = String(value || '').toUpperCase();
    const bg =
      v.includes('APPROVED') || v === 'RELEASED' ? '#16a34a' :
      v.includes('REJECT')                        ? '#dc2626' : '#0f4d6d';
    return (
      <span style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: 999,
        color: '#fff', background: bg, fontWeight: 700, fontSize: 12,
      }}>{v || '-'}</span>
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
    <div>
      {/* ── InfoPage header: type label + title + attr grid ── */}
      <InfoPage
        title="Part"
        subtitle={`${part.partNumber} — ${part.name}`}
        badge={{ label: part.lifecycleState, variant: part.lifecycleState }}
        actions={headerActions}
        rows={infoRows}
      />

      {/* ── Two-column workspace grid ── */}
      <div className="detail-grid" style={{ marginTop: 16 }}>

        {/* ── LEFT: Checkout bar + Edit fields + Lifecycle + Promotion ── */}
        <div className="detail-card">
          <div className="card-title">Edit &amp; Actions</div>

          {/* Checkout action bar */}
          <div className="co-bar">
            {canCheckOut && (
              <Button variant="primary" size="sm" onClick={checkOut} disabled={coLoading || saving}>
                🔒 Check Out
              </Button>
            )}
            {checkedOutByMe && (
              <>
                <Button variant="primary"    size="sm" onClick={checkIn}     disabled={coLoading || saving}>✅ Check In</Button>
                <Button variant="secondary"  size="sm" onClick={undoCheckOut} disabled={coLoading || saving}>↩ Undo</Button>
              </>
            )}
            {checkedOutByOther && (
              <span className="co-locked-msg">🔒 Locked by <strong>{part.checkedOutBy}</strong></span>
            )}
            <span className="co-version-label">Version: <strong>{versionLabel}</strong></span>
          </div>

          {/* Editable fields */}
          <div className="form-row">
            <label>Name</label>
            <input
              className="plm-input"
              value={edit.name}
              onChange={e => setEdit({ ...edit, name: e.target.value })}
              disabled={checkedOutByOther}
            />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea
              className="plm-textarea"
              value={edit.description}
              onChange={e => setEdit({ ...edit, description: e.target.value })}
              disabled={checkedOutByOther}
            />
          </div>

          {/* Lifecycle toolbar */}
          <div className="detail-bar">
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

          <div className="detail-save">
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

                {/* Approver table */}
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
                            <td className="mono">
                              {w.assignee || w.assigneeUserId}
                              {isMe && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 800, color: '#0f4d6d' }}>(You)</span>}
                            </td>
                            <td><StatusPill value={w.status} /></td>
                            <td className="mono">{w.dueAt       ? String(w.dueAt)       : '—'}</td>
                            <td className="mono">{w.completedAt ? String(w.completedAt) : '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <Button variant="secondary" size="sm" onClick={() => openWorkItemInWorklist(w.id)}>
                                Open in Worklist
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {prItems.length === 0 && (
                        <tr><td colSpan={5} className="plm-muted" style={{ padding: 12 }}>No approver work items.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Review comments */}
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
        <div className="detail-card">
          <div className="card-title" style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <div>Workspace</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <TabButton tab={TAB.STRUCTURE}>Structure</TabButton>
              <TabButton tab={TAB.HISTORY}>History</TabButton>
              <TabButton tab={TAB.RELATED}>Related Objects</TabButton>
              <TabButton tab={TAB.ATTACHMENTS}>📎 Attachments</TabButton>
            </div>
          </div>

          {/* Structure (BOM) */}
          {activeTab === TAB.STRUCTURE && (
            <div>
              <div className="plm-muted" style={{ marginBottom: 8 }}>BOM structure editor (parent → child lines).</div>
              <BomEditor parentPartId={part.id} candidateChildren={childrenOptions} />
            </div>
          )}

          {/* History (Audit) */}
          {activeTab === TAB.HISTORY && (
            <div>
              <div className="plm-muted" style={{ marginBottom: 8 }}>Audit trail for this exact version.</div>
              <AuditPanel entityType="PART" entityId={part.id} />
            </div>
          )}

          {/* Related Objects */}
          {activeTab === TAB.RELATED && (
            <div className="related-split">
              <div className="related-nav">
                <RelatedNavItem view={RELATED_VIEW.VERSIONS}   label="Versions"   count={(versions || []).length} loading={false} />
                <RelatedNavItem view={RELATED_VIEW.WHERE_USED} label="Where Used" count={whereUsedLoaded ? (whereUsed || []).length : null} loading={whereUsedLoading} />
              </div>
              <div className="related-panel">

                {relatedView === RELATED_VIEW.VERSIONS && (
                  <div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Version History</div>
                      <div className="plm-muted">All revisions/iterations sharing the same master part.</div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="parts-table" style={{ width: '100%' }}>
                        <thead>
                          <tr><th>Number</th><th>Rev</th><th>Iter</th><th>State</th><th>Latest</th><th>Locked</th><th></th></tr>
                        </thead>
                        <tbody>
                          {(versions || []).map(v => (
                            <tr key={v.id} style={{ background: String(v.id) === String(part.id) ? '#f0f9ff' : undefined }}>
                              <td className="mono">{v.partNumber}</td>
                              <td>{v.revision}</td>
                              <td>{v.iteration}</td>
                              <td><span className={`pill pill-${(v.lifecycleState || '').toLowerCase()}`}>{v.lifecycleState}</span></td>
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
                      <div className="plm-muted">Parent assemblies that reference this part via BOM lines.</div>
                    </div>
                    {whereUsedLoading && <div className="plm-muted">Loading where used…</div>}
                    {whereUsedError   && <div className="plm-error">{whereUsedError}</div>}
                    {!whereUsedLoading && !whereUsedError && (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="parts-table" style={{ width: '100%' }}>
                          <thead><tr><th>Number</th><th>Name</th><th>State</th><th></th></tr></thead>
                          <tbody>
                            {(whereUsed || []).map(p => (
                              <tr key={p.id}>
                                <td className="mono">{p.partNumber}</td>
                                <td>{p.name}</td>
                                <td><span className={`pill pill-${(p.lifecycleState || '').toLowerCase()}`}>{p.lifecycleState}</span></td>
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
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {activeTab === TAB.ATTACHMENTS && (
            <div>
              <div className="plm-muted" style={{ marginBottom: 12 }}>Files and documents attached to this part.</div>
              <AttachmentsPanel entityType="PART" entityId={part.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartDetailPage;
