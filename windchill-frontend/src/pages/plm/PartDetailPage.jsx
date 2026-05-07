import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import LifecycleActions from '../../components/plm/LifecycleActions';
import BomEditor from '../../components/plm/BomEditor';
import BomTreeView from '../../components/plm/BomTreeView';
import AuditPanel from '../../components/plm/AuditPanel';
import AttachmentsPanel from '../../components/plm/AttachmentsPanel';
import StateBadge from '../../components/plm/StateBadge';
import LifecycleStateflow from '../../components/plm/LifecycleStateflow';
import ContextualInsightPanel from '../../components/ai/ContextualInsightPanel';
import ImpactPreview from '../../components/ai/ImpactPreview';
import ImpactVisualizer from '../../components/plm/ImpactVisualizer';
import { plmApi } from '../../services/plmApi';
import { aiService } from '../../services/aiService';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { AuthContext } from '../../context/AuthContext';

import styles from './PartDetailPage.module.css';

const TAB = {
  STRUCTURE:   'STRUCTURE',
  IBA:         'IBA',
  SUBSTITUTES: 'SUBSTITUTES',
  RELATED:     'RELATED',
  ATTACHMENTS: 'ATTACHMENTS',
  HISTORY:     'HISTORY',
};

const RELATED_VIEW = {
  VERSIONS:   'VERSIONS',
  WHERE_USED: 'WHERE_USED',
};

