import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StateBadge from './StateBadge';
import { plmApi } from '../../services/plmApi';
import './BomTreeView.css';

const RiskDot = ({ score }) => {
  if (score == null) return null;
  const cls = score >= 7 ? 'risk-high' : score >= 4 ? 'risk-med' : 'risk-low';
  return <span className={`bom-risk-dot ${cls}`} title={`AI Risk: ${score.toFixed(1)}`} />;
};

const BomRow = ({ line, depth, isLast, parentPrefix }) => {
  const navigate = useNavigate();
  const [open,     setOpen]     = useState(false);
  const [children, setChildren] = useState(null); // null = not loaded
  const [loading,  setLoading]  = useState(false);

  const part = line.childPart ?? line;
  const partId = line.childPartId ?? line.id;

  const toggle = useCallback(async () => {
    if (!open && children === null) {
      setLoading(true);
      try {
        const rows = await plmApi.listBom(partId);
        setChildren(Array.isArray(rows) ? rows : []);
      } catch {
        setChildren([]);
      } finally {
        setLoading(false);
      }
    }
    setOpen(o => !o);
  }, [open, children, partId]);

  const hasIndicator = line.childCount > 0 || (children && children.length > 0);
  const indent = depth * 24;

  const prefix = parentPrefix + (isLast ? '└─ ' : '├─ ');
  const childPrefix = parentPrefix + (isLast ? '   ' : '│  ');

  return (
    <>
      <tr className={`bom-row depth-${Math.min(depth, 5)}`}>
        <td className="bom-cell-expand" style={{ paddingLeft: indent }}>
          {hasIndicator ? (
            <button className="bom-toggle" onClick={toggle} title={open ? 'Collapse' : 'Expand'}>
              {loading ? '⋯' : open ? '▾' : '▸'}
            </button>
          ) : (
            <span className="bom-leaf">·</span>
          )}
        </td>
        <td className="bom-cell-number">
          <span className="bom-tree-prefix">{prefix}</span>
          <button
            className="bom-part-link"
            onClick={() => navigate(`/plm/parts/${partId}`)}
          >
            {part?.partNumber ?? `Part #${partId}`}
          </button>
        </td>
        <td className="bom-cell-name">{part?.name ?? '—'}</td>
        <td className="bom-cell-rev mono">{part?.revision ?? '—'}.{part?.iteration ?? 1}</td>
        <td className="bom-cell-state">
          {part?.lifecycleState && <StateBadge state={part.lifecycleState} size="sm" />}
        </td>
        <td className="bom-cell-qty mono">{line.quantity ?? 1} {line.unit ?? 'EA'}</td>
        <td className="bom-cell-fn mono">{line.findNumber ?? '—'}</td>
        <td className="bom-cell-risk">
          <RiskDot score={part?.aiRiskScore} />
        </td>
      </tr>

      {open && children && children.map((child, i) => (
        <BomRow
          key={child.id ?? i}
          line={child}
          depth={depth + 1}
          isLast={i === children.length - 1}
          parentPrefix={childPrefix}
        />
      ))}
    </>
  );
};

const BomTreeView = ({ rootPartId }) => {
  const [topLevel, setTopLevel] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!rootPartId) return;
    setLoading(true);
    plmApi.listBom(rootPartId)
      .then(rows => setTopLevel(Array.isArray(rows) ? rows : []))
      .catch(() => setError('Failed to load BOM'))
      .finally(() => setLoading(false));
  }, [rootPartId]);

  if (loading) return <div className="bom-tree-loading">Loading BOM structure…</div>;
  if (error)   return <div className="bom-tree-error">{error}</div>;
  if (topLevel.length === 0) return (
    <div className="bom-tree-empty">
      <span>No BOM lines defined for this part.</span>
    </div>
  );

  return (
    <div className="bom-tree-wrap">
      <table className="bom-tree-table">
        <thead>
          <tr>
            <th style={{ width: 32 }} />
            <th>Part Number</th>
            <th>Name</th>
            <th>Rev</th>
            <th>State</th>
            <th>Qty</th>
            <th>Find#</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {topLevel.map((line, i) => (
            <BomRow
              key={line.id ?? i}
              line={line}
              depth={0}
              isLast={i === topLevel.length - 1}
              parentPrefix=""
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BomTreeView;
