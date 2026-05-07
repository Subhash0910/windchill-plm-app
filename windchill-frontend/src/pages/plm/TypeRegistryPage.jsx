import React, { useState } from 'react';
import styles from './TypeRegistryPage.module.css';

/* ── PLM type hierarchy ─────────────────────────────────────────────────── */
const TYPE_TREE = [
  {
    id: 'PLMObject', label: 'PLMObject', pkg: 'com.windchill.domain.entity', isAbstract: true,
    description: 'Root of all PLM managed objects. Provides ID, audit timestamps, and soft-delete.',
    attributes: [
      { name: 'id',        type: 'Long',           desc: 'Primary key' },
      { name: 'createdAt', type: 'LocalDateTime',  desc: 'Creation timestamp' },
      { name: 'updatedAt', type: 'LocalDateTime',  desc: 'Last modification timestamp' },
      { name: 'isDeleted', type: 'Boolean',         desc: 'Soft delete flag' },
    ],
    children: [
      {
        id: 'Part', label: 'Part', pkg: 'com.windchill.domain.entity', isAbstract: false,
        description: 'Managed engineering part with lifecycle, revision, and BOM support.',
        attributes: [
          { name: 'partNumber',     type: 'String', desc: 'Unique part number (e.g. PN-001)' },
          { name: 'name',           type: 'String', desc: 'Human-readable part name' },
          { name: 'revision',       type: 'String', desc: 'Revision letter (A, B, C…)' },
          { name: 'iteration',      type: 'Integer',desc: 'Iteration within revision' },
          { name: 'lifecycleState', type: 'String', desc: 'INWORK | UNDERREVIEW | RELEASED | OBSOLETE' },
          { name: 'checkedOutBy',   type: 'String', desc: 'Username who holds checkout lock' },
          { name: 'source',         type: 'String', desc: 'MAKE | BUY | MAKE_OR_BUY' },
          { name: 'quantity',       type: 'Double', desc: 'Default quantity in BOM context' },
          { name: 'unit',           type: 'String', desc: 'Unit of measure (EA, KG, M…)' },
          { name: 'description',    type: 'String', desc: 'Part description / notes' },
        ],
        children: []
      },
      {
        id: 'WTDocument', label: 'WTDocument', pkg: 'com.windchill.domain.entity', isAbstract: false,
        description: 'Windchill-style managed document with version and part associations.',
        attributes: [
          { name: 'documentNumber', type: 'String', desc: 'Unique document number' },
          { name: 'title',          type: 'String', desc: 'Document title' },
          { name: 'documentType',   type: 'String', desc: 'SPEC | DRAWING | REPORT | PROCEDURE | OTHER' },
          { name: 'revision',       type: 'String', desc: 'Revision label' },
          { name: 'lifecycleState', type: 'String', desc: 'INWORK | UNDERREVIEW | RELEASED | OBSOLETE' },
          { name: 'fileUrl',        type: 'String', desc: 'Storage path or external URL' },
          { name: 'fileSize',       type: 'Long',   desc: 'File size in bytes' },
          { name: 'mimeType',       type: 'String', desc: 'MIME type (application/pdf, etc.)' },
          { name: 'createdBy',      type: 'String', desc: 'Authoring user' },
        ],
        children: []
      },
      {
        id: 'ChangeRequest', label: 'ChangeRequest', pkg: 'com.windchill.domain.entity', isAbstract: false,
        description: 'Engineering Change Request (ECR) — captures the need for a change and drives the ECO.',
        attributes: [
          { name: 'ecrNumber',     type: 'String', desc: 'Unique ECR identifier (ECR-001)' },
          { name: 'title',         type: 'String', desc: 'Short summary of the change need' },
          { name: 'description',   type: 'String', desc: 'Detailed problem statement' },
          { name: 'status',        type: 'String', desc: 'OPEN | UNDER_REVIEW | APPROVED | REJECTED | CLOSED' },
          { name: 'priority',      type: 'String', desc: 'LOW | MEDIUM | HIGH | CRITICAL' },
          { name: 'submittedBy',   type: 'String', desc: 'Requestor username' },
          { name: 'approvedBy',    type: 'String', desc: 'Approver username' },
          { name: 'targetDate',    type: 'LocalDate', desc: 'Requested completion date' },
        ],
        children: []
      },
      {
        id: 'ChangeOrder', label: 'ChangeOrder', pkg: 'com.windchill.domain.entity', isAbstract: false,
        description: 'Engineering Change Order (ECO) — the authorized implementation plan for an ECR.',
        attributes: [
          { name: 'ecoNumber',    type: 'String', desc: 'Unique ECO identifier (ECO-001)' },
          { name: 'title',        type: 'String', desc: 'ECO title' },
          { name: 'status',       type: 'String', desc: 'DRAFT | OPEN | IMPLEMENTING | COMPLETE' },
          { name: 'ecrId',        type: 'Long',   desc: 'FK to originating ChangeRequest' },
          { name: 'createdBy',    type: 'String', desc: 'ECO author' },
          { name: 'implementationDate', type: 'LocalDate', desc: 'Target implementation date' },
        ],
        children: []
      },
      {
        id: 'WorkItem', label: 'WorkItem', pkg: 'com.windchill.domain.entity', isAbstract: false,
        description: 'A task item in an engineer\'s worklist — assignable, status-tracked, role-aware.',
        attributes: [
          { name: 'title',       type: 'String', desc: 'Task title' },
          { name: 'description', type: 'String', desc: 'Task details' },
          { name: 'status',      type: 'String', desc: 'PENDING | IN_PROGRESS | COMPLETED | CANCELLED' },
          { name: 'assignedTo',  type: 'String', desc: 'Assignee username' },
          { name: 'priority',    type: 'String', desc: 'LOW | MEDIUM | HIGH | CRITICAL' },
          { name: 'dueDate',     type: 'LocalDate', desc: 'Task due date' },
          { name: 'relatedType', type: 'String', desc: 'ECR | ECO | PART | DOCUMENT' },
          { name: 'relatedId',   type: 'Long',   desc: 'FK to related object' },
        ],
        children: []
      },
    ]
  }
];

