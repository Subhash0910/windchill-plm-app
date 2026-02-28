import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './LibraryPage.css';

const LibraryPage = () => {
  const navigate = useNavigate();
  const { setSelectedContextId } = useContext(PlmWorkspaceContext);

  const [libs,    setLibs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const all = await plmApi.listContexts();
      setLibs((all || []).filter(c => c.contextType === 'LIBRARY'));
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Failed to load libraries');
      setLibs([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openLibrary = (ctx) => {
    setSelectedContextId(ctx.id);
    navigate('/plm/parts');
  };

  return (
    <div className="lb-page">
      <div className="lb-header">
        <div>
          <h1 className="lb-title">📚 Library</h1>
          <p className="lb-sub">
            Shared PLM library contexts — reusable parts &amp; documents accessible across products
          </p>
        </div>
        <button className="lb-btn-refresh" onClick={load} disabled={loading}>
          {loading ? '↻…' : '↻ Refresh'}
        </button>
      </div>

      <div className="lb-info-banner">
        <span>ℹ️</span>
        <p>
          Libraries are shared repositories containing reusable parts, standard components, and documents.
          Create a <strong>LIBRARY</strong>-type context via{' '}
          <strong>Context → New</strong> on the left sidebar, then populate it with parts from the Workspace.
        </p>
      </div>

      {error && (
        <div className="lb-error">
          <span>⚠️</span> {error}
          <button onClick={load}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="lb-loading"><div className="lb-spinner" /><p>Loading libraries…</p></div>
      ) : libs.length === 0 ? (
        <div className="lb-empty">
          <span>📚</span>
          <h3>No library contexts yet</h3>
          <p>
            Use <strong>Context → New</strong> on the left sidebar and choose
            type <strong>LIBRARY</strong> to create one.
          </p>
        </div>
      ) : (
        <div className="lb-table">
          <div className="lb-table-head">
            <span>Type</span>
            <span>Code</span>
            <span>Name</span>
            <span>Description</span>
            <span />
          </div>
          {libs.map(lib => (
            <div className="lb-row" key={lib.id}>
              <span className="lb-type-pill">LIBRARY</span>
              <span className="lb-code">{lib.code}</span>
              <span className="lb-name">{lib.name}</span>
              <span className="lb-desc" title={lib.description}>
                {lib.description
                  ? lib.description.length > 60
                    ? lib.description.slice(0, 60) + '…'
                    : lib.description
                  : '—'}
              </span>
              <button
                className="lb-open-btn"
                onClick={() => openLibrary(lib)}
                title={`Open workspace for library: ${lib.name}`}
              >
                Open Workspace →
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="lb-count">
          {libs.length} librar{libs.length !== 1 ? 'ies' : 'y'}
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
