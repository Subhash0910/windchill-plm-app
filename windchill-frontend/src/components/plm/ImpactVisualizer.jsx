import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, MarkerType, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './ImpactVisualizer.css';
import StateBadge from './StateBadge';

const CustomNode = ({ data }) => {
  const isTarget = data.isTarget;
  return (
    <div className={`impact-node ${isTarget ? 'is-target' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ background: '#94A3B8' }} />
      <div className="impact-node-header">{data.partNumber}</div>
      <div className="impact-node-title">{data.name}</div>
      <StateBadge state={data.state} size="sm" />
      <div className="impact-node-footer">
        <span style={{ fontSize: 11, color: '#64748B' }}>AI Risk:</span>
        <span className={`ai-risk-${data.riskLevel || 'low'}`}>
          {data.riskScore || 'Low'}
        </span>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#94A3B8' }} />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const ImpactVisualizer = ({ part, whereUsed = [] }) => {
  const { nodes, edges } = useMemo(() => {
    if (!part) return { nodes: [], edges: [] };

    const initialNodes = [
      {
        id: part.id.toString(),
        type: 'custom',
        position: { x: 50, y: 150 },
        data: {
          partNumber: part.partNumber,
          name: part.name,
          state: part.lifecycleState,
          isTarget: true,
          riskLevel: 'low',
          riskScore: '0%'
        }
      }
    ];

    const initialEdges = [];

    // Layout the parents to the right
    whereUsed.forEach((parent, index) => {
      const parentId = parent.id.toString();
      // Calculate risk heuristically for demo, or read from parent
      // A parent that is released might have high risk if changed
      const isReleased = parent.lifecycleState === 'RELEASED';
      const riskLvl = isReleased ? 'high' : 'medium';
      const riskScore = isReleased ? '85%' : '40%';

      initialNodes.push({
        id: parentId,
        type: 'custom',
        position: { x: 350, y: 50 + (index * 120) },
        data: {
          partNumber: parent.partNumber,
          name: parent.name,
          state: parent.lifecycleState,
          riskLevel: riskLvl,
          riskScore: riskScore
        }
      });

      initialEdges.push({
        id: `e-${part.id}-${parentId}`,
        source: part.id.toString(),
        target: parentId,
        animated: true,
        style: { stroke: isReleased ? '#ef4444' : '#94A3B8', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isReleased ? '#ef4444' : '#94A3B8',
        },
      });
    });

    return { nodes: initialNodes, edges: initialEdges };
  }, [part, whereUsed]);

  if (!part) return null;

  return (
    <div className="impact-visualizer-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#CBD5E1" gap={16} />
        <Controls />
      </ReactFlow>
      {whereUsed.length > 0 && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.9)', 
            padding: '8px 12px', 
            borderRadius: '6px',
            border: '1px solid var(--wc-border)',
            boxShadow: 'var(--wc-shadow-sm)',
            fontSize: 12,
            fontFamily: 'var(--wc-font)'
          }}>
            <strong>AI Insight:</strong> {whereUsed.filter(p => p.lifecycleState === 'RELEASED').length} upstream assemblies are locked (RELEASED). Changing this part requires a new ECO.
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactVisualizer;
