import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './GlobalSearch.css';

const TYPE_CONFIG = {
  parts: {
    label: 'Parts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    getUrl: (item) => `/plm/parts/${item.id}`,
    getPrimary: (item) => item.partNumber,
    getSecondary: (item) => `${item.name || ''}  ·  ${item.lifecycleState || ''}`,
  },
  documents: {
    label: 'Documents',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    getUrl: (item) => `/plm/documents/${item.id}`,
    getPrimary: (item) => item.docNumber,
    getSecondary: (item) => `${item.name || ''}  ·  ${item.docType || ''}`,
  },
  ecrs: {
    label: 'Change Requests',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    getUrl: (item) => `/plm/changes/ecr/${item.id}`,
    getPrimary: (item) => item.changeNumber,
    getSecondary: (item) => `${item.title || ''}  ·  ${item.status || ''}`,
  },
  ecos: {
    label: 'Change Orders',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
    getUrl: (item) => `/plm/changes/eco/${item.id}`,
    getPrimary: (item) => item.ecoNumber,
    getSecondary: (item) => `${item.title || ''}  ·  ${item.state || ''}`,
  },
};

const TYPE_ORDER = ['parts', 'documents', 'ecrs', 'ecos'];

function highlightMatches(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="gs-highlight">{part}</mark> : part
  );
}

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const { selectedContextId } = useContext(PlmWorkspaceContext);
  const navigate = useNavigate();

  // Build a flat list of result items for keyboard navigation
  const flatResults = results
    ? TYPE_ORDER.flatMap((type) =>
        (results[type] || []).map((item) => ({ ...item, _type: type }))
      )
    : [];

  const doSearch = useCallback(async (keyword) => {
    if (!keyword || keyword.trim().length === 0) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await plmApi.globalSearch(keyword.trim(), selectedContextId);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [selectedContextId]);

  // Debounced search
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    setActiveIndex(-1);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  // Global keyboard shortcut: Ctrl+K / Cmd+K to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigateTo = (item) => {
    const config = TYPE_CONFIG[item._type];
    if (!config) return;
    setIsOpen(false);
    setQuery('');
    setResults(null);
    navigate(config.getUrl(item));
  };

  const handleKeyDown = (e) => {
    if (!isOpen || flatResults.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % flatResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatResults.length) {
          navigateTo(flatResults[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const hasAnyResults = results && TYPE_ORDER.some((t) => (results[t] || []).length > 0);

  return (
    <div className="gs-container" ref={containerRef}>
      <div className="gs-input-wrap">
        <svg className="gs-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="gs-input"
          placeholder="Search parts, documents, changes..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results) setIsOpen(true); }}
          aria-label="Global search"
        />
        <kbd className="gs-kbd">Ctrl+K</kbd>
      </div>

      {isOpen && (
        <div className="gs-dropdown">
          {loading && (
            <div className="gs-loading">
              <div className="wc-spinner" />
              <span>Searching...</span>
            </div>
          )}

          {!loading && results && !hasAnyResults && (
            <div className="gs-empty">
              <div className="gs-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <div className="gs-empty-title">No results for "{query}"</div>
              <div className="gs-empty-sub">Try a different keyword</div>
            </div>
          )}

          {!loading && hasAnyResults && (
            <>
              {TYPE_ORDER.map((type) => {
                const items = results[type] || [];
                if (items.length === 0) return null;
                const config = TYPE_CONFIG[type];
                return (
                  <div key={type} className="gs-group">
                    <div className="gs-group-header">
                      <span className="gs-group-icon">{config.icon}</span>
                      <span>{config.label}</span>
                      <span className="gs-group-count">{items.length}</span>
                    </div>
                    {items.map((item, idx) => {
                      const globalIdx = flatResults.findIndex(
                        (f) => f._type === type && f.id === item.id
                      );
                      return (
                        <button
                          key={`${type}-${item.id}`}
                          className={`gs-item ${globalIdx === activeIndex ? 'gs-item-active' : ''}`}
                          onClick={() => navigateTo({ ...item, _type: type })}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                        >
                          <span className="gs-item-icon">{config.icon}</span>
                          <span className="gs-item-text">
                            <span className="gs-item-primary">
                              {highlightMatches(config.getPrimary(item), query)}
                            </span>
                            <span className="gs-item-secondary">
                              {highlightMatches(config.getSecondary(item), query)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
