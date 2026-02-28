import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import './PartsTable.css';

/**
 * PartsTable
 *
 * Props:
 *   parts      - array of part objects from backend
 *   onPartDeleted(partId) - callback after delete
 *   folderMap  - { [folderId]: { id, name, path, ... } }
 *               built in PartsPage from plmApi.listFolders.
 *               Used to display the correct folder name in the FOLDER column
 *               because the backend returns folderId (Long), not folderPath.
 */
const PartsTable = ({ parts, onPartDeleted, folderMap = {} }) => {
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const visibleParts = useMemo(() => {
    const list = parts || [];
    if (showAllVersions) return list;
    // Default Windchill-like view: show latest iteration only.
    return list.filter(p => p?.isLatest === true || p?.isLatest == null);
  }, [parts, showAllVersions]);

  const hiddenCount = (parts || []).length - visibleParts.length;

  const handleDelete = async (part) => {
    const confirmed = window.confirm(
      `⚠️ DELETE PART?\n\n` +
      `Part: ${part.partNumber} (${part.name})\n` +
      `Revision: ${part.revision}.${part.iteration}\n\n` +
      `This action CANNOT be undone!\n\nClick OK to permanently delete.`
    );
    if (!confirmed) return;
    try {
      setDeleting(part.id);
      await plmApi.deletePart(part.id);
      alert(`✅ Part ${part.partNumber} deleted successfully!`);
      if (onPartDeleted) onPartDeleted(part.id);
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`❌ Failed to delete part:\n${error.response?.data?.message || error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  /**
   * Resolve folder display name for a part.
   *
   * Priority:
   *   1. part.folderPath  — if backend ever returns it directly
   *   2. folderMap[part.folderId] — resolved from parallel listFolders call
   *   3. 'Root' fallback
   */
  const getFolderDisplay = (part) => {
    // 1. Backend-provided folderPath (future-proofing)
    if (part.folderPath) {
      return part.folderPath === '/' ? 'Root' : part.folderPath;
    }
    // 2. Look up via folderMap built from listFolders
    if (part.folderId != null) {
      const folder = folderMap[part.folderId];
      if (folder) {
        return folder.path === '/' ? 'Root' : folder.name;
      }
    }
    // 3. Default
    return 'Root';
  };

  return (
    <div className="parts-table-wrap">
      <div
        className="parts-table-toolbar"
        style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}
      >
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
          {visibleParts.map(p => (
            <tr key={p.id}>
              <td className="mono">{p.partNumber}</td>
              <td>{p.name}</td>
              <td>
                <span style={{ color: '#64748b', fontSize: '0.9em' }} title={p.folderId ? `ID: ${p.folderId}` : ''}>
                  📁 {getFolderDisplay(p)}
                </span>
              </td>
              <td>{p.revision}</td>
              <td>{p.iteration}</td>
              <td>
                <span className={`pill pill-${(p.lifecycleState || '').toLowerCase()}`}>
                  {p.lifecycleState}
                </span>
              </td>
              <td style={{ textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Link className="link" to={`/plm/parts/${p.id}`}>Open</Link>
                <button
                  onClick={() => handleDelete(p)}
                  disabled={deleting === p.id}
                  className="link"
                  style={{
                    color: '#dc2626',
                    border: 'none',
                    background: 'none',
                    cursor: deleting === p.id ? 'not-allowed' : 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    fontSize: 'inherit',
                    opacity: deleting === p.id ? 0.5 : 1,
                  }}
                >
                  {deleting === p.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
          {visibleParts.length === 0 && (
            <tr>
              <td colSpan={7} className="plm-muted" style={{ padding: 12 }}>No parts.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PartsTable;
