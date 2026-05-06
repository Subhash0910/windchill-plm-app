import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { plmApi } from '../../services/plmApi';
import { aiService } from '../../services/aiService';
import './ImpactNetworkGraph.css';

/** ── Constants ─────────────────────────────────────────────── */

const LIFECYCLE_COLORS = {
  INWORK:       { bg: '#F1F5F9', border: '#94A3B8', text: '#475569' },
  UNDERREVIEW:  { bg: '#FFF7ED', border: '#FBBF24', text: '#C2410C' },
  RELEASED:     { bg: '#ECFDF5', border: '#10B981', text: '#047857' },
  OBSOLETE:     { bg: '#FEF2F2', border: '#EF4444', text: '#B91C1C' },
  CANCELLED:    { bg: '#FEF2F2', border: '#F87171', text: '#991B1B' },
};

const RISK_COLORS = {
  LOW:    { edge: '#10B981', bg: 'rgba(16,185,129,0.12)',  text: '#065F46', glow: 'rgba(16,185,129,0.35)' },
  MEDIUM: { edge: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  text: '#92400E', glow: 'rgba(245,158,11,0.35)' },
  HIGH:   { edge: '#EF4444', bg: 'rgba(239,68,68,0.12)',   text: '#991B1B', glow: 'rgba(239,68,68,0.4)' },
};

function riskLevelFromScore(score) {
  if (score == null) return 'LOW';
  if (score <= 3) return 'LOW';
  if (score <= 6) return 'MEDIUM';
  return 'HIGH';
}

/** ── Layout helpers ────────────────────────────────────────── */

function layoutRadial(centerId, children, parents, nodeW, nodeH, radiusX, radiusY) {
  const positions = {};

  // Center node
  positions[centerId] = { x: 0, y: 0 };

  // Place children in a semicircle below
  const childCount = children.length;
  children.forEach((c, i) => {
    const angle = -Math.PI * 0.85 + (Math.PI * 0.7 * i) / Math.max(childCount - 1, 1);
    positions[c.id] = {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * radiusY,
    };
  });

  // Place parents in a semicircle above
  const parentCount = parents.length;
  parents.forEach((p, i) => {
    const angle = Math.PI * 0.15 + (Math.PI * 0.7 * i) / Math.max(parentCount - 1, 1);
    positions[p.id] = {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle) * -radiusY,
    };
  });

  // Shift everything so no negative coordinates (for initial viewport)
  const offsetX = nodeW / 2 + radiusX + 40;
  const offsetY = nodeH / 2 + radiusY + 40;

  const shifted = {};
  for (const [id, pos] of Object.entries(positions)) {
    shifted[id] = { x: pos.x + offsetX, y: pos.y + offsetY };
  }

  return shifted;
}

/** ── Custom Node Component ─────────────────────────────────── */

const ImpactNode = React.memo(({ data }) => {
  const {
    partNumber, name, lifecycleState, riskLevel, riskScore,
    quantity, isCenter, onClick, onHover, onLeave,
  } = data;

  const lc = LIFECYCLE_COLORS[lifecycleState] || LIFECYCLE_COLORS.INWORK;
  const rc = RISK_COLORS[riskLevel] || RISK_COLORS.LOW;

  return (
    <div
      className={`ing-node${isCenter ? ' ing-node--center' : ''}`}
      style={{
        borderColor: isCenter ? 'var(--wc-blue)' : lc.border,
        background: isCenter
          ? 'linear-gradient(135deg, var(--wc-content-bg), rgba(14,165,233,0.06))'
          : lc.bg,
        boxShadow: isCenter
          ? `0 0 0 3px ${rc.glow}, var(--wc-shadow-md)`
          : `0 0 0 1px ${rc.glow}, var(--wc-shadow-sm)`,
      }}
      onClick={() => onClick?.()}
      onMouseEnter={(e) => onHover?.(e)}
      onMouseLeave={() => onLeave?.()}
    >
      <Handle type="target" position={Position.Top} className="ing-handle" />
      <Handle type="source" position={Position.Bottom} className="ing-handle" />

      <div className="ing-node-type-label">
        {isCenter ? 'CHANGE TARGET' : quantity ? `QTY ${quantity}` : 'CONNECTED'}
      </div>

      <div className="ing-node-part-number">{partNumber}</div>
      {name && <div className="ing-node-name">{name}</div>}

      <div className="ing-node-meta">
        <span
          className="ing-node-state"
          style={{ color: lc.text, background: lc.bg, borderColor: lc.border }}
        >
          {lifecycleState || 'INWORK'}
        </span>
        {riskLevel && (
          <span
            className="ing-node-risk"
            style={{ color: rc.text, background: rc.bg, borderColor: rc.edge }}
          >
            {riskScore != null ? `${riskScore}/10` : riskLevel}
          </span>
        )}
      </div>
    </div>
  );
});
ImpactNode.displayName = 'ImpactNode';

