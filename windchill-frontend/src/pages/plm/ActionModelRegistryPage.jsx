import React, { useEffect, useState, useCallback } from 'react';
import { plmApi } from '../../services/plmApi';
import styles from './ActionModelRegistryPage.module.css';

/* ── Constants ──────────────────────────────────────────────────────────── */
const OBJECT_TYPES = ['PART', 'ECR', 'ECO', 'DOCUMENT', 'WORKITEM'];
const TOOLBAR_SECTIONS = ['PRIMARY', 'SECONDARY', 'OVERFLOW'];
const HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];
const MIN_ROLES = ['VIEWER', 'ENGINEER', 'MANAGER', 'ADMIN'];

const OBJECT_TYPE_META = {
  PART:     { icon: '⚙️', color: '#6366f1', label: 'Part' },
  ECR:      { icon: '📋', color: '#f59e0b', label: 'Change Request' },
  ECO:      { icon: '📝', color: '#06b6d4', label: 'Change Order' },
  DOCUMENT: { icon: '📄', color: '#22c55e', label: 'Document' },
  WORKITEM: { icon: '✅', color: '#8b5cf6', label: 'Work Item' },
};

const EMPTY_FORM = {
  objectType: 'PART',
  actionName: '',
  label: '',
  icon: '⚡',
  description: '',
  actionGroup: '',
  processorClass: '',
  processorMethod: '',
  endpoint: '',
  httpMethod: 'POST',
  minRole: 'ENGINEER',
  toolbarSection: 'PRIMARY',
  sortOrder: 0,
  enabledStates: '',
  isEnabled: true,
};

/* ── XML Viewer ─────────────────────────────────────────────────────────── */
const XmlViewer = ({ xml }) => {
  const [copied, setCopied] = useState(false);
  if (!xml) return <div className={styles.xmlEmpty}>Select an action to view its Windchill XML registration.</div>;

  const copy = () => {
    navigator.clipboard.writeText(xml).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // simple syntax highlight
  const highlighted = xml
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(&lt;\/?)([\w:]+)/g, '<span class="xml-tag">$1$2</span>')
    .replace(/([\w]+)=/g, '<span class="xml-attr">$1</span>=')
    .replace(/="([^"]*)"/g, '="<span class="xml-val">$1</span>"')
    .replace(/(--.*?--)/g, '<span class="xml-comment">$1</span>')
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="xml-comment">$1</span>');

  return (
    <div className={styles.xmlViewer}>
      <div className={styles.xmlHeader}>
        <div className={styles.xmlTitle}>Windchill XML Registration</div>
        <div className={styles.xmlSub}>Equivalent to codebase/config/actions/site_actionmodels.xml</div>
        <button className={styles.xmlCopyBtn} onClick={copy}>{copied ? '✅ Copied' : '📋 Copy'}</button>
      </div>
      <pre
        className={styles.xmlCode}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
};