const TYPE_COLORS = {
  PLMObject:     '#6b7280',
  Part:          '#6366f1',
  WTDocument:    '#22c55e',
  ChangeRequest: '#f59e0b',
  ChangeOrder:   '#06b6d4',
  WorkItem:      '#8b5cf6',
};

const JAVA_TYPES = ['String', 'Long', 'Integer', 'Double', 'Boolean', 'LocalDate', 'LocalDateTime', 'BigDecimal'];
const EMPTY_SUBTYPE = { id: '', label: '', pkg: 'com.windchill.domain.entity.custom', extendsType: 'Part', description: '' };
const EMPTY_ATTR    = { name: '', type: 'String', desc: '' };

/* ── Type tree node ─────────────────────────────────────────────────────── */
const TypeNode = ({ node, depth = 0, selected, onSelect }) => (
  <div style={{ marginLeft: depth * 16 }}>
    <div
      className={`${styles.treeNode} ${selected === node.id ? styles.treeNodeSelected : ''}`}
      style={{ '--type-color': TYPE_COLORS[node.id] || '#6366f1' }}
      onClick={() => onSelect(node)}
    >
      <span className={styles.treeNodeDot} style={{ background: TYPE_COLORS[node.id] || '#6366f1' }} />
      <span className={styles.treeNodeId}>{node.id}</span>
      {node.isAbstract && <span className={styles.abstractBadge}>abstract</span>}
      {node.isCustom   && <span className={styles.customBadge}>custom</span>}
      <span className={styles.treeNodePkg}>{node.pkg}</span>
    </div>
    {node.children?.map(child => (
      <TypeNode key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
    ))}
  </div>
);

