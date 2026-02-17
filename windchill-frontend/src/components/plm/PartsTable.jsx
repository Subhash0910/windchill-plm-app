import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './PartsTable.css';

const PartsTable = ({ parts }) => {
  const [showAllVersions, setShowAllVersions] = useState(false);

  const visibleParts = useMemo(() => {
    const list = parts || [];
    if (showAllVersions) return list;
    // Default Windchill-like view: show latest only.
    return list.filter(p => p?.isLatest === true || p?.isLatest === undefined || p?.isLatest === null);
  }, [parts, showAllVersions]);

  const hiddenCount = (parts || []).length - (visibleParts || []).length;

  // Helper to format folder display
  const getFolderDisplay = (part) => {
    if (!part.folderPath || part.folderPath === '/') return 'Root';
    return part.folderPath;
  };

  return (
    <div className="parts-table-wrap">
      <div className="parts-table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={showAllVersions}
            onChange={e => setShowAllVersions(e.target.checked)}
          />
          Show all versions
        </label>
        {!showAllVersions && hiddenCount > 0 && (
          <div className="plm-muted">Hiding {hiddenCount} older version(s) (latest only).</div>
        )}
      </div>

      <table className="parts-table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Name</th>
            <th>Folder</th>
            <th>Rev</th>
            <th>Iter</th>
            <th>State</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(visibleParts || []).map(p => (
            <tr key={p.id}>
              <td className="mono">{p.partNumber}</td>
              <td>{p.name}</td>
              <td>
                <span style={{ color: '#64748b', fontSize: '0.9em' }}>
                  📁 {getFolderDisplay(p)}
                </span>
              </td>
              <td>{p.revision}</td>
              <td>{p.iteration}</td>
              <td>
                <span className={`pill pill-${(p.lifecycleState || '').toLowerCase()}`}>{p.lifecycleState}</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <Link className="link" to={`/plm/parts/${p.id}`}>Open</Link>
              </td>
            </tr>
          ))}
          {(visibleParts || []).length === 0 && (
            <tr>
              <td colSpan={7} className="plm-muted" style={{ padding: 12 }}>
                No parts.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PartsTable;