/* ── Edit / Create Dialog ───────────────────────────────────────────────── */
const ActionDialog = ({ action, onSave, onClose }) => {
  const isNew = !action?.id;
  const [tab,    setTab]    = useState('general');
  const [form,   setForm]   = useState(isNew ? EMPTY_FORM : { ...action, enabledStates: action.enabledStates || '' });
  const [xml,    setXml]    = useState(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Load XML preview ── */
  useEffect(() => {
    if (tab !== 'xml') return;
    if (!action?.id) {
      // build a preview from form data
      setXml(buildLocalXml(form));
      return;
    }
    plmApi.getActionXml(action.id)
      .then(setXml)
      .catch(() => setXml(buildLocalXml(form)));
  }, [tab, action?.id]); // eslint-disable-line

  const handleSave = async () => {
    setError(null); setSaving(true);
    try {
      await onSave(form, action?.id);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="wc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`wc-dialog wc-dialog--lg ${styles.dialog}`}>
        <div className="wc-dialog__header">
          <div className="wc-dialog__title">
            {isNew ? '➕ Register New Action' : `✏️ Edit Action — ${action.actionName}`}
          </div>
          <button className="wc-dialog__close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className={styles.dialogTabs}>
          {[['general','⚙ General'],['processor','🔌 Processor'],['xml','📄 XML']].map(([k, l]) => (
            <button key={k} className={`${styles.dialogTab} ${tab===k ? styles.dialogTabActive : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="wc-dialog__body">
          {error && <div className="wc-alert wc-alert--error">{error}</div>}

          {/* ── GENERAL tab ── */}
          {tab === 'general' && (
            <div className={styles.formGrid}>
              <div className="wc-field">
                <label className="wc-label">Object Type *</label>
                <select className="wc-select" value={form.objectType} onChange={e => set('objectType', e.target.value)}>
                  {OBJECT_TYPES.map(t => <option key={t} value={t}>{OBJECT_TYPE_META[t]?.icon} {t}</option>)}
                </select>
              </div>
              <div className="wc-field">
                <label className="wc-label">Action Name * <small>(unique per type, no spaces)</small></label>
                <input className="wc-input" value={form.actionName} placeholder="e.g. checkout" onChange={e => set('actionName', e.target.value)} />
              </div>
              <div className="wc-field">
                <label className="wc-label">Button Label *</label>
                <input className="wc-input" value={form.label} placeholder="e.g. Check Out" onChange={e => set('label', e.target.value)} />
              </div>
              <div className="wc-field">
                <label className="wc-label">Icon (emoji)</label>
                <input className="wc-input" value={form.icon} placeholder="🔒" onChange={e => set('icon', e.target.value)} maxLength={4} />
              </div>
              <div className="wc-field" style={{ gridColumn: '1/-1' }}>
                <label className="wc-label">Description</label>
                <textarea className="wc-textarea" rows={2} value={form.description} placeholder="What does this action do?" onChange={e => set('description', e.target.value)} />
              </div>
              <div className="wc-field">
                <label className="wc-label">Toolbar Section</label>
                <select className="wc-select" value={form.toolbarSection} onChange={e => set('toolbarSection', e.target.value)}>
                  {TOOLBAR_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="wc-field">
                <label className="wc-label">Minimum Role</label>
                <select className="wc-select" value={form.minRole} onChange={e => set('minRole', e.target.value)}>
                  {MIN_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="wc-field">
                <label className="wc-label">Sort Order</label>
                <input className="wc-input" type="number" value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} />
              </div>
              <div className="wc-field">
                <label className="wc-label">Action Group</label>
                <input className="wc-input" value={form.actionGroup} placeholder="e.g. checkout-group" onChange={e => set('actionGroup', e.target.value)} />
              </div>
              <div className="wc-field" style={{ gridColumn: '1/-1' }}>
                <label className="wc-label">Enabled In States <small>(comma-separated, empty = all states)</small></label>
                <input className="wc-input" value={form.enabledStates} placeholder="INWORK,UNDERREVIEW" onChange={e => set('enabledStates', e.target.value)} />
                <div className={styles.fieldHint}>Leave blank to show in all lifecycle states.</div>
              </div>
              <div className="wc-field">
                <label className="wc-label">Status</label>
                <label className={styles.toggleLabel}>
                  <input type="checkbox" checked={!!form.isEnabled} onChange={e => set('isEnabled', e.target.checked)} />
                  <span className={styles.toggleSwitch} />
                  <span>{form.isEnabled ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
            </div>
          )}

          {/* ── PROCESSOR tab ── */}
          {tab === 'processor' && (
            <div className={styles.processorPanel}>
              <div className={styles.processorIntro}>
                <div className={styles.processorIntroIcon}>🔌</div>
                <div>
                  <div className={styles.processorIntroTitle}>Form Processor Registration</div>
                  <div className={styles.processorIntroSub}>
                    In PTC Windchill, form processors are Java classes registered via XML.
                    Each action button maps to a processor method that executes the business logic.
                  </div>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className="wc-field" style={{ gridColumn: '1/-1' }}>
                  <label className="wc-label">Processor Class (fully qualified Java class)</label>
                  <input className="wc-input" style={{ fontFamily: 'monospace' }}
                    value={form.processorClass}
                    placeholder="com.windchill.service.plm.PartServiceImpl"
                    onChange={e => set('processorClass', e.target.value)}
                  />
                </div>
                <div className="wc-field">
                  <label className="wc-label">Processor Method</label>
                  <input className="wc-input" style={{ fontFamily: 'monospace' }}
                    value={form.processorMethod}
                    placeholder="checkOut"
                    onChange={e => set('processorMethod', e.target.value)}
                  />
                </div>
                <div className="wc-field">
                  <label className="wc-label">HTTP Method</label>
                  <select className="wc-select" value={form.httpMethod} onChange={e => set('httpMethod', e.target.value)}>
                    {HTTP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="wc-field" style={{ gridColumn: '1/-1' }}>
                  <label className="wc-label">REST Endpoint</label>
                  <input className="wc-input" style={{ fontFamily: 'monospace' }}
                    value={form.endpoint}
                    placeholder="/api/v1/plm/parts/{id}/checkout"
                    onChange={e => set('endpoint', e.target.value)}
                  />
                  <div className={styles.fieldHint}>Use <code>{'{id}'}</code> as the object ID placeholder.</div>
                </div>
              </div>

              {/* Processor preview card */}
              {form.processorClass && (
                <div className={styles.processorPreview}>
                  <div className={styles.processorPreviewTitle}>Processor Binding</div>
                  <div className={styles.processorPreviewRow}>
                    <span className={styles.processorPreviewLabel}>Class</span>
                    <code className={styles.processorPreviewValue}>{form.processorClass}</code>
                  </div>
                  <div className={styles.processorPreviewRow}>
                    <span className={styles.processorPreviewLabel}>Method</span>
                    <code className={styles.processorPreviewValue}>{form.processorMethod || '—'}</code>
                  </div>
                  <div className={styles.processorPreviewRow}>
                    <span className={styles.processorPreviewLabel}>Endpoint</span>
                    <code className={styles.processorPreviewValue}>{form.httpMethod} {form.endpoint || '—'}</code>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── XML tab ── */}
          {tab === 'xml' && (
            <div>
              <div className={styles.xmlInfoBanner}>
                <span>📘</span>
                <span>In PTC Windchill, this XML would live in
                  <code> codebase/config/actions/site_actionmodels.xml</code> and be loaded
                  by the MethodServer at startup. Here it is database-driven but fully equivalent.</span>
              </div>
              <XmlViewer xml={xml || buildLocalXml(form)} />
            </div>
          )}
        </div>

        <div className="wc-dialog__footer">
          <button className="wc-btn" onClick={onClose}>Cancel</button>
          <button className="wc-btn wc-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Register Action' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────────────────── */
const ActionModelRegistryPage = () => {
  const [actions,        setActions]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [selectedType,   setSelectedType]   = useState('ALL');
  const [selectedAction, setSelectedAction] = useState(null);
  const [xmlAction,      setXmlAction]      = useState(null);
  const [xml,            setXml]            = useState(null);
  const [showDialog,     setShowDialog]     = useState(false);
  const [editAction,     setEditAction]     = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');

  const load = useCallback(() => {
    setLoading(true);
    plmApi.listActionModels()
      .then(data => setActions(Array.isArray(data) ? data : []))
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── XML panel ── */
  const openXml = (action) => {
    setXmlAction(action);
    setXml(null);
    plmApi.getActionXml(action.id)
      .then(setXml)
      .catch(() => setXml(buildLocalXml(action)));
  };

  /* ── CRUD ── */
  const handleSave = async (form, id) => {
    if (id) {
      await plmApi.updateActionModel(id, form);
    } else {
      await plmApi.createActionModel(form);
    }
    load();
  };

  const handleToggle = async (action) => {
    try {
      await plmApi.toggleActionModel(action.id);
      load();
    } catch (e) { setError(e.response?.data?.message || e.message); }
  };

  const handleDelete = async (action) => {
    if (!window.confirm(`Delete action "${action.actionName}" from ${action.objectType}? This cannot be undone.`)) return;
    try {
      await plmApi.deleteActionModel(action.id);
      load();
    } catch (e) { setError(e.response?.data?.message || e.message); }
  };

  /* ── Filter ── */
  const filtered = actions.filter(a => {
    const typeOk = selectedType === 'ALL' || a.objectType === selectedType;
    const searchOk = !searchQuery || [a.actionName, a.label, a.objectType, a.processorClass, a.description]
      .some(f => f && f.toLowerCase().includes(searchQuery.toLowerCase()));
    return typeOk && searchOk;
  });

  /* ── Group by objectType ── */
  const grouped = {};
  filtered.forEach(a => {
    if (!grouped[a.objectType]) grouped[a.objectType] = [];
    grouped[a.objectType].push(a);
  });

  const totalEnabled  = actions.filter(a => a.isEnabled  && !a.isDeleted).length;
  const totalDisabled = actions.filter(a => !a.isEnabled && !a.isDeleted).length;

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>⚙</div>
          <div>
            <h1 className={styles.pageTitle}>Action Model Registry</h1>
            <div className={styles.pageSub}>
              Windchill-style form processor and action model registration.
              Equivalent to <code>codebase/config/actions/site_actionmodels.xml</code>
            </div>
          </div>
        </div>
        <div className={styles.pageHeaderRight}>
          <div className={styles.statPill}><span>{totalEnabled}</span> Enabled</div>
          <div className={`${styles.statPill} ${styles.statPillDim}`}><span>{totalDisabled}</span> Disabled</div>
          <button className="wc-btn wc-btn--primary" onClick={() => { setEditAction(null); setShowDialog(true); }}>
            ➕ Register Action
          </button>
        </div>
      </div>

      {/* ── Windchill concept banner ── */}
      <div className={styles.conceptBanner}>
        <div className={styles.conceptBannerIcon}>📘</div>
        <div>
          <div className={styles.conceptBannerTitle}>How Windchill Action Models Work</div>
          <div className={styles.conceptBannerText}>
            In PTC Windchill, every toolbar button is a registered <strong>action</strong> bound to a
            <strong> form processor</strong> Java class. Clicking "Check Out" invokes
            <code> com.ptc.windchill.mpml.part.PartActionProcessor.checkout()</code>.
            This registry is the database-driven equivalent — same architecture, REST delivery.
          </div>
        </div>
      </div>

      {/* ── Toolbar: filter + search ── */}
      <div className={styles.filterBar}>
        <div className={styles.typeFilterRow}>
          <button
            className={`${styles.typeFilter} ${selectedType === 'ALL' ? styles.typeFilterActive : ''}`}
            onClick={() => setSelectedType('ALL')}
          >
            All Types
            <span className={styles.typeFilterCount}>{actions.length}</span>
          </button>
          {OBJECT_TYPES.map(t => {
            const count = actions.filter(a => a.objectType === t).length;
            if (!count) return null;
            const meta = OBJECT_TYPE_META[t];
            return (
              <button
                key={t}
                className={`${styles.typeFilter} ${selectedType === t ? styles.typeFilterActive : ''}`}
                style={selectedType === t ? { borderColor: meta.color, color: meta.color } : {}}
                onClick={() => setSelectedType(selectedType === t ? 'ALL' : t)}
              >
                {meta.icon} {t}
                <span className={styles.typeFilterCount}>{count}</span>
              </button>
            );
          })}
        </div>
        <input
          className={`wc-input ${styles.searchInput}`}
          placeholder="Search actions, processors, endpoints…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {error && <div className="wc-alert wc-alert--error" style={{ margin: '0 0 16px' }}>{error}</div>}

      {/* ── Main split: table + XML panel ── */}
      <div className={styles.mainSplit}>
        <div className={styles.tablePanel}>
          {loading ? (
            <div className="wc-spinner-wrap"><div className="wc-spinner" /><span className="wc-spinner-label">Loading action registry…</span></div>
          ) : filtered.length === 0 ? (
            <div className="wc-empty">
              <div className="wc-empty__icon">⚡</div>
              <div className="wc-empty__title">No actions found</div>
              <div className="wc-empty__sub">Register your first action using the button above.</div>
            </div>
          ) : (
            Object.entries(grouped).map(([type, typeActions]) => {
              const meta = OBJECT_TYPE_META[type] || { icon: '📦', color: '#6366f1', label: type };
              return (
                <div key={type} className={styles.typeSection}>
                  <div className={styles.typeSectionHeader}>
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    <span className={styles.typeSectionLabel}>{type}</span>
                    <span className={styles.typeSectionCount}>{typeActions.length} actions</span>
                    <div className={styles.typeSectionDivider} />
                    <span className={styles.typeSectionSub}>wt.{type.toLowerCase()}.WT{type.substring(0,1)+type.slice(1).toLowerCase()}</span>
                  </div>

                  <div className={styles.actionsGrid}>
                    {typeActions.map(action => (
                      <div
                        key={action.id}
                        className={`${styles.actionCard} ${!action.isEnabled ? styles.actionCardDisabled : ''} ${selectedAction?.id === action.id ? styles.actionCardSelected : ''}`}
                        onClick={() => { setSelectedAction(action); openXml(action); }}
                      >
                        <div className={styles.actionCardTop}>
                          <div className={styles.actionCardIcon}>{action.icon || '⚡'}</div>
                          <div className={styles.actionCardInfo}>
                            <div className={styles.actionCardName}>{action.actionName}</div>
                            <div className={styles.actionCardLabel}>{action.label}</div>
                          </div>
                          <div className={styles.actionCardBadges}>
                            <SectionBadge section={action.toolbarSection} />
                            {!action.isEnabled && <span className={styles.disabledChip}>OFF</span>}
                          </div>
                        </div>

                        {action.processorClass && (
                          <div className={styles.actionCardProcessor}>
                            <span className={styles.processorIcon}>🔌</span>
                            <code className={styles.processorText}>{action.processorClass.split('.').pop()}.{action.processorMethod || '…'}</code>
                          </div>
                        )}

                        {action.endpoint && (
                          <div className={styles.actionCardEndpoint}>
                            <span className={styles.httpMethodBadge} data-method={action.httpMethod}>{action.httpMethod}</span>
                            <code className={styles.endpointText}>{action.endpoint}</code>
                          </div>
                        )}

                        <div className={styles.actionCardMeta}>
                          <span className={styles.roleBadge}>{action.minRole}</span>
                          {action.enabledStates && (
                            <span className={styles.statesList}>
                              {action.enabledStates.split(',').map(s => s.trim()).map(s => (
                                <span key={s} className={styles.stateChip}>{s}</span>
                              ))}
                            </span>
                          )}
                        </div>

                        <div className={styles.actionCardActions} onClick={e => e.stopPropagation()}>
                          <button className={styles.cardBtn} onClick={() => { setEditAction(action); setShowDialog(true); }} title="Edit">✏️</button>
                          <button className={`${styles.cardBtn} ${action.isEnabled ? styles.cardBtnActive : ''}`} onClick={() => handleToggle(action)} title={action.isEnabled ? 'Disable' : 'Enable'}>
                            {action.isEnabled ? '🟢' : '🔴'}
                          </button>
                          <button className={`${styles.cardBtn} ${styles.cardBtnXml}`} onClick={() => { setSelectedAction(action); openXml(action); }} title="View XML">📄 XML</button>
                          <button className={`${styles.cardBtn} ${styles.cardBtnDel}`} onClick={() => handleDelete(action)} title="Delete">🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── XML preview panel ── */}
        <div className={styles.xmlPanel}>
          <div className={styles.xmlPanelHeader}>
            <div className={styles.xmlPanelTitle}>
              {xmlAction ? `XML — ${xmlAction.actionName}` : 'XML Preview'}
            </div>
            {xmlAction && (
              <div className={styles.xmlPanelSub}>{xmlAction.objectType}</div>
            )}
          </div>
          <XmlViewer xml={xml} />
        </div>
      </div>

      {/* ── Windchill reference card ── */}
      <div className={styles.referenceCard}>
        <div className={styles.referenceTitle}>Architecture Reference</div>
        <div className={styles.referenceGrid}>
          <div className={styles.refItem}>
            <div className={styles.refItemTitle}>Action Model File</div>
            <code className={styles.refItemCode}>codebase/config/actions/site_actionmodels.xml</code>
            <div className={styles.refItemDesc}>Windchill reads these at MethodServer startup and builds the action registry in memory.</div>
          </div>
          <div className={styles.refItem}>
            <div className={styles.refItemTitle}>Form Processor Class</div>
            <code className={styles.refItemCode}>com.ptc.windchill.mpml.part.PartActionProcessor</code>
            <div className={styles.refItemDesc}>Java class implementing the action logic. Methods map 1:1 to registered actions.</div>
          </div>
          <div className={styles.refItem}>
            <div className={styles.refItemTitle}>Object Type Mapping</div>
            <code className={styles.refItemCode}>wt.part.WTPart → PART object type</code>
            <div className={styles.refItemDesc}>Each registered action is scoped to a Windchill object type, controlling which toolbars it appears in.</div>
          </div>
          <div className={styles.refItem}>
            <div className={styles.refItemTitle}>Toolbar Section Mapping</div>
            <code className={styles.refItemCode}>PRIMARY → visible | SECONDARY → More ▾ | OVERFLOW → hidden</code>
            <div className={styles.refItemDesc}>Controls button placement in the Info Page action toolbar, matching Windchill's 3-tier model.</div>
          </div>
        </div>
      </div>

      {/* ── Dialog ── */}
      {showDialog && (
        <ActionDialog
          action={editAction}
          onSave={handleSave}
          onClose={() => { setShowDialog(false); setEditAction(null); }}
        />
      )}
    </div>
  );
};

/* ── Small helpers ─────────────────────────────────────────────────────── */
const SECTION_COLORS = { PRIMARY: '#6366f1', SECONDARY: '#0ea5e9', OVERFLOW: '#6b7280' };
const SectionBadge = ({ section }) => (
  <span className={styles.sectionBadge} style={{ background: SECTION_COLORS[section] + '22', color: SECTION_COLORS[section], borderColor: SECTION_COLORS[section] + '55' }}>
    {section}
  </span>
);

function buildLocalXml(form) {
  const states = form.enabledStates || 'ALL';
  const cls    = form.processorClass || 'com.windchill.api.controller.ActionController';
  const method = form.processorMethod || form.actionName;
  const ep     = form.endpoint || `/api/v1/plm/${(form.objectType||'parts').toLowerCase()}s/{id}/${form.actionName}`;
  const rb     = `com.windchill.plm.msgs.${(form.objectType||'PART').substring(0,1).toUpperCase()}${(form.objectType||'PART').substring(1).toLowerCase()}Actions`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Windchill Action Model Registration
  Equivalent to: codebase/config/actions/site_actionmodels.xml
  Object Type : ${form.objectType || '?'}
  Action Name : ${form.actionName || '?'}
  Generated   : ${new Date().toISOString().split('T')[0]}
-->
<actionModels xmlns="http://www.ptc.com/windchill/actionModel"
              version="11.0">

  <action name="${form.actionName || 'myAction'}"
          resourceBundle="${rb}"
          objectType="wt.${(form.objectType||'part').toLowerCase()}.WT${form.objectType ? form.objectType.charAt(0)+form.objectType.slice(1).toLowerCase() : 'Part'}"
          toolbarSection="${form.toolbarSection || 'PRIMARY'}"
          sortOrder="${form.sortOrder || 0}">

    <!-- Form Processor: handles the action when user clicks the button -->
    <command
        method="${method}"
        class="${cls}"
        windowType="hidden"
        minRole="ROLE_${form.minRole || 'ENGINEER'}">
      <inputparams>
        <param name="oid"  data="oid"/>
        <param name="type" data="type" value="${form.objectType || 'PART'}"/>
      </inputparams>
    </command>

    <!-- REST endpoint equivalent -->
    <restMapping method="${form.httpMethod || 'POST'}" path="${ep}"/>

    <label>${form.label || ''}</label>
    <icon>${form.icon || ''}</icon>

    <!-- Visibility condition: which lifecycle states enable this action -->
    <enabledWhen state="${states}"/>

    <description>${form.description || ''}</description>
  </action>

</actionModels>
`;
}

export default ActionModelRegistryPage;
