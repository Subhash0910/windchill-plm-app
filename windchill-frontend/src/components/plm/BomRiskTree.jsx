import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { plmApi } from '../../services/plmApi';
import { aiService } from '../../services/aiService';
import StateBadge from './StateBadge';
import './BomRiskTree.css';

/** ── Helpers ─────────────────────────────────────────────────── */

const RISK_LEVEL = {
  LOW:    { label: 'LOW',    min: 0, max: 3, color: 'var(--wc-success)',  bg: 'rgba(16,185,129,0.12)',  text: '#065F46' },
  MEDIUM: { label: 'MEDIUM', min: 4, max: 6, color: 'var(--wc-warning)', bg: 'rgba(245,158,11,0.12)',  text: '#92400E' },
  HIGH:   { label: 'HIGH',   min: 7, max: 10,color: 'var(--wc-danger)',  bg: 'rgba(239,68,68,0.12)',   text: '#991B1B' },
};

function riskFromScore(score) {
  if (score == null) return null;
  if (score <= 3) return RISK_LEVEL.LOW;
  if (score <= 6) return RISK_LEVEL.MEDIUM;
  return RISK_LEVEL.HIGH;
}

/** Check whether a node or any of its loaded descendants match a search query. */
function nodeOrDescendantsMatch(node, searchQuery, bomMap, expanded) {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  const selfMatch =
    (node.childPartNumber || '').toLowerCase().includes(q) ||
    (node.childPartName || '').toLowerCase().includes(q) ||
    String(node.findNumber || '').includes(q);
  if (selfMatch) return true;
  const childId = node.childPartId;
  if (!expanded.has(childId)) return false;
  const children = bomMap[childId] || [];
  return children.some((c) => nodeOrDescendantsMatch(c, searchQuery, bomMap, expanded));
}

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

/** ── BomRiskTreeNode (recursive) ─────────────────────────────── */

