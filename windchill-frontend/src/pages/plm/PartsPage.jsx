import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../../components/atoms/Button/Button';
import PartsTable from '../../components/plm/PartsTable';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './PartsPage.css';

const LC_STATES = ['ALL', 'INWORK', 'UNDER_REVIEW', 'RELEASED', 'OBSOLETE', 'SUPERSEDED'];
const LC_COLORS = {
  INWORK:       { bg: '#f1f5f9', text: '#475569' },
  UNDER_REVIEW: { bg: '#fef3c7', text: '#92400e' },
  RELEASED:     { bg: '#dcfce7', text: '#166534' },
  OBSOLETE:     { bg: '#fee2e2', text: '#991b1b' },
  SUPERSEDED:   { bg: '#ede9fe', text: '#5b21b6' },
};

const folderLabel = (path) => {
  if (!path || path === '/') return 'Root';
  const segs = path.split('/').filter(Boolean);
  return segs[segs.length - 1] || 'Root';
};

const PartsPage = () => {
  const { selectedContextId, selectedFolderId, selectedFolderPath } = useContext(PlmWorkspaceContext);

  const [parts,          setParts]          = useState([]);
  const [folders,        setFolders]        = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [showAllFolders, setShowAllFolders] = useState(false);
  const [search,         setSearch]         = useState('');
  const [searching,      setSearching]      = useState(false);
  const [lcFilter,       setLcFilter]       = useState('ALL');
  const [form,           setForm]           = useState({ partNumber: '', name: '', description: '' });

  const searchTimer = useRef(null);

  const folderMap = useMemo(() => {
    const m = {};
    folders.forEach(f => { m[f.id] = f; });
    return m;
  }, [folders]);

  const load = useCallback(async () => {
    if (!selectedContextId) { setParts([]); setFolders([]); return; }
    try {
      setLoading(true); setError(null);
      const [pd, fd] = await Promise.all([
        plmApi.listParts(selectedContextId),
        plmApi.listFolders(selectedContextId),
      ]);
      setParts(pd || []);
      setFolders(fd || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load parts');
    } finally { setLoading(false); }
  }, [selectedContextId]);

  useEffect(() => { load(); }, [load]);

  // Debounced server-side search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!selectedContextId) return;
    if (!search.trim()) { load(); return; }
    if (search.trim().length < 2) return;
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await plmApi.searchParts(search.trim(), selectedContextId);
        setParts(res || []);
      } catch { /* keep current list */ }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedContextId]);

  const filtered = useMemo(() => {
    let list = parts;
    if (!showAllFolders && selectedFolderId != null)
      list = list.filter(p => Number(p.folderId) === Number(selectedFolderId));
    if (lcFilter !== 'ALL')
      list = list.filter(p => p.lifecycleState === lcFilter);
    return list;
  }, [parts, selectedFolderId, showAllFolders, lcFilter]);

  const create = async () => {
    if (!selectedContextId) return;
    try {
      setError(null);
      await plmApi.createPart({
        contextId:   selectedContextId,
        folderId:    selectedFolderId ?? null,
        partNumber:  form.partNumber,
        name:        form.name,
        description: form.description,
      });
      setForm({ partNumber: '', name: '', description: '' });
      setSearch('');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create part');
    }
  };

  const handlePartDeleted = (id) => setParts(prev => prev.filter(p => p.id !== id));

  const activeFolderName = folderLabel(selectedFolderPath);
  const isNonRoot        = selectedFolderPath && selectedFolderPath !== '/';
  const isSearchMode     = search.trim().length >= 2;

  return (
    <div className="pp-page">
      {/* Header */}
      <div className="pp-header">
        <div>
          <h1 className="pp-title">Parts Workspace</h1>
          <p className="pp-sub">
            {isSearchMode
              ? `🔍 Search results for “${search}”`
              : showAllFolders
                ? 'Showing all folders'
                : `Folder: ${selectedFolderPath || '/'}`}
          </p>
        </div>
        {!selectedContextId && (
          <div className="pp-no-ctx">⚠️ Select a context on the left to start</div>
        )}
      </div>

      {!!selectedContextId && (
        <>
          {/* Toolbar: search + lifecycle chips */}
          <div className="pp-toolbar">
            <div className="pp-search-wrap">
              <span className="pp-search-icon">🔍</span>
              <input
                className="pp-search"
                placeholder="Search by part number, name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {searching && <span className="pp-search-spin" />}
              {search && !searching && (
                <button className="pp-search-clear" onClick={() => { setSearch(''); load(); }}>&times;</button>
              )}
            </div>
            <div className="pp-chips">
              {LC_STATES.map(s => {
                const c = s !== 'ALL' ? LC_COLORS[s] : null;
                const active = lcFilter === s;
                return (
                  <button
                    key={s}
                    className={`pp-chip ${active ? 'pp-chip--active' : ''}`}
                    style={active && c ? { background: c.bg, color: c.text, borderColor: `${c.text}55` } : {}}
                    onClick={() => setLcFilter(s)}
                  >
                    {s === 'ALL' ? 'All States' : s.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create Part */}
          <div className="pp-create">
            <div className="pp-create-label">
              <span>+ New Part</span>
              <span className={`pp-folder-tag ${isNonRoot ? 'pp-folder-tag--sub' : ''}`}>📁 {activeFolderName}</span>
              <span className="pp-state-tag">INWORK</span>
            </div>
            <div className="pp-create-row">
              <input className="pp-input" placeholder="Part Number *" value={form.partNumber} onChange={e => setForm({...form, partNumber: e.target.value})} />
              <input className="pp-input" placeholder="Name *"         value={form.name}       onChange={e => setForm({...form, name: e.target.value})} />
              <input className="pp-input pp-input--wide" placeholder="Description (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <Button variant="secondary" size="sm" onClick={create} disabled={!form.partNumber.trim() || !form.name.trim()}>Create</Button>
            </div>
          </div>
        </>
      )}

      {error && <div className="pp-error">{error}</div>}

      {!!selectedContextId && (
        <div className="pp-list">
          <div className="pp-list-bar">
            <label className="pp-all-toggle">
              <input type="checkbox" checked={showAllFolders} onChange={e => setShowAllFolders(e.target.checked)} />
              Show all folders
            </label>
            <span className="pp-result-count">
              {isSearchMode
                ? `🔍 ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
                : `${filtered.length} / ${parts.length} parts`}
            </span>
          </div>

          {loading ? (
            <div className="pp-state-box"><div className="pp-spinner" /><p>Loading parts…</p></div>
          ) : filtered.length === 0 ? (
            <div className="pp-empty">
              <span>{isSearchMode ? '🔍' : '🔩'}</span>
              <p>{isSearchMode
                ? `No parts match “${search}”`
                : lcFilter !== 'ALL'
                  ? `No ${lcFilter.replace('_',' ')} parts in this view`
                  : 'No parts here — create one above'}
              </p>
            </div>
          ) : (
            <PartsTable parts={filtered} onPartDeleted={handlePartDeleted} folderMap={folderMap} />
          )}
        </div>
      )}
    </div>
  );
};

export default PartsPage;
