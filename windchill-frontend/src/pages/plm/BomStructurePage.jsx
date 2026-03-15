import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../windchill-theme.css';
import './BomStructurePage.css';
import plmApi from '../../services/plmApi';

const TYPE_ICONS = { PART: 'P', DOCUMENT: 'D', PRODUCT: 'PR' };

const BomRow = ({ node, depth, onToggle, onNavigate }) => {
  const indent = depth * 20;
  const hasChildren = node.children && node.children.length > 0;
  return (
    <>
      <tr className={`bom-row bom-row--depth-${Math.min(depth, 5)}`}>
        <td>
          <span className="wc-bom-tree__indent" style={{ width: indent }} />
          {hasChildren ? (
            <button className="wc-bom-tree__toggle" onClick={() => onToggle(node.id)}>
              {node.expanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className="wc-bom-tree__toggle" style={{ visibility: 'hidden' }}>▶</span>
          )}
          <span className={`wc-obj-icon wc-obj-icon--part`} style={{ marginRight: 6 }}>{TYPE_ICONS[node.type] || 'P'}</span>
          <span className="wc-bom-tree__part-link" onClick={() => onNavigate(node)}>{node.partNumber}</span>
        </td>
        <td title={node.name}>{node.name}</td>
        <td>{node.revision || 'A'}</td>
        <td>{node.iteration || 1}</td>
        <td>
          <span className={`wc-badge wc-badge--${(node.lifecycleState || 'INWORK').toLowerCase()}`}>
            {node.lifecycleState || 'INWORK'}
          </span>
        </td>
        <td style={{ textAlign: 'right' }}>{node.quantity ?? 1}</td>
        <td>{node.unit || 'EA'}</td>
        <td>{node.findNumber ?? ''}</td>
        <td>{node.refDesignator || ''}</td>
        <td>{node.source || 'MAKE'}</td>
        <td style={{ color: '#6b7280' }}>{node.createdBy || '—'}</td>
      </tr>
      {node.expanded && hasChildren && node.children.map(child => (
        <BomRow key={child.id} node={child} depth={depth + 1} onToggle={onToggle} onNavigate={onNavigate} />
      ))}
    </>
  );
};

const BomStructurePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [part, setPart] = useState(null);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandAll, setExpandAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const buildTree = useCallback((lines, parentId = null, depth = 0) => {
    if (depth > 15) return [];
    return lines
      .filter(l => l.parentPartId === parentId)
      .map(l => ({
        id: l.childPart?.id,
        partNumber: l.childPart?.partNumber || '—',
        name: l.childPart?.name || '—',
        revision: l.childPart?.revision,
        iteration: l.childPart?.iteration,
        lifecycleState: l.childPart?.lifecycleState,
        quantity: l.quantity,
        unit: l.unit,
        findNumber: l.findNumber,
        refDesignator: l.refDesignator,
        source: l.childPart?.source,
        createdBy: l.childPart?.createdBy,
        type: 'PART',
        expanded: expandAll,
        children: buildTree(lines, l.childPart?.id, depth + 1),
      }));
  }, [expandAll]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [partRes, bomRes] = await Promise.all([
          plmApi.getPartById(id),
          plmApi.getBomStructure(id),
        ]);
        setPart(partRes.data);
        setTree(buildTree(bomRes.data || [], null));
      } catch (e) {
        setError(e.message || 'Failed to load BOM structure');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, buildTree]);

  const handleToggle = (nodeId) => {
    const toggle = (nodes) => nodes.map(n => n.id === nodeId
      ? { ...n, expanded: !n.expanded }
      : { ...n, children: toggle(n.children || []) });
    setTree(prev => toggle(prev));
  };

  const handleExpandAll = () => {
    const expand = (nodes, val) => nodes.map(n => ({ ...n, expanded: val, children: expand(n.children || [], val) }));
    setTree(prev => expand(prev, !expandAll));
    setExpandAll(e => !e);
  };

  const handleNavigate = (node) => navigate(`/plm/parts/${node.id}`);

  const countNodes = (nodes) => nodes.reduce((acc, n) => acc + 1 + countNodes(n.children || []), 0);
  const totalLines = countNodes(tree);

  const filteredTree = searchTerm
    ? tree.filter(n => n.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || n.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : tree;

  return (
    <div className="bom-page">
      {/* Breadcrumb */}
      <div className="wc-breadcrumb">
        <span className="wc-breadcrumb__item" onClick={() => navigate('/plm/parts')}>Parts</span>
        <span className="wc-breadcrumb__sep">›</span>
        {part && <span className="wc-breadcrumb__item" onClick={() => navigate(`/plm/parts/${id}`)}>{part.partNumber}</span>}
        <span className="wc-breadcrumb__sep">›</span>
        <span className="wc-breadcrumb__current">Structure (BOM)</span>
      </div>

      {/* Page Header */}
      <div className="wc-page-header">
        <div>
          <div className="wc-page-header__title">
            <span className="wc-obj-icon wc-obj-icon--part">P</span>
            {part ? `${part.partNumber} — Structure` : 'BOM Structure'}
          </div>
          {part && <div className="wc-page-header__subtitle">{part.name} | Rev {part.revision} | Iter {part.iteration}</div>}
        </div>
        <div className="wc-page-header__actions">
          <button className="wc-btn wc-btn--secondary wc-btn--sm" onClick={() => navigate(`/plm/where-used/${id}`)}>⇧ Where Used</button>
          <button className="wc-btn wc-btn--secondary wc-btn--sm" onClick={() => navigate(`/plm/parts/${id}`)}>← Part Detail</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="wc-toolbar">
        <button className="wc-toolbar__btn" onClick={handleExpandAll}>{expandAll ? '⊟ Collapse All' : '⊞ Expand All'}</button>
        <div className="wc-toolbar__sep" />
        <button className="wc-toolbar__btn" onClick={() => window.print()}>🖨 Print</button>
        <div className="wc-toolbar__sep" />
        <span className="wc-toolbar__label">{totalLines} item{totalLines !== 1 ? 's' : ''}</span>
      </div>

      {/* Search */}
      <div className="wc-search-bar">
        <input
          className="wc-search-input"
          placeholder="Filter by part number or name…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && <button className="wc-btn wc-btn--secondary wc-btn--sm" onClick={() => setSearchTerm('')}>✕ Clear</button>}
      </div>

      {/* BOM Tree Table */}
      <div className="wc-table-wrap">
        {loading && <div className="wc-spinner">Loading BOM structure…</div>}
        {error && <div className="bom-error">⚠ {error}</div>}
        {!loading && !error && (
          <table className="wc-bom-tree">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>Part Number</th>
                <th style={{ minWidth: 180 }}>Name</th>
                <th>Rev</th>
                <th>Iter</th>
                <th>State</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Find #</th>
                <th>Ref Desig</th>
                <th>Source</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {/* Top-level part */}
              {part && (
                <tr className="bom-row bom-root">
                  <td>
                    <span className="wc-obj-icon wc-obj-icon--part" style={{ marginRight: 6 }}>P</span>
                    <span className="wc-bom-tree__part-link" onClick={() => navigate(`/plm/parts/${id}`)}>{part.partNumber}</span>
                    <span className="bom-root-badge"> (top)</span>
                  </td>
                  <td>{part.name}</td>
                  <td>{part.revision}</td>
                  <td>{part.iteration}</td>
                  <td><span className={`wc-badge wc-badge--${(part.lifecycleState || 'INWORK').toLowerCase()}`}>{part.lifecycleState}</span></td>
                  <td style={{ textAlign: 'right' }}>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{part.source || 'MAKE'}</td>
                  <td style={{ color: '#6b7280' }}>{part.createdBy || '—'}</td>
                </tr>
              )}
              {filteredTree.length === 0 && !loading && (
                <tr><td colSpan={11} className="wc-table__empty"><div className="wc-table__empty-icon">📋</div>No child components found.</td></tr>
              )}
              {filteredTree.map(node => (
                <BomRow key={node.id} node={node} depth={1} onToggle={handleToggle} onNavigate={handleNavigate} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BomStructurePage;
