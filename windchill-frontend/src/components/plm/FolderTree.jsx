import React, { useContext, useEffect, useMemo, useState } from 'react';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { plmApi } from '../../services/plmApi';
import './FolderTree.css';

const FolderTree = () => {
  const { selectedContextId, selectedFolderId, selectedFolderPath, setSelectedFolder } =
    useContext(PlmWorkspaceContext);

  const [folders,  setFolders]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState(new Set(['/']));
  const [deleting, setDeleting] = useState(null);
  const [name,     setName]     = useState('');

  const load = async () => {
    if (!selectedContextId) { setFolders([]); return; }
    try {
      setLoading(true); setError(null);
      const data = await plmApi.listFolders(selectedContextId);
      setFolders(data || []);
      if (!selectedFolderPath && data?.length > 0) {
        const root = data.find(f => f.path === '/');
        if (root) setSelectedFolder(root);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load folders');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [selectedContextId]); // eslint-disable-line

  const depth = (path) => (!path || path === '/') ? 0 : path.split('/').filter(Boolean).length;

  const getParentPath = (path) => {
    if (path === '/') return null;
    const parts = path.split('/').filter(Boolean);
    if (!parts.length) return '/';
    parts.pop();
    return parts.length === 0 ? '/' : '/' + parts.join('/');
  };

  const hasChildren = (folder) => folders.some(f => getParentPath(f.path) === folder.path);

  const toggleExpand = (folder, e) => {
    e.stopPropagation();
    const next = new Set(expanded);
    next.has(folder.path) ? next.delete(folder.path) : next.add(folder.path);
    setExpanded(next);
  };

  const visibleFolders = useMemo(() => {
    const sorted = [...(folders || [])].sort((a, b) => (a.path || '').localeCompare(b.path || ''));
    return sorted.filter(f => {
      if (f.path === '/') return true;
      const parent = getParentPath(f.path);
      return parent && expanded.has(parent);
    });
  }, [folders, expanded]);

  const create = async () => {
    if (!selectedContextId || !name.trim()) return;
    try {
      setError(null);
      await plmApi.createFolder(selectedContextId, { parentId: selectedFolderId || null, name });
      setName('');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create folder');
    }
  };

  const deleteFolder = async (folder, e) => {
    e.stopPropagation();
    if (folder.path === '/') { alert('Cannot delete Root folder!'); return; }
    if (!window.confirm(`Delete folder "${folder.name}" and all its contents?\n\nThis cannot be undone.`)) return;
    try {
      setDeleting(folder.id); setError(null);
      await plmApi.deleteFolder(selectedContextId, folder.id);
      if (selectedFolderId === folder.id) {
        const root = folders.find(f => f.path === '/');
        if (root) setSelectedFolder(root);
      }
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete folder');
    } finally { setDeleting(null); }
  };

  return (
    <>
      {/* ── Section header ── */}
      <div className="ft-header">Folders</div>

      {/* ── Loading / empty states ── */}
      {!selectedContextId && <div className="ft-muted">Select a context first.</div>}
      {loading && <div className="ft-muted">Loading…</div>}

      {/* ── Folder rows ── */}
      {!!selectedContextId && !loading && (
        <div className="ft-list">
          {visibleFolders.map(f => {
            const isExpanded  = expanded.has(f.path);
            const hasKids     = hasChildren(f);
            const isRoot      = f.path === '/';
            const isDeleting  = deleting === f.id;
            const indentPx    = 14 + depth(f.path) * 14;

            return (
              <div
                key={f.id}
                className={`ft-row ${f.id === selectedFolderId ? 'active' : ''}`}
                style={{ paddingLeft: indentPx }}
              >
                {/* Expand/collapse toggle */}
                <span
                  className="ft-expand"
                  onClick={(e) => hasKids ? toggleExpand(f, e) : undefined}
                  style={{ cursor: hasKids ? 'pointer' : 'default' }}
                >
                  {hasKids ? (isExpanded ? '▾' : '▸') : '·'}
                </span>

                {/* Folder icon */}
                <span className="ft-icon">{isRoot ? '🗂' : '📁'}</span>

                {/* Folder name button */}
                <button className="ft-row__btn" onClick={() => setSelectedFolder(f)} title={f.path}>
                  <span className="ft-name">{isRoot ? 'Root' : f.name}</span>
                </button>

                {/* Delete (hidden until hover) */}
                {!isRoot && (
                  <button
                    className="ft-delete-btn"
                    onClick={(e) => deleteFolder(f, e)}
                    disabled={isDeleting}
                    title={`Delete ${f.name}`}
                  >
                    {isDeleting ? '…' : '×'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create folder ── */}
      {!!selectedContextId && (
        <div className="ft-create">
          <input
            className="ft-create__input"
            placeholder={`New folder under ${selectedFolderPath || '/'}`}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
          />
          <button className="ft-create__btn" onClick={create} disabled={!name.trim()}>
            Create
          </button>
        </div>
      )}

      {error && <div className="ft-error">⚠ {error}</div>}
    </>
  );
};

export default FolderTree;
