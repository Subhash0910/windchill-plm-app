import React, { useContext, useEffect, useMemo, useState } from 'react';
import Button from '../atoms/Button/Button';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { plmApi } from '../../services/plmApi';
import './FolderTree.css';

const FolderTree = () => {
  const { selectedContextId, selectedFolderId, selectedFolderPath, setSelectedFolder } = useContext(PlmWorkspaceContext);

  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(new Set(['/'])); // Track expanded folders

  const [name, setName] = useState('');

  const load = async () => {
    if (!selectedContextId) {
      setFolders([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await plmApi.listFolders(selectedContextId);
      setFolders(data || []);
      // ensure root selected by default
      if (!selectedFolderPath && data && data.length > 0) {
        const root = data.find(f => f.path === '/');
        if (root) setSelectedFolder(root);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContextId]);

  const depth = (path) => {
    if (!path || path === '/') return 0;
    return path.split('/').filter(Boolean).length;
  };

  const getParentPath = (path) => {
    if (path === '/') return null;
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return '/';
    parts.pop();
    return parts.length === 0 ? '/' : '/' + parts.join('/');
  };

  const hasChildren = (folder) => {
    return folders.some(f => getParentPath(f.path) === folder.path);
  };

  const toggleExpand = (folder, e) => {
    e.stopPropagation();
    const newExpanded = new Set(expanded);
    if (newExpanded.has(folder.path)) {
      newExpanded.delete(folder.path);
    } else {
      newExpanded.add(folder.path);
    }
    setExpanded(newExpanded);
  };

  // Build tree structure: only show folders whose parent is expanded
  const visibleFolders = useMemo(() => {
    const sorted = [...(folders || [])].sort((a, b) => (
      (a.path || '').localeCompare(b.path || '')
    ));

    return sorted.filter(f => {
      if (f.path === '/') return true; // Root always visible
      const parent = getParentPath(f.path);
      return parent && expanded.has(parent);
    });
  }, [folders, expanded]);

  const create = async () => {
    if (!selectedContextId) return;
    try {
      setError(null);
      const parentId = selectedFolderId || null;
      await plmApi.createFolder(selectedContextId, { parentId, name });
      setName('');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create folder');
    }
  };

  return (
    <div className="plm-block">
      <div className="plm-block-header">
        <div>
          <div className="plm-block-title">Folders</div>
          <div className="plm-block-sub">Navigator</div>
        </div>
      </div>

      {!selectedContextId && <div className="plm-muted">Select a context to see folders.</div>}
      {loading && <div className="plm-muted">Loading folders...</div>}

      {!!selectedContextId && !loading && (
        <div className="folder-list">
          {visibleFolders.map(f => {
            const isExpanded = expanded.has(f.path);
            const hasKids = hasChildren(f);

            return (
              <button
                key={f.id}
                className={f.id === selectedFolderId ? 'folder-row active' : 'folder-row'}
                style={{ paddingLeft: `${10 + depth(f.path) * 14}px` }}
                onClick={() => setSelectedFolder(f)}
                title={f.path}
              >
                {hasKids ? (
                  <span
                    className="folder-icon"
                    onClick={(e) => toggleExpand(f, e)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {isExpanded ? '▾' : '▸'}
                  </span>
                ) : (
                  <span className="folder-icon" style={{ opacity: 0.3 }}>▸</span>
                )}
                <span className="folder-name">{f.path === '/' ? 'Root' : f.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {!!selectedContextId && (
        <div className="folder-create">
          <input className="plm-input" placeholder={`New folder under ${selectedFolderPath || '/'}`} value={name} onChange={e => setName(e.target.value)} />
          <Button variant="secondary" size="sm" onClick={create} disabled={!name.trim()}>
            Create
          </Button>
        </div>
      )}

      {error && <div className="plm-error">{error}</div>}
    </div>
  );
};

export default FolderTree;
