import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../windchill-theme.css';
import './FolderBrowserPage.css';
import plmApi from '../../services/plmApi';

const FolderNode = ({ folder, level, selectedId, onSelect, onToggle }) => {
  const indent = level * 16;
  const hasChildren = folder.children && folder.children.length > 0;
  return (
    <>
      <div
        className={`wc-folder-tree__item${selectedId === folder.id ? ' active' : ''}`}
        style={{ paddingLeft: 8 + indent }}
        onClick={() => onSelect(folder)}
      >
        <span className="wc-folder-tree__toggle" onClick={e => { e.stopPropagation(); onToggle(folder.id); }}>
          {hasChildren ? (folder.expanded ? '▼' : '▶') : ' '}
        </span>
        <span className="wc-folder-tree__icon">{folder.isRoot ? '🗄' : folder.expanded ? '📂' : '📁'}</span>
        <span className="wc-folder-tree__name" title={folder.name}>{folder.name}</span>
      </div>
      {folder.expanded && hasChildren && folder.children.map(child => (
        <FolderNode key={child.id} folder={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} />
      ))}
    </>
  );
};

const FolderBrowserPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [error, setError] = useState(null);

  const buildFolderTree = (flatList, parentId = null) => {
    return flatList
      .filter(f => f.parentId === parentId)
      .map(f => ({
        ...f,
        isRoot: parentId === null,
        expanded: parentId === null,
        children: buildFolderTree(flatList, f.id),
      }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await plmApi.getFolders();
        const tree = buildFolderTree(res.data || []);
        setFolders(tree);
        if (tree.length > 0) {
          setSelectedFolder(tree[0]);
          loadContents(tree[0].id);
        }
      } catch (e) {
        setError(e.message || 'Failed to load folders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadContents = async (folderId) => {
    try {
      setContentsLoading(true);
      const res = await plmApi.getFolderContents(folderId);
      setContents(res.data?.contents || res.data || []);
    } catch (e) {
      setContents([]);
    } finally {
      setContentsLoading(false);
    }
  };

  const handleSelectFolder = (folder) => {
    setSelectedFolder(folder);
    loadContents(folder.id);
  };

  const handleToggle = (folderId) => {
    const toggle = (nodes) => nodes.map(n => n.id === folderId
      ? { ...n, expanded: !n.expanded }
      : { ...n, children: toggle(n.children || []) });
    setFolders(prev => toggle(prev));
  };

  const handleContentClick = (item) => {
    const routes = { PART: '/plm/parts', DOCUMENT: '/plm/documents', PRODUCT: '/plm/products', PROJECT: '/plm/projects' };
    const base = routes[item.objectType] || '/plm/parts';
    navigate(`${base}/${item.id}`);
  };

  return (
    <div className="folder-page">
      <div className="wc-breadcrumb">
        <span className="wc-breadcrumb__item" onClick={() => navigate('/plm/parts')}>PLM</span>
        <span className="wc-breadcrumb__sep">›</span>
        <span className="wc-breadcrumb__current">Folder Browser</span>
        {selectedFolder && <><span className="wc-breadcrumb__sep">›</span><span className="wc-breadcrumb__current">{selectedFolder.name}</span></>}
      </div>

      <div className="wc-page-header">
        <div className="wc-page-header__title">🗄 Folder Browser</div>
      </div>

      <div className="folder-body">
        {/* Left: Folder Tree */}
        <div className="folder-tree-panel">
          <div className="folder-tree-panel__header">Cabinets & Folders</div>
          {loading && <div className="wc-spinner">Loading…</div>}
          {error && <div className="folder-error">{error}</div>}
          <div className="wc-folder-tree">
            {folders.map(f => (
              <FolderNode
                key={f.id}
                folder={f}
                level={0}
                selectedId={selectedFolder?.id}
                onSelect={handleSelectFolder}
                onToggle={handleToggle}
              />
            ))}
            {!loading && folders.length === 0 && <div className="folder-empty">No folders found.</div>}
          </div>
        </div>

        {/* Right: Contents */}
        <div className="folder-contents-panel">
          <div className="folder-contents-panel__header">
            {selectedFolder ? (
              <><span className="wc-obj-icon" style={{ background: '#fef3c7', color: '#92400e' }}>📁</span> {selectedFolder.name}</>
            ) : 'Select a folder'}
          </div>
          <div className="wc-toolbar">
            <span className="wc-toolbar__label">{contents.length} item{contents.length !== 1 ? 's' : ''}</span>
            <div className="wc-toolbar__sep" />
            <button className="wc-toolbar__btn" onClick={() => navigate('/plm/search')}>🔍 Search</button>
          </div>
          {contentsLoading && <div className="wc-spinner">Loading contents…</div>}
          {!contentsLoading && (
            <div className="wc-table-wrap">
              <table className="wc-table">
                <thead>
                  <tr>
                    <th className="wc-table__icon-col"></th>
                    <th>Type</th>
                    <th>Number</th>
                    <th>Name</th>
                    <th>State</th>
                    <th>Rev</th>
                    <th>Modified</th>
                    <th>Modified By</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.length === 0 && (
                    <tr><td colSpan={8} className="wc-table__empty">
                      <div className="wc-table__empty-icon">📁</div>
                      This folder is empty.
                    </td></tr>
                  )}
                  {contents.map((item, i) => (
                    <tr key={i} style={{ cursor: 'pointer' }} onClick={() => handleContentClick(item)}>
                      <td><span className={`wc-obj-icon wc-obj-icon--${(item.objectType || 'part').toLowerCase()}`}>{item.objectType?.charAt(0) || 'O'}</span></td>
                      <td>{item.objectType || '—'}</td>
                      <td><span className="wc-table__link">{item.partNumber || item.number || `#${item.id}`}</span></td>
                      <td title={item.name}>{item.name || '—'}</td>
                      <td>{item.lifecycleState && <span className={`wc-badge wc-badge--${item.lifecycleState.toLowerCase()}`}>{item.lifecycleState}</span>}</td>
                      <td>{item.revision || '—'}</td>
                      <td style={{ color: '#6b7280' }}>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}</td>
                      <td style={{ color: '#6b7280' }}>{item.updatedBy || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderBrowserPage;
