import React, { useCallback, useEffect, useState } from 'react';
import { plmApi } from '../../services/plmApi';
import StateBadge from './StateBadge';
import './BomTree.css';

/**
 * Check whether a BOM line or any of its loaded descendants matches a
 * search query.  Used to decide visibility during filtering.
 */
function nodeOrDescendantsMatch(node, searchQuery, bomMap, expanded) {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();

  const selfMatch =
    (node.childPartNumber || '').toLowerCase().includes(q) ||
    (node.childPartName || '').toLowerCase().includes(q) ||
    String(node.findNumber || '').includes(q);
  if (selfMatch) return true;

  // Walk visible (expanded) children
  const childId = node.childPartId;
  if (!expanded.has(childId)) return false;
  const children = bomMap[childId] || [];
  return children.some(c => nodeOrDescendantsMatch(c, searchQuery, bomMap, expanded));
}

/**
 * Count leaf parts under a parent, respecting expansion boundaries.
 */
function countVisibleLines(partId, bomMap, expanded) {
  let count = 0;
  const lines = bomMap[partId] || [];
  for (const line of lines) {
    count += 1;
    if (expanded.has(line.childPartId)) {
      count += countVisibleLines(line.childPartId, bomMap, expanded);
    }
  }
  return count;
}

/**
 * Recursive tree-row component — defined OUTSIDE BomTree so React
 * does not re-mount it on every parent render.
 */