/** ── Tooltip Component ─────────────────────────────────────── */

function NodeTooltip({ node, position }) {
  if (!node) return null;
  const d = node.data || {};
  return (
    <div
      className="ing-tooltip"
      style={{ left: position.x + 14, top: position.y + 14 }}
    >
      <div className="ing-tooltip-header">{d.partNumber}</div>
      <div className="ing-tooltip-body">
        {d.name && <div>{d.name}</div>}
        <div>State: <strong>{d.lifecycleState || 'INWORK'}</strong></div>
        {d.riskScore != null && (
          <div>Risk: <strong style={{ color: RISK_COLORS[d.riskLevel]?.text }}>{d.riskScore}/10 ({d.riskLevel})</strong></div>
        )}
        {d.quantity != null && <div>Quantity: <strong>{d.quantity}</strong></div>}
      </div>
    </div>
  );
}

/** ── Detail Sidebar ────────────────────────────────────────── */

function NodeDetailSidebar({ node, onClose }) {
  if (!node) return null;
  const d = node.data || {};
  const lc = LIFECYCLE_COLORS[d.lifecycleState] || LIFECYCLE_COLORS.INWORK;
  const rc = RISK_COLORS[d.riskLevel] || RISK_COLORS.LOW;

  return (
    <div className="ing-sidebar" style={{ animation: 'ing-slide-in 0.25s var(--wc-ease-out) both' }}>
      <button className="ing-sidebar-close" onClick={onClose}>&times;</button>
      <div className="ing-sidebar-content">
        <div className="ing-sidebar-part-number">{d.partNumber}</div>
        <div className="ing-sidebar-name">{d.name || 'Unnamed Part'}</div>

        <div className="ing-sidebar-row">
          <span className="ing-sidebar-label">State</span>
          <span className="ing-sidebar-pill" style={{ color: lc.text, background: lc.bg, borderColor: lc.border }}>
            {d.lifecycleState || 'INWORK'}
          </span>
        </div>

        {d.riskScore != null && (
          <div className="ing-sidebar-row">
            <span className="ing-sidebar-label">AI Risk Score</span>
            <span className="ing-sidebar-pill" style={{ color: rc.text, background: rc.bg, borderColor: rc.edge }}>
              {d.riskScore}/10 {d.riskLevel}
            </span>
          </div>
        )}

        {d.quantity != null && (
          <div className="ing-sidebar-row">
            <span className="ing-sidebar-label">Quantity</span>
            <strong>{d.quantity} EA</strong>
          </div>
        )}

        {d.unit && (
          <div className="ing-sidebar-row">
            <span className="ing-sidebar-label">Unit</span>
            <strong>{d.unit}</strong>
          </div>
        )}

        {d.findNumber && (
          <div className="ing-sidebar-row">
            <span className="ing-sidebar-label">Find Number</span>
            <strong>{d.findNumber}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

/** ── Main Component ────────────────────────────────────────── */

const nodeTypes = { impact: ImpactNode };

const ImpactNetworkGraph = ({ part, contextId }) => {
  /* ── Data state ──────────────────────────────────────────── */
  const [bomLines, setBomLines] = useState([]);
  const [whereUsed, setWhereUsed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [riskMap, setRiskMap] = useState({});
  const [analysisDone, setAnalysisDone] = useState(false);

  /* ── Interaction state ───────────────────────────────────── */
  const [selectedNode, setSelectedNode] = useState(null);
  const [tooltip, setTooltip] = useState({ node: null, position: { x: 0, y: 0 } });

  /* Load BOM + Where Used */
  useEffect(() => {
    if (!part?.id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [bom, wu] = await Promise.all([
          plmApi.listBom(part.id).catch(() => []),
          plmApi.getWhereUsed(part.id).catch(() => []),
        ]);
        if (!cancelled) {
          setBomLines(bom || []);
          setWhereUsed(wu || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load graph data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [part?.id]);

  /* ── Build nodes & edges ─────────────────────────────────── */
  const layout = useMemo(() => {
    if (!part) return { nodes: [], edges: [] };

    const nodeW = 200;
    const nodeH = 110;
    const children = bomLines.map((line) => ({
      id: String(line.childPartId),
      partNumber: line.childPartNumber || `ID:${line.childPartId}`,
      name: line.childPartName || '',
      lifecycleState: line.childLifecycleState || 'INWORK',
      quantity: line.quantity ?? 1,
      unit: line.unit || 'EA',
      findNumber: line.findNumber,
    }));

    const parents = whereUsed.map((p) => ({
      id: String(p.id),
      partNumber: p.partNumber || `ID:${p.id}`,
      name: p.name || '',
      lifecycleState: p.lifecycleState || 'INWORK',
    }));

    const centerId = String(part.id);
    const positions = layoutRadial(
      centerId,
      children,
      parents,
      nodeW,
      nodeH,
      300,
      220,
    );

    const nodes = [
      {
        id: centerId,
        type: 'impact',
        position: positions[centerId],
        data: {
          partNumber: part.partNumber || `ID:${part.id}`,
          name: part.name || '',
          lifecycleState: part.lifecycleState || 'INWORK',
          riskLevel: riskMap[centerId]?.riskLevel || 'LOW',
          riskScore: riskMap[centerId]?.riskScore ?? null,
          isCenter: true,
          onClick: () => setSelectedNode({
            id: centerId,
            data: {
              partNumber: part.partNumber,
              name: part.name,
              lifecycleState: part.lifecycleState,
              riskLevel: riskMap[centerId]?.riskLevel,
              riskScore: riskMap[centerId]?.riskScore,
            },
          }),
          onHover: (e) => setTooltip({
            node: { data: { partNumber: part.partNumber, name: part.name, lifecycleState: part.lifecycleState, riskLevel: riskMap[centerId]?.riskLevel, riskScore: riskMap[centerId]?.riskScore } },
            position: { x: e.clientX, y: e.clientY },
          }),
          onLeave: () => setTooltip({ node: null, position: { x: 0, y: 0 } }),
        },
      },
    ];

    const edges = [];

    // Child nodes + edges
    children.forEach((child) => {
      const rid = child.id;
      const risk = riskMap[rid];
      const rLevel = risk?.riskLevel || riskLevelFromScore(risk?.riskScore) || 'LOW';
      const rc = RISK_COLORS[rLevel] || RISK_COLORS.LOW;
      const strokeWidth = Math.min(Math.max((child.quantity || 1) * 1.5, 1.5), 6);

      nodes.push({
        id: rid,
        type: 'impact',
        position: positions[rid],
        data: {
          ...child,
          riskLevel: rLevel,
          riskScore: risk?.riskScore ?? null,
          onClick: () => setSelectedNode({
            id: rid,
            data: { ...child, riskLevel: rLevel, riskScore: risk?.riskScore ?? null },
          }),
          onHover: (e) => setTooltip({
            node: { data: { ...child, riskLevel: rLevel, riskScore: risk?.riskScore ?? null } },
            position: { x: e.clientX, y: e.clientY },
          }),
          onLeave: () => setTooltip({ node: null, position: { x: 0, y: 0 } }),
        },
      });

      edges.push({
        id: `e-${centerId}-child-${rid}`,
        source: centerId,
        target: rid,
        animated: !!analysisDone,
        label: `QTY ${child.quantity ?? 1}`,
        style: { stroke: rc.edge, strokeWidth },
        labelStyle: { fill: 'var(--wc-text-muted)', fontSize: 10, fontWeight: 600 },
        labelBgStyle: { fill: 'var(--wc-content-bg)', fillOpacity: 0.9 },
        markerEnd: { type: MarkerType.ArrowClosed, color: rc.edge, width: 16, height: 16 },
      });
    });

    // Parent nodes + edges
    parents.forEach((p) => {
      const pid = p.id;
      const risk = riskMap[pid];
      const rLevel = risk?.riskLevel || riskLevelFromScore(risk?.riskScore) || 'LOW';
      const rc = RISK_COLORS[rLevel] || RISK_COLORS.LOW;

      nodes.push({
        id: pid,
        type: 'impact',
        position: positions[pid],
        data: {
          ...p,
          riskLevel: rLevel,
          riskScore: risk?.riskScore ?? null,
          onClick: () => setSelectedNode({
            id: pid,
            data: { ...p, riskLevel: rLevel, riskScore: risk?.riskScore ?? null },
          }),
          onHover: (e) => setTooltip({
            node: { data: { ...p, riskLevel: rLevel, riskScore: risk?.riskScore ?? null } },
            position: { x: e.clientX, y: e.clientY },
          }),
          onLeave: () => setTooltip({ node: null, position: { x: 0, y: 0 } }),
        },
      });

      edges.push({
        id: `e-${pid}-parent-${centerId}`,
        source: pid,
        target: centerId,
        animated: !!analysisDone,
        style: { stroke: rc.edge, strokeWidth: 2, strokeDasharray: '6 3' },
        markerEnd: { type: MarkerType.ArrowClosed, color: rc.edge, width: 16, height: 16 },
      });
    });

    return { nodes, edges };
  }, [part, bomLines, whereUsed, riskMap, analysisDone]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(layout.nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(layout.edges);

  // Sync layout changes into ReactFlow state
  useEffect(() => {
    setFlowNodes(layout.nodes);
    setFlowEdges(layout.edges);
  }, [layout, setFlowNodes, setFlowEdges]);

  /* ── Analyze Impact ───────────────────────────────────────── */
  const handleAnalyzeImpact = useCallback(async () => {
    if (!part?.id) return;
    setAnalyzing(true);
    setError(null);

    const allIds = new Set([
      String(part.id),
      ...bomLines.map((l) => String(l.childPartId)),
      ...whereUsed.map((p) => String(p.id)),
    ]);

    try {
      // Analyze center part
      const centerResult = await aiService.analyzeRisk(part.id, 'MODIFY', part.lifecycleState, bomLines.length, whereUsed.length);

      // Analyze connected parts in batches
      const connectedIds = [...allIds].filter((id) => id !== String(part.id));
      const batchSize = 5;
      const results = {};

      if (centerResult) {
        results[String(part.id)] = centerResult;
      }

      for (let i = 0; i < connectedIds.length; i += batchSize) {
        const chunk = connectedIds.slice(i, i + batchSize);
        const chunkResults = await Promise.allSettled(
          chunk.map(async (id) => {
            const r = await aiService.analyzeRisk(id, 'MODIFY', null, null, null);
            return { id, r };
          })
        );
        for (const cr of chunkResults) {
          if (cr.status === 'fulfilled' && cr.value?.r) {
            results[cr.value.id] = cr.value.r;
          }
        }
      }

      // Normalize and assign risk levels
      const normalized = {};
      for (const [id, r] of Object.entries(results)) {
        normalized[id] = {
          riskScore: r.riskScore ?? r.score ?? null,
          riskLevel: r.riskLevel || riskLevelFromScore(r.riskScore) || 'LOW',
          confidence: r.confidence ?? null,
        };
      }

      setRiskMap(normalized);
      setAnalysisDone(true);
    } catch (e) {
      setError(e.message || 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [part, bomLines, whereUsed]);

  /* ── Render guards ────────────────────────────────────────── */

  if (!part) {
    return (
      <div className="ing-wrap ing-wrap--empty">
        <div className="ing-empty-icon">&#9679;</div>
        <div className="ing-empty-title">No part selected</div>
        <div className="ing-empty-sub">Open a part to view its impact network.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ing-wrap ing-wrap--loading">
        <span className="ing-spinner" />
        Loading impact network...
      </div>
    );
  }

  if (error && bomLines.length === 0 && whereUsed.length === 0) {
    return (
      <div className="ing-wrap ing-wrap--error">
        <div className="ing-error">{error}</div>
      </div>
    );
  }

  if (bomLines.length === 0 && whereUsed.length === 0) {
    return (
      <div className="ing-wrap ing-wrap--empty">
        <div className="ing-empty-icon">&#9678;</div>
        <div className="ing-empty-title">No connections found</div>
        <div className="ing-empty-sub">
          This part has no BOM children and is not used in any parent assembly.
          Add child parts or use this part in a BOM to see the impact network.
        </div>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="ing-wrap">
      {/* Top bar */}
      <div className="ing-topbar">
        <div className="ing-topbar-info">
          <span className="ing-topbar-title">Impact Network</span>
          <span className="ing-topbar-stats">
            {bomLines.length + whereUsed.length} connections
            {analysisDone && (
              <span className="ing-topbar-badge ing-topbar-badge--analyzed">
                AI analyzed
              </span>
            )}
          </span>
        </div>

        <div className="ing-topbar-actions">
          {error && <span className="ing-topbar-error">{error}</span>}
          <button
            type="button"
            className="ing-analyze-btn"
            onClick={handleAnalyzeImpact}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <span className="ing-spinner-sm" />
                Analyzing...
              </>
            ) : analysisDone ? (
              <>Refresh Analysis</>
            ) : (
              <>Analyze Impact</>
            )}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="ing-legend">
        <span className="ing-legend-item">
          <span className="ing-legend-swatch" style={{ background: '#10B981' }} />
          Low Risk
        </span>
        <span className="ing-legend-item">
          <span className="ing-legend-swatch" style={{ background: '#F59E0B' }} />
          Medium Risk
        </span>
        <span className="ing-legend-item">
          <span className="ing-legend-swatch" style={{ background: '#EF4444' }} />
          High Risk
        </span>
        <span className="ing-legend-sep">|</span>
        <span className="ing-legend-item">
          <span className="ing-legend-swatch ing-legend-swatch--dashed" />
          Parent (where-used)
        </span>
        <span className="ing-legend-item">
          <span className="ing-legend-swatch ing-legend-swatch--solid" />
          Child (BOM)
        </span>
        <span className="ing-legend-item">
          <span className="ing-legend-swatch ing-legend-swatch--center" />
          Change Target
        </span>
      </div>

      {/* Graph */}
      <div className="ing-graph-area">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.15}
          maxZoom={2}
          attributionPosition="bottom-left"
        >
          <Background color="var(--wc-border)" gap={20} size={1} />
          <Controls
            className="ing-controls"
            style={{
              background: 'var(--wc-content-bg)',
              border: '1px solid var(--wc-border)',
              borderRadius: 'var(--wc-radius-sm)',
              boxShadow: 'var(--wc-shadow-sm)',
            }}
          />
          <MiniMap
            nodeStrokeColor="var(--wc-border)"
            nodeColor={(n) => {
              const lc = LIFECYCLE_COLORS[n.data?.lifecycleState];
              return lc?.border || 'var(--wc-border)';
            }}
            maskColor="rgba(15,23,42,0.04)"
            style={{
              background: 'var(--wc-content-bg)',
              border: '1px solid var(--wc-border)',
              borderRadius: 'var(--wc-radius-sm)',
            }}
          />
        </ReactFlow>
      </div>

      {/* Tooltip */}
      <NodeTooltip node={tooltip.node} position={tooltip.position} />

      {/* Sidebar */}
      <NodeDetailSidebar node={selectedNode} onClose={() => setSelectedNode(null)} />

      {/* Analysis info overlay */}
      {analysisDone && !selectedNode && (
        <div className="ing-analysis-banner">
          AI analysis complete. Click any node for details.
        </div>
      )}
    </div>
  );
};

export default ImpactNetworkGraph;