/* ── Main ───────────────────────────────────────────────────────────────── */
const TypeRegistryPage = () => {
  const [tree,        setTree]        = useState(TYPE_TREE);
  const [selected,    setSelected]    = useState(TYPE_TREE[0].children[0]);
  const [showForm,    setShowForm]    = useState(false);
  const [subtypeForm, setSubtypeForm] = useState(EMPTY_SUBTYPE);
  const [customAttrs, setCustomAttrs] = useState([]);
  const [attrForm,    setAttrForm]    = useState(EMPTY_ATTR);
  const [showAttrForm,setShowAttrForm]= useState(false);
  const [copied,      setCopied]      = useState(false);

  /* Flatten tree for lookups */
  const allTypes = [];
  const flatten = (nodes) => nodes.forEach(n => { allTypes.push(n); if (n.children) flatten(n.children); });
  flatten(tree);

  const allTypeIds = allTypes.map(t => t.id);

  const registerSubtype = () => {
    if (!subtypeForm.id || !subtypeForm.label || !subtypeForm.extendsType) return;
    const newType = {
      ...subtypeForm,
      id: subtypeForm.id,
      isAbstract: false,
      isCustom: true,
      attributes: customAttrs,
      children: [],
    };
    setTree(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const addToParent = (nodes) => {
        for (const n of nodes) {
          if (n.id === subtypeForm.extendsType) { n.children.push(newType); return true; }
          if (n.children && addToParent(n.children)) return true;
        }
        return false;
      };
      addToParent(clone);
      return clone;
    });
    setSubtypeForm(EMPTY_SUBTYPE);
    setCustomAttrs([]);
    setShowForm(false);
  };

  const addAttr = () => {
    if (!attrForm.name || !attrForm.type) return;
    setCustomAttrs(prev => [...prev, attrForm]);
    setAttrForm(EMPTY_ATTR);
    setShowAttrForm(false);
  };

  const javaStub = selected ? `package ${selected.pkg};

import com.windchill.domain.entity.${selected.id === 'PLMObject' ? 'BaseEntity' : 'PLMObject'};
import jakarta.persistence.*;

/**
 * ${selected.label}${selected.isCustom ? ' — Custom Subtype' : ''}
 * ${selected.description}
 */
@Entity
@Table(name = "${selected.id.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}_objects")
public class ${selected.id} extends ${selected.id === 'PLMObject' ? 'BaseEntity' : 'PLMObject'} {
${(selected.attributes || []).map(a =>
  `\n    @Column\n    private ${a.type} ${a.name}; // ${a.desc}`
).join('')}
}
` : '';

  const copyStub = () => { navigator.clipboard.writeText(javaStub).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>🧬</div>
          <div>
            <h1 className={styles.title}>Type Registry</h1>
            <div className={styles.sub}>PLM object type hierarchy — view, extend, and register custom subtypes</div>
          </div>
        </div>
        <button className="wc-btn wc-btn--primary" onClick={() => setShowForm(v => !v)}>➕ Register Subtype</button>
      </div>

      {/* ── Concept banner ── */}
      <div className={styles.conceptBanner}>
        <span>📘</span>
        <div>
          <div className={styles.conceptTitle}>PLM Type Hierarchy</div>
          <div className={styles.conceptText}>
            Every PLM object extends a base type. Custom subtypes inherit all parent attributes and lifecycle rules,
            then add their own. Registering a subtype here generates the JPA entity stub — drop it into
            <code> backend-domain/src/main/java/com/windchill/domain/entity/</code> and Hibernate creates the table.
          </div>
        </div>
      </div>

      {/* ── Register subtype form ── */}
      {showForm && (
        <div className={styles.registerForm}>
          <div className={styles.formTitle}>Register Custom Subtype</div>
          <div className={styles.formGrid}>
            <div className="wc-field">
              <label className="wc-label">Class Name (PascalCase)</label>
              <input className="wc-input" style={{ fontFamily: 'monospace' }} value={subtypeForm.id} onChange={e => setSubtypeForm(f => ({ ...f, id: e.target.value }))} placeholder="CustomPart" />
            </div>
            <div className="wc-field">
              <label className="wc-label">Display Label</label>
              <input className="wc-input" value={subtypeForm.label} onChange={e => setSubtypeForm(f => ({ ...f, label: e.target.value }))} placeholder="Custom Part" />
            </div>
            <div className="wc-field">
              <label className="wc-label">Extends (parent type)</label>
              <select className="wc-select" value={subtypeForm.extendsType} onChange={e => setSubtypeForm(f => ({ ...f, extendsType: e.target.value }))}>
                {allTypeIds.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="wc-field">
              <label className="wc-label">Package</label>
              <input className="wc-input" style={{ fontFamily: 'monospace' }} value={subtypeForm.pkg} onChange={e => setSubtypeForm(f => ({ ...f, pkg: e.target.value }))} />
            </div>
          </div>
          <div className="wc-field">
            <label className="wc-label">Description</label>
            <input className="wc-input" value={subtypeForm.description} onChange={e => setSubtypeForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this type for?" />
          </div>

          <div className={styles.attrsSection}>
            <div className={styles.attrsSectionHeader}>
              <div className={styles.attrsSectionTitle}>Custom Attributes <span className={styles.count}>{customAttrs.length}</span></div>
              <button className="wc-btn" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => setShowAttrForm(v => !v)}>+ Add Attribute</button>
            </div>
            {showAttrForm && (
              <div className={styles.attrForm}>
                <div className={styles.attrFormRow}>
                  <div className="wc-field">
                    <label className="wc-label">Name</label>
                    <input className="wc-input" style={{ fontFamily: 'monospace' }} value={attrForm.name} onChange={e => setAttrForm(f => ({ ...f, name: e.target.value }))} placeholder="customField" />
                  </div>
                  <div className="wc-field">
                    <label className="wc-label">Java Type</label>
                    <select className="wc-select" value={attrForm.type} onChange={e => setAttrForm(f => ({ ...f, type: e.target.value }))}>
                      {JAVA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="wc-field" style={{ flex: 2 }}>
                    <label className="wc-label">Description</label>
                    <input className="wc-input" value={attrForm.desc} onChange={e => setAttrForm(f => ({ ...f, desc: e.target.value }))} placeholder="What does this field store?" />
                  </div>
                  <div style={{ paddingTop: '20px' }}>
                    <button className="wc-btn wc-btn--primary" style={{ fontSize: '12px' }} onClick={addAttr}>Add</button>
                  </div>
                </div>
              </div>
            )}
            {customAttrs.length > 0 && (
              <div className={styles.attrList}>
                {customAttrs.map((a, i) => (
                  <div key={i} className={styles.attrRow}>
                    <code className={styles.attrName}>{a.name}</code>
                    <span className={styles.attrType}>{a.type}</span>
                    <span className={styles.attrDesc}>{a.desc}</span>
                    <button className={styles.attrDel} onClick={() => setCustomAttrs(p => p.filter((_,j) => j !== i))}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button className="wc-btn" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="wc-btn wc-btn--primary" onClick={registerSubtype}>Register Subtype</button>
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>

        {/* ── Left: Type tree ── */}
        <div className={styles.treePanel}>
          <div className={styles.treePanelHeader}>Type Hierarchy</div>
          <div className={styles.treeBody}>
            {tree.map(node => (
              <TypeNode key={node.id} node={node} selected={selected?.id} onSelect={setSelected} />
            ))}
          </div>
        </div>

        {/* ── Right: Type detail ── */}
        {selected && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <div className={styles.detailDot} style={{ background: TYPE_COLORS[selected.id] || '#6366f1' }} />
              <div>
                <div className={styles.detailId} style={{ color: TYPE_COLORS[selected.id] || '#6366f1' }}>{selected.id}</div>
                <div className={styles.detailPkg}>{selected.pkg}</div>
              </div>
              {selected.isAbstract && <span className={styles.abstractBadge}>abstract</span>}
              {selected.isCustom   && <span className={styles.customBadge}>custom</span>}
            </div>

            <div className={styles.detailDesc}>{selected.description}</div>

            <div className={styles.attrsTitle}>Attributes <span className={styles.count}>{(selected.attributes || []).length}</span></div>
            <div className={styles.attrTable}>
              <div className={styles.attrTableHead}>
                <span>Name</span><span>Type</span><span>Description</span>
              </div>
              {(selected.attributes || []).map((a, i) => (
                <div key={i} className={styles.attrTableRow}>
                  <code className={styles.attrName}>{a.name}</code>
                  <span className={styles.attrType}>{a.type}</span>
                  <span className={styles.attrDesc}>{a.desc}</span>
                </div>
              ))}
            </div>

            <div className={styles.javaSection}>
              <div className={styles.javaSectionHeader}>
                <div className={styles.attrsTitle} style={{ margin: 0 }}>JPA Entity Stub</div>
                <button className="wc-btn" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={copyStub}>{copied ? '✅ Copied' : '📋 Copy'}</button>
              </div>
              <pre className={styles.javaCode}>{javaStub}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypeRegistryPage;