const BomRiskTreeNode = React.memo(({
  node, depth, bomMap, expanded, loadingNodes, searchQuery, riskView,
  riskMap, riskLoading,
  onToggle,
}) => {
  const childPartId = node.childPartId;
  const hasChildren = bomMap[childPartId] && bomMap[childPartId].length > 0;
  const isExpanded = expanded.has(childPartId);
  const isLoading = loadingNodes.has(childPartId);
  const childDataKnown = Object.prototype.hasOwnProperty.call(bomMap, childPartId);
  const isExpandable = !childDataKnown || hasChildren;

  const visible = !searchQuery || nodeOrDescendantsMatch(node, searchQuery, bomMap, expanded);
  if (!visible) return null;

  const indentPx = depth * 24;

  const risk = riskMap[childPartId];
  const riskLoadingNode = riskLoading.has(childPartId);
  const rLevel = risk ? riskFromScore(risk.riskScore) : null;

  const isSearchMatch = searchQuery
    ? ((node.childPartNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
       (node.childPartName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
       String(node.findNumber || '').includes(searchQuery.toLowerCase()))
    : false;

  let rollupQty = null;
  if (isExpanded && hasChildren) {
    const children = bomMap[childPartId] || [];
    const sum = children.reduce((acc, c) => acc + ((c.quantity ?? 1) * (node.quantity ?? 1)), 0);
    if (sum > 0) rollupQty = sum;
  }

  const children = bomMap[childPartId] || [];

  const rowClass = [
    'brt-row-depth-wrap',
    isSearchMatch ? 'brt-row--matched' : '',
    riskView && rLevel ? `brt-row--risk-${rLevel.label.toLowerCase()}` : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={rowClass} style={{ paddingLeft: indentPx, position: 'relative' }}>
        {depth > 0 && (
          <span className="brt-tree-hline" style={{ left: indentPx - 14 }} />
        )}

        <div className="brt-row">
          {/* Expand toggle */}
          <div className="brt-expand-cell">
            {isLoading ? (
              <span className="brt-expand-spinner" />
            ) : isExpandable ? (
              <button
                type="button"
                className="brt-expand-btn"
                onClick={() => onToggle(childPartId)}
                title={isExpanded ? 'Collapse' : 'Expand children'}
              >
                {isExpanded ? '▾' : '▸'}
              </button>
            ) : (
              <span className="brt-expand-btn brt-expand-btn--hidden" aria-hidden="true" />
            )}
          </div>

          {/* Part info + risk badge */}
          <div className="brt-part-cell">
            <span className="brt-part-number">
              {node.childPartNumber || `ID:${childPartId}`}
            </span>
            {riskView && riskLoadingNode && (
              <span className="brt-risk-loading-dot" title="Loading risk score..." />
            )}
            {riskView && rLevel && (
              <span
                className="brt-risk-badge"
                style={{ background: rLevel.bg, color: rLevel.text, borderColor: rLevel.color }}
                title={`Risk: ${risk.riskScore}/10 — ${rLevel.label} (${risk.confidence ?? 0}% confidence)`}
              >
                {risk.riskScore}/{rLevel.label}
              </span>
            )}
            {node.childPartName && (
              <span className="brt-part-name">{node.childPartName}</span>
            )}
            {node.childRevision && (
              <span className="brt-version">Rev {node.childRevision}</span>
            )}
          </div>

          {/* Quantity */}
          <div className="brt-cell">
            <span className={`brt-qty${rollupQty !== null ? ' brt-qty--rollup' : ''}`}>
              {node.quantity ?? 1}
              {rollupQty !== null && (
                <span title={`Extended quantity including children: ${rollupQty}`}>
                  {' '}({rollupQty})
                </span>
              )}
            </span>
          </div>

          {/* Unit */}
          <div className="brt-cell">
            <span className="brt-unit">{node.unit || 'EA'}</span>
          </div>

          {/* Find number + lifecycle */}
          <div className="brt-cell brt-cell--end">
            <span className="brt-find-number">{node.findNumber || '—'}</span>
            {node.childLifecycleState && (
              <StateBadge state={node.childLifecycleState} size="sm" />
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {isExpanded && children.length > 0 && (
        <div className="brt-children-wrap">
          {children
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((child) => (
              <BomRiskTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                bomMap={bomMap}
                expanded={expanded}
                loadingNodes={loadingNodes}
                searchQuery={searchQuery}
                riskView={riskView}
                riskMap={riskMap}
                riskLoading={riskLoading}
                onToggle={onToggle}
              />
            ))}
        </div>
      )}
    </>
  );
});
BomRiskTreeNode.displayName = 'BomRiskTreeNode';

/** ── Aggregate helpers ───────────────────────────────────────── */

function collectAllPartIds(bomMap) {
  const ids = new Set();
  for (const [, lines] of Object.entries(bomMap)) {
    for (const line of lines) {
      ids.add(line.childPartId);
    }
  }
  return ids;
}

function computeAggregate(riskMap) {
  let total = 0;
  let count = 0;
  for (const r of Object.values(riskMap)) {
    if (r && r.riskScore != null) {
      total += r.riskScore;
      count += 1;
    }
  }
  if (count === 0) return null;
  const avg = total / count;
  return {
    avgScore: Math.round(avg * 10) / 10,
    level: riskFromScore(avg),
    totalAnalyzed: count,
  };
}

/** ── BomRiskTree (root) ──────────────────────────────────────── */

const BomRiskTree = ({ partId, contextId }) => {
  const [bomMap, setBomMap] = useState({});
  const [expanded, setExpanded] = useState(new Set());
  const [loadingNodes, setLoadingNodes] = useState(new Set());
  const [rootLoading, setRootLoading] = useState(true);
  const [rootError, setRootError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskView, setRiskView] = useState(false);

  /* Risk data state */
  const [riskMap, setRiskMap] = useState({});
  const [riskLoading, setRiskLoading] = useState(new Set());
  const [riskError, setRiskError] = useState(null);

  const riskFetchedRef = useRef(new Set());
  const isMountedRef = useRef(true);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  /* ── Load root BOM ──────────────────────────── */
  useEffect(() => {
    if (!partId) return;
    let cancelled = false;
    const load = async () => {
      setRootLoading(true);
      setRootError(null);
      try {
        const data = await plmApi.listBom(partId);
        if (!cancelled) setBomMap((prev) => ({ ...prev, [partId]: data || [] }));
      } catch (e) {
        if (!cancelled) setRootError(e.response?.data?.message || e.message || 'Failed to load BOM');
      } finally {
        if (!cancelled) setRootLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [partId]);

  /* ── Expand / collapse toggle ───────────────── */
  const toggleExpand = useCallback(async (childPartId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(childPartId)) { next.delete(childPartId); } else { next.add(childPartId); }
      return next;
    });

    if (!Object.prototype.hasOwnProperty.call(bomMap, childPartId)) {
      setLoadingNodes((prev) => new Set(prev).add(childPartId));
      try {
        const data = await plmApi.listBom(childPartId);
        setBomMap((prev) => {
          if (Object.prototype.hasOwnProperty.call(prev, childPartId)) return prev;
          return { ...prev, [childPartId]: data || [] };
        });
      } catch { /* swallow */ }
      finally {
        setLoadingNodes((prev) => {
          const next = new Set(prev);
          next.delete(childPartId);
          return next;
        });
      }
    }
  }, [bomMap]);

  /* ── Fetch risk scores when risk view toggled ON ────────────── */
  useEffect(() => {
    if (!riskView) return;
    const ids = collectAllPartIds(bomMap);
    if (ids.size === 0) return;

    const toFetch = [...ids].filter((id) => !riskFetchedRef.current.has(id));

    if (toFetch.length === 0) return;

    let cancelled = false;

    const fetchBatch = async () => {
      setRiskError(null);
      setRiskLoading((prev) => {
        const next = new Set(prev);
        toFetch.forEach((id) => next.add(id));
        return next;
      });

      // Fetch in parallel with a concurrency limit of 5
      const limit = 5;
      const results = [];

      for (let i = 0; i < toFetch.length; i += limit) {
        if (cancelled) return;
        const chunk = toFetch.slice(i, i + limit);
        const chunkResults = await Promise.allSettled(
          chunk.map((id) =>
            aiService.analyzeRisk(id, 'MODIFY', null, null, null).then((r) => ({ id, r }))
          )
        );
        results.push(...chunkResults);
      }

      if (cancelled) return;

      const mapUpdate = {};
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          mapUpdate[res.value.id] = res.value.r || res.value;
          riskFetchedRef.current.add(res.value.id);
        }
      }

      if (isMountedRef.current) {
        setRiskMap((prev) => ({ ...prev, ...mapUpdate }));
        setRiskLoading((prev) => {
          const next = new Set(prev);
          toFetch.forEach((id) => next.delete(id));
          return next;
        });
      }
    };

    fetchBatch();
    return () => { cancelled = true; };
  }, [riskView, bomMap]);

  /* ── Derived ────────────────────────────────── */
  const rootLines = (bomMap[partId] || [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const visibleCount = countVisibleLines(partId, bomMap, expanded);

  const aggregate = useMemo(() => {
    if (!riskView) return null;
    return computeAggregate(riskMap);
  }, [riskView, riskMap]);

  /* ── Render ──────────────────────────────────── */
  return (
    <div className="brt-wrap">
      {/* Toolbar */}
      <div className="brt-toolbar">
        <input
          type="text"
          className="brt-search"
          placeholder="Search by part number, name, or find number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="brt-toolbar-right">
          <div className="brt-stats">
            <div className="brt-stat">
              Lines: <span className="brt-stat-value">{rootLines.length}</span>
            </div>
            <div className="brt-stat">
              Visible: <span className="brt-stat-value">{visibleCount}</span>
            </div>
            {aggregate && (
              <div className="brt-stat brt-stat--aggregate">
                Avg Risk:{' '}
                <span
                  className="brt-stat-value"
                  style={{ color: aggregate.level.color }}
                >
                  {aggregate.avgScore}/10
                </span>
                <span className="brt-stat-sub">({aggregate.totalAnalyzed} parts)</span>
              </div>
            )}
          </div>

          {/* Risk View toggle */}
          <label className="brt-risk-toggle" title="Toggle AI risk overlay">
            <input
              type="checkbox"
              checked={riskView}
              onChange={(e) => setRiskView(e.target.checked)}
            />
            <span className="brt-risk-toggle-track">
              <span className="brt-risk-toggle-thumb" />
            </span>
            <span className="brt-risk-toggle-label">Risk View</span>
          </label>
        </div>
      </div>

      {/* Risk legend — only visible when risk view on */}
      {riskView && (
        <div className="brt-legend">
          <span className="brt-legend-item">
            <span className="brt-legend-dot brt-legend-dot--low" /> Low (0-3)
          </span>
          <span className="brt-legend-item">
            <span className="brt-legend-dot brt-legend-dot--medium" /> Medium (4-6)
          </span>
          <span className="brt-legend-item">
            <span className="brt-legend-dot brt-legend-dot--high" /> High (7-10)
          </span>
          {riskError && <span className="brt-legend-error">{riskError}</span>}
        </div>
      )}

      {/* Loading state */}
      {rootLoading && (
        <div className="brt-loading">
          <span className="brt-spinner" />
          Loading BOM structure...
        </div>
      )}

      {/* Error state */}
      {rootError && !rootLoading && (
        <div className="brt-error">{rootError}</div>
      )}

      {/* Empty state */}
      {!rootLoading && !rootError && rootLines.length === 0 && (
        <div className="brt-empty">
          <div className="brt-empty-icon">&#9633;</div>
          <div className="brt-empty-title">No BOM lines</div>
          <div className="brt-empty-sub">
            This part has no Bill of Materials. Add child parts to build its structure.
          </div>
        </div>
      )}

      {/* Tree */}
      {!rootLoading && !rootError && rootLines.length > 0 && (
        <>
          <div className="brt-rollup-banner">
            <span className="brt-rollup-badge">{rootLines.length}</span>
            top-level {rootLines.length === 1 ? 'line' : 'lines'}
            <span style={{ margin: '0 6px', color: 'var(--wc-border)' }}>|</span>
            Click <span className="brt-rollup-icon">&#9654;</span> to expand subassemblies
            {riskView && aggregate && (
              <>
                <span style={{ margin: '0 6px', color: 'var(--wc-border)' }}>|</span>
                Assembly risk:{' '}
                <strong style={{ color: aggregate.level.color }}>
                  {aggregate.avgScore}/10 {aggregate.level.label}
                </strong>
              </>
            )}
          </div>

          {/* Column headers */}
          <div className="brt-header">
            <div className="brt-hcell">{/* expand */}</div>
            <div className="brt-hcell">Part {riskView ? '+ Risk' : ''}</div>
            <div className="brt-hcell">Qty</div>
            <div className="brt-hcell">Unit</div>
            <div className="brt-hcell">Find / State</div>
          </div>

          {/* Tree body */}
          <div className="brt-body">
            {rootLines.map((line) => (
              <BomRiskTreeNode
                key={line.id}
                node={line}
                depth={0}
                bomMap={bomMap}
                expanded={expanded}
                loadingNodes={loadingNodes}
                searchQuery={searchQuery}
                riskView={riskView}
                riskMap={riskMap}
                riskLoading={riskLoading}
                onToggle={toggleExpand}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BomRiskTree;
