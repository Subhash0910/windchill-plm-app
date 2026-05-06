import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './GlobalSearchBar.css';

const TYPE_ICON = { PART: '⚙️', DOCUMENT: '📄', ECR: '📋', ECO: '🔄' };
const TYPE_COLOR = { PART: '#2563eb', DOCUMENT: '#7c3aed', ECR: '#d97706', ECO: '#059669' };

const GlobalSearchBar = () => {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [intent, setIntent]     = useState(null);
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
  const timerRef  = useRef(null);
  const navigate  = useNavigate();

  // cmd/ctrl+K to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // click-outside to close
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults(null); setIntent(null); return; }
    setLoading(true);
    try {
      const r = await api.get('/api/v1/plm/search', { params: { q } });
      const data = r.data?.data ?? {};
      setResults(data.results ?? []);
      setIntent(data.intent ?? null);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 400);
  };

  const handleSelect = (result) => {
    navigate(result.path);
    setOpen(false);
    setQuery('');
    setResults(null);
  };

  const groupedResults = results
    ? results.reduce((acc, r) => {
        if (!acc[r.type]) acc[r.type] = [];
        acc[r.type].push(r);
        return acc;
      }, {})
    : {};

  return (
    <div className="gsb-wrap" ref={wrapRef}>
      <div className={`gsb-input-row ${open ? 'gsb-focused' : ''}`}>
        <span className="gsb-icon">
          {loading
            ? <span className="gsb-spinner" />
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          }
        </span>
        <input
          ref={inputRef}
          className="gsb-input"
          placeholder='Search PLM… (⌘K)'
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className="gsb-clear" onClick={() => { setQuery(''); setResults(null); setIntent(null); }}>×</button>
        )}
      </div>

      {open && query.trim() && (
        <div className="gsb-dropdown">
          {intent && (intent.entityTypes?.length > 0 || intent.lifecycleState || intent.modifiedAfterDays) && (
            <div className="gsb-intent">
              <span className="gsb-intent-label">Understood:</span>
              {intent.entityTypes?.map(t => (
                <span key={t} className="gsb-pill" style={{ background: TYPE_COLOR[t] + '20', color: TYPE_COLOR[t] }}>{t}</span>
              ))}
              {intent.lifecycleState && (
                <span className="gsb-pill gsb-pill-gray">{intent.lifecycleState}</span>
              )}
              {intent.modifiedAfterDays && (
                <span className="gsb-pill gsb-pill-gray">last {intent.modifiedAfterDays}d</span>
              )}
            </div>
          )}

          {results === null && !loading && (
            <div className="gsb-hint">Type to search across Parts, Documents, ECRs, ECOs</div>
          )}

          {results?.length === 0 && !loading && (
            <div className="gsb-empty">No results found for "{query}"</div>
          )}

          {Object.entries(groupedResults).map(([type, items]) => (
            <div key={type} className="gsb-group">
              <div className="gsb-group-header" style={{ color: TYPE_COLOR[type] }}>
                {TYPE_ICON[type]} {type}
              </div>
              {items.map(r => (
                <button key={r.id} className="gsb-result" onClick={() => handleSelect(r)}>
                  <span className="gsb-result-number">{r.number}</span>
                  <span className="gsb-result-title">{r.title}</span>
                  {r.state && (
                    <span className="gsb-result-state">{r.state}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