const BomTreeNode = React.memo(({
  node, depth, bomMap, expanded, loadingNodes, searchQuery,
  onToggle,
}) => {
  const childPartId = node.childPartId;
  const hasChildren = bomMap[childPartId] && bomMap[childPartId].length > 0;
  const isExpanded = expanded.has(childPartId);
  const isLoading = loadingNodes.has(childPartId);

  // We consider a node expandable if we have NOT yet fetched its
  // children (lazy) OR we already know it has children.
  const childDataKnown = Object.prototype.hasOwnProperty.call(bomMap, childPartId);
  const isExpandable = !childDataKnown || hasChildren;

  // Visibility during search
  const visible = !searchQuery || nodeOrDescendantsMatch(node, searchQuery, bomMap, expanded);
  if (!visible) return null;

  const indentPx = depth * 24;

  // Quantity rollup: when expanded with children, show extended total
  let rollupQty = null;
  if (isExpanded && hasChildren) {
    const children = bomMap[childPartId] || [];
    const sum = children.reduce((acc, c) => acc + ((c.quantity ?? 1) * (node.quantity ?? 1)), 0);
    if (sum > 0) rollupQty = sum;
  }

  const isSearchMatch = searchQuery
    ? ((node.childPartNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
       (node.childPartName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
       String(node.findNumber || '').includes(searchQuery.toLowerCase()))
    : false;

  const children = bomMap[childPartId] || [];

  return (
    <>
      <div
        className={`bt-row-depth-wrap${isSearchMatch ? ' bt-row--matched' : ''}`}
        style={{ paddingLeft: indentPx, position: 'relative' }}
      >
        {/* Horizontal tree line */}
        {depth > 0 && (
          <span
            style={{
              position: 'absolute',
              left: indentPx - 14,
              top: '50%',
              width: 12,
              height: 1,
              background: 'var(--wc-border)',
            }}
          />
        )}

        <div className="bt-row">
          {/* Expand toggle */}
          <div className="bt-expand-cell">
            {isLoading ? (
              <span className="bt-expand-spinner" />
            ) : isExpandable ? (
              <button
                type="button"
                className="bt-expand-btn"
                onClick={() => onToggle(childPartId)}
                title={isExpanded ? 'Collapse' : 'Expand children'}
              >
                {isExpanded ? '▾' : '▸'}
              </button>
            ) : (
              <span className="bt-expand-btn bt-expand-btn--hidden" aria-hidden="true" />
            )}
          </div>

          {/* Part info */}
          <div className="bt-part-cell">
            <span className="bt-part-number">
              {node.childPartNumber || `ID:${childPartId}`}
            </span>
            {node.childPartName && (
              <span className="bt-part-name">{node.childPartName}</span>
            )}
            {node.childRevision && (
              <span className="bt-version">Rev {node.childRevision}</span>
            )}
          </div>

          {/* Quantity */}
          <div className="bt-cell">
            <span className={`bt-qty${rollupQty !== null ? ' bt-qty--rollup' : ''}`}>
              {node.quantity ?? 1}
              {rollupQty !== null && (
                <span title={`Extended quantity including children: ${rollupQty}`}>
                  {' '}({rollupQty})
                </span>
              )}
            </span>
          </div>

          {/* Unit */}
          <div className="bt-cell">
            <span className="bt-unit">{node.unit || 'EA'}</span>
          </div>

          {/* Find number + lifecycle state */}
          <div className="bt-cell" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="bt-find-number">{node.findNumber || '—'}</span>
            {node.childLifecycleState && (
              <StateBadge state={node.childLifecycleState} size="sm" />
            )}
          </div>
        </div>
      </div>

      {/* Rendered children */}
      {isExpanded && children.length > 0 && (
        <div className="bt-children-wrap">
          {children
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map(child => (
              <BomTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                bomMap={bomMap}
                expanded={expanded}
                loadingNodes={loadingNodes}
                searchQuery={searchQuery}
                onToggle={onToggle}
              />
            ))}
        </div>
      )}
    </>
  );
});
BomTreeNode.displayName = 'BomTreeNode';

/* ───────────────────────────────────────────────────────
   BomTree — root component
   ──────────────────────────────────────────────────── */
const BomTree = ({ partId, contextId }) => {
  // Map: parentPartId -> BOM line array
  const [bomMap, setBomMap] = useState({});
  // Set of childPartId values whose children have been fetched & are visible
  const [expanded, setExpanded] = useState(new Set());
  // Set of part IDs whose children are currently being fetched
  const [loadingNodes, setLoadingNodes] = useState(new Set());
  const [rootLoading, setRootLoading] = useState(true);
  const [rootError, setRootError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Load root BOM ────────────────────────────────── */
  useEffect(() => {
    if (!partId) return;
    let cancelled = false;
    const load = async () => {
      setRootLoading(true);
      setRootError(null);
      try {
        const data = await plmApi.listBom(partId);
        if (!cancelled) {
          setBomMap(prev => ({ ...prev, [partId]: data || [] }));
        }
      } catch (e) {
        if (!cancelled) {
          setRootError(e.response?.data?.message || e.message || 'Failed to load BOM');
        }
      } finally {
        if (!cancelled) setRootLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [partId]);

  /* ── Toggle expand / collapse ─────────────────────── */
  const toggleExpand = useCallback(async (childPartId) => {
    // 1) Open/close
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(childPartId)) {
        next.delete(childPartId);
        return next;
      }
      next.add(childPartId);
      return next;
    });

    // 2) If we don't have children data for this node, fetch it lazily
    if (!Object.prototype.hasOwnProperty.call(bomMap, childPartId)) {
      setLoadingNodes(prev => new Set(prev).add(childPartId));
      try {
        const data = await plmApi.listBom(childPartId);
        setBomMap(prev => {
          // Don't overwrite if already fetched via another path
          if (Object.prototype.hasOwnProperty.call(prev, childPartId)) return prev;
          return { ...prev, [childPartId]: data || [] };
        });
      } catch {
        // Swallow — node just won't have children to show
      } finally {
        setLoadingNodes(prev => {
          const next = new Set(prev);
          next.delete(childPartId);
          return next;
        });
      }
    }
  }, [bomMap]);

  /* ── Derived ──────────────────────────────────────── */
  const rootLines = (bomMap[partId] || [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const visibleCount = countVisibleLines(partId, bomMap, expanded);

  /* ── Render ───────────────────────────────────────── */
  return (
    <div className="bt-wrap">
      {/* Toolbar */}
      <div className="bt-toolbar">
        <input
          type="text"
          className="bt-search"
          placeholder="Search by part number, name, or find number..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="bt-stats">
          <div className="bt-stat">
            Lines: <span className="bt-stat-value">{rootLines.length}</span>
          </div>
          <div className="bt-stat">
            Total visible: <span className="bt-stat-value">{visibleCount}</span>
          </div>
        </div>
      </div>

      {/* ── Loading state ── */}
      {rootLoading && (
        <div className="bt-loading">
          <span className="bt-spinner" />
          Loading BOM structure...
        </div>
      )}

      {/* ── Error state ── */}
      {rootError && !rootLoading && (
        <div className="bt-error">{rootError}</div>
      )}

      {/* ── Empty state ── */}
      {!rootLoading && !rootError && rootLines.length === 0 && (
        <div className="bt-empty">
          <div className="bt-empty-icon">&#9633;</div>
          <div className="bt-empty-title">No BOM lines</div>
          <div className="bt-empty-sub">
            This part has no Bill of Materials. Add child parts to build its structure.
          </div>
        </div>
      )}

      {/* ── Tree ── */}
      {!rootLoading && !rootError && rootLines.length > 0 && (
        <>
          {/* Rollup banner */}
          <div className="bt-rollup-banner">
            <span className="bt-rollup-badge">{rootLines.length}</span>
            top-level {rootLines.length === 1 ? 'line' : 'lines'}
            <span style={{ margin: '0 6px', color: 'var(--wc-border)' }}>|</span>
            Click
            <span style={{ margin: '0 4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, border: '1px solid var(--wc-border)', borderRadius: 3, background: 'var(--wc-content-bg)', fontSize: 9, lineHeight: 1 }}>
              &#9654;
            </span>
            to expand subassemblies
          </div>

          {/* Column headers */}
          <div className="bt-header">
            <div className="bt-hcell">{/* expand */}</div>
            <div className="bt-hcell">Part</div>
            <div className="bt-hcell">Qty</div>
            <div className="bt-hcell">Unit</div>
            <div className="bt-hcell">Find / State</div>
          </div>

          {/* Tree body */}
          <div className="bt-body">
            {rootLines.map(line => (
              <BomTreeNode
                key={line.id}
                node={line}
                depth={0}
                bomMap={bomMap}
                expanded={expanded}
                loadingNodes={loadingNodes}
                searchQuery={searchQuery}
                onToggle={toggleExpand}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BomTree;