/* ── IBA Panel ─────────────────────────────────────────────────────────── */
const IBAPanel = ({ partId }) => {
  const [attrs,   setAttrs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({ attributeName: '', attributeValue: '', attributeType: 'STRING', unit: '', description: '' });
  const [saving,  setSaving]  = useState(false);
  const [editing, setEditing] = useState(null); // id of attr being edited inline

  const load = () => {
    setLoading(true);
    plmApi.listIbaAttributes(partId)
      .then(data => setAttrs(data || []))
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [partId]); // eslint-disable-line

  const handleAdd = async () => {
    if (!form.attributeName.trim()) return;
    setSaving(true);
    try {
      await plmApi.createIbaAttribute(partId, form);
      setForm({ attributeName: '', attributeValue: '', attributeType: 'STRING', unit: '', description: '' });
      setAdding(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await plmApi.deleteIbaAttribute(partId, id);
      load();
    } catch (e) { setError(e.response?.data?.message || e.message); }
  };

  const handleUpdate = async (attr, newValue) => {
    try {
      await plmApi.updateIbaAttribute(partId, attr.id, { attributeValue: newValue });
      setEditing(null);
      load();
    } catch (e) { setError(e.response?.data?.message || e.message); }
  };

  const TYPE_OPTS = ['STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'DATE', 'URL'];

  if (loading) return <div className={styles.plmMuted}>Loading IBA attributes…</div>;

  return (
    <div>
      <div className={styles.ibaHeader}>
        <div>
          <div className={styles.ibaTitle}>Instance-Based Attributes</div>
          <div className={styles.plmMuted}>Soft attributes stored per part version — Windchill IBA pattern</div>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setAdding(a => !a); setError(null); }}>
          {adding ? 'Cancel' : '+ Add Attribute'}
        </Button>
      </div>

      {error && <div className={styles.plmError} style={{ marginTop: 8 }}>{error}</div>}

      {adding && (
        <div className={styles.ibaAddForm}>
          <div className={styles.ibaFormRow}>
            <input
              className={styles.plmInput}
              placeholder="Attribute name *"
              value={form.attributeName}
              onChange={e => setForm({ ...form, attributeName: e.target.value })}
            />
            <select
              className={styles.plmSelect}
              value={form.attributeType}
              onChange={e => setForm({ ...form, attributeType: e.target.value })}
            >
              {TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className={styles.ibaFormRow}>
            <input
              className={styles.plmInput}
              placeholder="Value"
              value={form.attributeValue}
              onChange={e => setForm({ ...form, attributeValue: e.target.value })}
            />
            <input
              className={styles.plmInput}
              placeholder="Unit (e.g. mm, kg)"
              value={form.unit}
              onChange={e => setForm({ ...form, unit: e.target.value })}
            />
          </div>
          <input
            className={styles.plmInput}
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={saving || !form.attributeName.trim()}>
              {saving ? 'Saving…' : 'Save Attribute'}
            </Button>
          </div>
        </div>
      )}

      {attrs.length === 0 && !adding && (
        <div className={styles.ibaEmpty}>
          <div className={styles.ibaEmptyIcon}>📋</div>
          <div>No IBA attributes defined for this part version.</div>
          <div className={styles.plmMuted}>Instance-Based Attributes (IBA) store Windchill soft attribute values per object instance.</div>
        </div>
      )}

      {attrs.length > 0 && (
        <div className={styles.ibaTable}>
          <div className={styles.ibaTableHeader}>
            <span>Attribute</span>
            <span>Type</span>
            <span>Value</span>
            <span>Unit</span>
            <span></span>
          </div>
          {attrs.map(attr => (
            <div key={attr.id} className={styles.ibaTableRow}>
              <span className={styles.ibaAttrName}>{attr.attributeName}</span>
              <span className={styles.ibaTypeBadge} data-type={attr.attributeType}>{attr.attributeType}</span>
              <span className={styles.ibaAttrValue}>
                {editing === attr.id ? (
                  <IBAInlineEdit
                    initial={attr.attributeValue}
                    onSave={val => handleUpdate(attr, val)}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <button className={styles.ibaValueBtn} onClick={() => setEditing(attr.id)}>
                    {attr.attributeValue || <span className={styles.plmMuted}>—</span>}
                  </button>
                )}
              </span>
              <span className={styles.plmMuted}>{attr.unit || '—'}</span>
              <span>
                <button className={styles.ibaDeleteBtn} onClick={() => handleDelete(attr.id)} title="Remove attribute">✕</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const IBAInlineEdit = ({ initial, onSave, onCancel }) => {
  const [val, setVal] = useState(initial || '');
  return (
    <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <input
        className={styles.plmInput}
        style={{ padding: '3px 6px', fontSize: 12 }}
        value={val}
        onChange={e => setVal(e.target.value)}
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel(); }}
      />
      <button className={styles.ibaValueBtn} onClick={() => onSave(val)}>✓</button>
      <button className={styles.ibaDeleteBtn} onClick={onCancel}>✕</button>
    </span>
  );
};

/* ── Substitutes Panel ─────────────────────────────────────────────────── */
const SubstitutesPanel = ({ partId, partsInCtx }) => {
  const navigate = useNavigate();
  const [subs,    setSubs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({ substitutePartId: '', substituteType: 'SUBSTITUTE', rank: 1, note: '' });
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    plmApi.listSubstitutes(partId)
      .then(data => setSubs(data || []))
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [partId]); // eslint-disable-line

  const handleAdd = async () => {
    if (!form.substitutePartId) return;
    setSaving(true);
    try {
      await plmApi.addSubstitute(partId, {
        ...form,
        substitutePartId: Number(form.substitutePartId),
        rank: Number(form.rank) || 1,
      });
      setForm({ substitutePartId: '', substituteType: 'SUBSTITUTE', rank: 1, note: '' });
      setAdding(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await plmApi.deleteSubstitute(partId, id);
      load();
    } catch (e) { setError(e.response?.data?.message || e.message); }
  };

  const candidates = (partsInCtx || []).filter(p => String(p.id) !== String(partId));

  if (loading) return <div className={styles.plmMuted}>Loading substitutes…</div>;

  return (
    <div>
      <div className={styles.ibaHeader}>
        <div>
          <div className={styles.ibaTitle}>Substitutes &amp; Alternates</div>
          <div className={styles.plmMuted}>Interchangeable or alternative parts for BOM configurations</div>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setAdding(a => !a); setError(null); }}>
          {adding ? 'Cancel' : '+ Add Substitute'}
        </Button>
      </div>

      {error && <div className={styles.plmError} style={{ marginTop: 8 }}>{error}</div>}

      {adding && (
        <div className={styles.ibaAddForm}>
          <div className={styles.ibaFormRow}>
            <select
              className={styles.plmSelect}
              value={form.substitutePartId}
              onChange={e => setForm({ ...form, substitutePartId: e.target.value })}
            >
              <option value="">Select substitute part…</option>
              {candidates.map(p => (
                <option key={p.id} value={p.id}>{p.partNumber} — {p.name}</option>
              ))}
            </select>
            <select
              className={styles.plmSelect}
              value={form.substituteType}
              onChange={e => setForm({ ...form, substituteType: e.target.value })}
            >
              <option value="SUBSTITUTE">SUBSTITUTE</option>
              <option value="ALTERNATE">ALTERNATE</option>
            </select>
          </div>
          <div className={styles.ibaFormRow}>
            <input
              className={styles.plmInput}
              type="number"
              min="1"
              placeholder="Rank (1 = preferred)"
              value={form.rank}
              onChange={e => setForm({ ...form, rank: e.target.value })}
            />
            <input
              className={styles.plmInput}
              placeholder="Note"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={saving || !form.substitutePartId}>
              {saving ? 'Saving…' : 'Add Substitute'}
            </Button>
          </div>
        </div>
      )}

      {subs.length === 0 && !adding && (
        <div className={styles.ibaEmpty}>
          <div className={styles.ibaEmptyIcon}>🔄</div>
          <div>No substitutes or alternates defined.</div>
          <div className={styles.plmMuted}>Substitutes are fully interchangeable; alternates require engineering approval.</div>
        </div>
      )}

      {subs.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.partsTable} style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Type</th>
                <th>Part Number</th>
                <th>Name</th>
                <th>State</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => {
                const sp = s.substitutePart;
                return (
                  <tr key={s.id}>
                    <td className={styles.mono}>{s.rank}</td>
                    <td>
                      <span className={`${styles.subTypeBadge} ${s.substituteType === 'ALTERNATE' ? styles.subTypeBadgeAlt : ''}`}>
                        {s.substituteType}
                      </span>
                    </td>
                    <td className={styles.mono}>{sp?.partNumber || '—'}</td>
                    <td>{sp?.name || '—'}</td>
                    <td>{sp?.lifecycleState ? <StateBadge state={sp.lifecycleState} size="sm" /> : '—'}</td>
                    <td className={styles.plmMuted}>{s.note || '—'}</td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {sp?.id && (
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/parts/${sp.id}`)}>Open</Button>
                      )}
                      <button className={styles.ibaDeleteBtn} onClick={() => handleDelete(s.id)}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ── Main PartDetailPage ────────────────────────────────────────────────── */
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
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [selectedChangeType, setSelectedChangeType] = useState('OBSOLETE');

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
  if (loading)        return <div className={styles.plmMuted} style={{ padding: 40, textAlign: 'center' }}>Loading part…</div>;
  if (error && !part) return <div className={styles.plmError} style={{ margin: 20 }}>{error}</div>;
  if (!part)          return <div className={styles.plmMuted} style={{ padding: 40 }}>Part not found.</div>;

  /* ── helpers ────────────────────────────────────────────────────────────── */
  const checkedOutByMe    = part.checkedOutBy && part.checkedOutBy === meUsername;
  const checkedOutByOther = part.checkedOutBy && part.checkedOutBy !== meUsername;
  const canCheckOut       = !part.checkedOutBy
    && part.lifecycleState !== 'RELEASED'
    && part.lifecycleState !== 'OBSOLETE';
  const versionLabel = `${part.revision}.${part.iteration}`;

  const TABS = [
    { key: TAB.STRUCTURE,   icon: '🌳', label: 'Structure'   },
    { key: TAB.IBA,         icon: '📋', label: 'IBA'         },
    { key: TAB.SUBSTITUTES, icon: '🔄', label: 'Substitutes' },
    { key: TAB.RELATED,     icon: '🔗', label: 'Related'     },
    { key: TAB.ATTACHMENTS, icon: '📎', label: 'Files'       },
    { key: TAB.HISTORY,     icon: '📜', label: 'History'     },
  ];

  const TabButton = ({ tab, icon, children }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
    >
      <span className={styles.tabIcon}>{icon}</span>
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
              <LifecycleStateflow entityType="part" currentState={part.lifecycleState} />
            </div>
          </div>
          <div className={styles.infoHeaderRight}>
            {headerActions}
          </div>
        </div>

        {part.checkedOutBy && (
          <div className={`${styles.checkoutBanner} ${checkedOutByMe ? styles.checkoutBannerMine : styles.checkoutBannerOther}`}>
            {checkedOutByMe
              ? <>🔒 Checked out by <strong>you</strong>. Changes will create a new working copy (iteration {part.iteration}).</>
              : <>🔒 Locked by <strong>{part.checkedOutBy}</strong>. You cannot edit this part until it is checked in.</>
            }
            {checkedOutByMe && (
              <div className={styles.checkoutBannerActions}>
                <button className={styles.checkoutBannerBtn} onClick={checkIn}      disabled={coLoading}>✅ Check In</button>
                <button className={styles.checkoutBannerBtn} onClick={undoCheckOut} disabled={coLoading}>↩ Undo</button>
              </div>
            )}
          </div>
        )}

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

        {/* ── LEFT: Edit + Lifecycle + Promotion ── */}
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

          {/* ── AI Impact Analysis ── */}
          <div style={{ marginTop: 16, borderTop: '1px solid #eef2f7', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 800 }}>AI Impact Analysis</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={selectedChangeType}
                  onChange={e => setSelectedChangeType(e.target.value)}
                  style={{
                    padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db',
                    fontSize: 13, background: '#fff'
                  }}
                >
                  <option value="OBSOLETE">Obsolete</option>
                  <option value="REVISE">Revise</option>
                  <option value="PROMOTE">Promote</option>
                  <option value="MODIFY">Modify</option>
                </select>
                <Button
                  variant="primary" size="sm"
                  onClick={() => setShowAiAnalysis(!showAiAnalysis)}
                >
                  {showAiAnalysis ? 'Hide Analysis' : 'Analyze Impact'}
                </Button>
              </div>
            </div>
            {showAiAnalysis && (
              <div style={{ marginTop: 10 }}>
                <ImpactPreview
                  partId={part.id}
                  changeType={selectedChangeType}
                  onAnalysisComplete={(result) => {
                    console.log('AI Analysis complete:', result);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Tab workspace ── */}
        <div className={styles.detailCard}>
          <div className={styles.workspaceHeader}>
            <div className={styles.workspaceTitle}>Workspace</div>
            <div className={styles.tabBar}>
              {TABS.map(t => (
                <TabButton key={t.key} tab={t.key} icon={t.icon}>{t.label}</TabButton>
              ))}
            </div>
          </div>

          {activeTab === TAB.STRUCTURE && (
            <div>
              <div className={styles.plmMuted} style={{ marginBottom: 12 }}>
                Product Structure — click ▸ to expand child assemblies
              </div>
              <BomTreeView rootPartId={part.id} />
              <details style={{ marginTop: 20 }}>
                <summary style={{ cursor: 'pointer', color: 'var(--plm-text-muted, #64748b)', fontSize: 13 }}>
                  Edit BOM lines
                </summary>
                <div style={{ marginTop: 10 }}>
                  <BomEditor parentPartId={part.id} candidateChildren={childrenOptions} />
                </div>
              </details>
            </div>
          )}

          {activeTab === TAB.IBA && (
            <IBAPanel partId={part.id} />
          )}

          {activeTab === TAB.SUBSTITUTES && (
            <SubstitutesPanel partId={part.id} partsInCtx={partsInCtx} />
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
