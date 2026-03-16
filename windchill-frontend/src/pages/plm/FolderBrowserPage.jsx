import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        <span
          className="wc-folder-tree__toggle"
          onClick={e => { e.stopPropagation(); onToggle(folder.id); }}
        >
          {hasChildren ? (folder.expanded ? '▼' : '▶') : ' '}
        </span>
        <span className="wc-folder-tree__icon">
          {folder.isContext ? '🗄' : folder.expanded ? '📂' : '📁'}
        </span>
        <span className="wc-folder-tree__name" title={folder.name}>{folder.name}</span>
      </div>
      {folder.expanded && hasChildren && folder.children.map(child => (
        <FolderNode
          key={child.id}
          folder={child}
          level={level + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </>
  );
};

const FolderBrowserPage = () => {
  const navigate = useNavigate();
  const [tree, setTree] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedContextId, setSelectedContextId] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Build a nested tree from a flat list, scoped to a context
  const buildTree = (flatFolders, contextNode) => {
    const roots = flatFolders.filter(f => !f.parentId);
    const buildChildren = (parentId) =>
      flatFolders
        .filter(f => f.parentId === parentId)
        .map(f => ({ ...f, expanded: false, children: buildChildren(f.id) }));
    return roots.map(f => ({ ...f, expanded: true, children: buildChildren(f.id) }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // 1. Load all PLM contexts (cabinets)
        const ctxRes = await plmApi.getContexts();
        const contexts = ctxRes.data?.data ?? ctxRes.data ?? [];
        if (!contexts.length) {
          setTree([]);
          return;
        }
        // 2. For each context, load its folders and build a nested tree
        const contextNodes = await Promise.all(
          contexts.map(async (ctx) => {
            try {
              const fRes = await plmApi.getFolders(ctx.id);
              const folders = fRes.data?.data ?? fRes.data ?? [];
              return {
                id: `ctx-${ctx.id}`,
                contextId: ctx.id,
                name: ctx.name,
                isContext: true,
                expanded: true,
                children: buildTree(folders, ctx),
              };
            } catch {
              return {
                id: `ctx-${ctx.id}`,
                contextId: ctx.id,
                name: ctx.name,
                isContext: true,
                expanded: true,
                children: [],
              };
            }
          })
        );
        setTree(contextNodes);
        // Auto-select first real folder if available
        const firstCtx = contextNodes[0];
        if (firstCtx?.children?.length) {
          const firstFolder = firstCtx.children[0];
          setSelectedFolder(firstFolder);
          setSelectedContextId(firstCtx.contextId);
          loadContents(firstCtx.contextId, firstFolder.id);
        }
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Failed to load folders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadContents = async (contextId, folderId) => {
    try {
      setContentsLoading(true);
      const res = await plmApi.getFolderContents(contextId, folderId);
      setContents(res.data?.data ?? res.data?.contents ?? res.data ?? []);
    } catch {
      setContents([]);
    } finally {
      setContentsLoading(false);
    }
  };

  const handleSelectFolder = (folder, contextId) => {
    if (folder.isContext) return; // clicking a cabinet header does nothing
    setSelectedFolder(folder);
    setSelectedContextId(contextId);
    loadContents(contextId, folder.id);
  };

  const handleToggle = (nodeId) => {
    const toggle = (nodes) => nodes.map(n =>
      n.id === nodeId
        ? { ...n, expanded: !n.expanded }
        : { ...n, children: toggle(n.children || []) }
    );
    setTree(prev => toggle(prev));
  };

  // Recursively render tree, passing contextId down
  const renderNode = (node, level, ctxId) => {
    const effectiveCtxId = node.isContext ? node.contextId : ctxId;
    const indent = level * 16;
    const hasChildren = node.children?.length > 0;
    const isSelected = !node.isContext && selectedFolder?.id === node.id;
    return (
      <React.Fragment key={node.id}>
        <div
          className={`wc-folder-tree__item${isSelected ? ' active' : ''}${node.isContext ? ' wc-folder-tree__item--context' : ''}`}
          style={{ paddingLeft: 8 + indent }}
          onClick={() => handleSelectFolder(node, effectiveCtxId)}
        >
          <span
            className="wc-folder-tree__toggle"
            onClick={e => { e.stopPropagation(); handleToggle(node.id); }}
          >
            {hasChildren ? (node.expanded ? '▼' : '▶') : ' '}
          </span>
          <span className="wc-folder-tree__icon">
            {node.isContext ? '🗄' : node.expanded ? '📂' : '📁'}
          </span>
          <span className="wc-folder-tree__name">{node.name}</span>
        </div>
        {node.expanded && hasChildren && node.children.map(child => renderNode(child, level + 1, effectiveCtxId))}
      </React.Fragment>
    );
  };

  const handleContentClick = (item) => {
    const routes = { PART: '/plm/parts', DOCUMENT: '/plm/documents', PRODUCT: '/plm/products' };
    navigate(`${routes[item.objectType] || '/plm/parts'}/${item.id}`);
  };

  return (
    <div className="folder-page">
      <div className="wc-breadcrumb">
        <span className="wc-breadcrumb__item" onClick={() => navigate('/plm/parts')}>PLM</span>
        <span className="wc-breadcrumb__sep">›</span>
        <span className="wc-breadcrumb__current">Folder Browser</span>
        {selectedFolder && (
          <><span className="wc-breadcrumb__sep">›</span>
          <span className="wc-breadcrumb__current">{selectedFolder.name}</span></>
        )}
      </div>

      <div className="wc-page-header">
        <div className="wc-page-header__title">Folder Browser</div>
      </div>

      <div className="folder-body">
        {/* Left: Folder Tree */}
        <div className="folder-tree-panel">
          <div className="folder-tree-panel__header">CABINETS &amp; FOLDERS</div>
          {loading && <div className="wc-spinner">Loading…</div>}
          {error && <div className="folder-error">Request failed with status code 500</div>}
          <div className="wc-folder-tree">
            {tree.map(node => renderNode(node, 0, null))}
            {!loading && !error && tree.length === 0 && (
              <div className="folder-empty">No cabinets found.</div>
            )}
          </div>
        </div>

        {/* Right: Contents */}
        <div className="folder-contents-panel">
          <div className="folder-contents-panel__header">
            {selectedFolder
              ? <><span className="wc-obj-icon" style={{ background: '#fef3c7', color: '#92400e' }}>📁</span> {selectedFolder.name}</>
              : 'Select a folder'}
          </div>
          <div className="wc-toolbar">
            <span className="wc-toolbar__label">{contents.length} item{contents.length !== 1 ? 's' : ''}</span>
            <div className="wc-toolbar__sep" />
            <button className="wc-toolbar__btn" onClick={() => navigate('/plm/search')}>Search</button>
          </div>
          {contentsLoading && <div className="wc-spinner">Loading contents…</div>}
          {!contentsLoading && (
            <div className="wc-table-wrap">
              <table className="wc-table">
                <thead>
                  <tr>
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
                    <tr><td colSpan={7} className="wc-table__empty">
                      <div className="wc-table__empty-icon">📁</div>
                      This folder is empty.
                    </td></tr>
                  )}
                  {contents.map((item, i) => (
                    <tr key={i} style={{ cursor: 'pointer' }} onClick={() => handleContentClick(item)}>
                      <td>{item.objectType || '—'}</td>
                      <td><span className="wc-table__link">{item.partNumber || item.number || `#${item.id}`}</span></td>
                      <td>{item.name || '—'}</td>
                      <td>
                        {item.lifecycleState && (
                          <span className={`wc-badge wc-badge--${item.lifecycleState.toLowerCase()}`}>
                            {item.lifecycleState}
                          </span>
                        )}
                      </td>
                      <td>{item.revision || '—'}</td>
                      <td>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}</td>
                      <td>{item.updatedBy || '—'}</td>
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
