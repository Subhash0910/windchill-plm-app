import React, { useContext, useEffect, useMemo, useState } from 'react';
import Button from '../../components/atoms/Button/Button';
import PartsTable from '../../components/plm/PartsTable';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './PartsPage.css';

const PartsPage = () => {
  const { selectedContextId, selectedFolderId, selectedFolderPath } = useContext(PlmWorkspaceContext);

  const [parts,   setParts]   = useState([]);
  const [folders, setFolders] = useState([]);   // <-- needed to resolve folderId → name
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [showAllFolders, setShowAllFolders] = useState(false);

  const [form, setForm] = useState({ partNumber: '', name: '', description: '' });

  // Build { folderId → folder } lookup for PartsTable folder column display
  const folderMap = useMemo(() => {
    const m = {};
    folders.forEach(f => { m[f.id] = f; });
    return m;
  }, [folders]);

  const load = async () => {
    if (!selectedContextId) {
      setParts([]);
      setFolders([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Fetch parts AND folders together so we can display correct folder names
      const [partsData, foldersData] = await Promise.all([
        plmApi.listParts(selectedContextId),
        plmApi.listFolders(selectedContextId),
      ]);
      setParts(partsData || []);
      setFolders(foldersData || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContextId]);

  const filtered = useMemo(() => {
    if (showAllFolders) return parts;
    if (selectedFolderId == null) return parts;
    // Use Number() cast on both sides: folderId from JSON and selectedFolderId
    // from context may differ in type if stored/retrieved via localStorage.
    return (parts || []).filter(p => Number(p.folderId) === Number(selectedFolderId));
  }, [parts, selectedFolderId, showAllFolders]);

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
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create part');
    }
  };

  const handlePartDeleted = (partId) => {
    setParts(prev => prev.filter(p => p.id !== partId));
  };

  return (
    <div>
      <div className="page-title">Parts</div>
      <div className="page-sub">
        Context-aware parts list.
        {showAllFolders ? (
          <span className="mono" style={{ color: '#667eea', fontWeight: 'bold' }}> Showing all folders</span>
        ) : (
          <span> Folder filter: <span className="mono">{selectedFolderPath || '/'}</span></span>
        )}
      </div>

      {!selectedContextId && (
        <div className="plm-muted" style={{ marginTop: 10 }}>Select a context on the left to start.</div>
      )}

      {!!selectedContextId && (
        <div className="create-box">
          <div className="create-title">Create Part (INWORK)</div>
          <div className="create-grid">
            <input
              className="plm-input"
              placeholder="Part Number"
              value={form.partNumber}
              onChange={e => setForm({ ...form, partNumber: e.target.value })}
            />
            <input
              className="plm-input"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="plm-input"
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={create}
              disabled={!form.partNumber.trim() || !form.name.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      {error   && <div className="plm-error">{error}</div>}
      {loading && <div className="plm-muted">Loading parts...</div>}

      {!!selectedContextId && !loading && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showAllFolders}
              onChange={e => setShowAllFolders(e.target.checked)}
            />
            <span style={{ fontWeight: 500 }}>Show parts from all folders</span>
            <span className="plm-muted" style={{ fontSize: '0.9em' }}>
              ({filtered.length} of {parts.length} parts)
            </span>
          </label>

          <PartsTable
            parts={filtered}
            onPartDeleted={handlePartDeleted}
            folderMap={folderMap}
          />
        </div>
      )}
    </div>
  );
};

export default PartsPage;
