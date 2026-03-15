import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../windchill-theme.css';
import './SearchPage.css';
import plmApi from '../../services/plmApi';

const TYPES = [
  { value: 'ALL',      label: 'All Types',       icon: '🔍' },
  { value: 'PART',     label: 'Part',            icon: 'P'  },
  { value: 'DOCUMENT', label: 'Document',        icon: 'D'  },
  { value: 'PRODUCT',  label: 'Product',         icon: 'PR' },
  { value: 'PROJECT',  label: 'Project',         icon: '📁' },
  { value: 'ECR',      label: 'Change Request',  icon: 'CR' },
  { value: 'ECN',      label: 'Change Notice',   icon: 'CN' },
];

const STATE_OPTIONS = ['', 'INWORK', 'UNDER_REVIEW', 'RELEASED', 'OBSOLETE', 'CANCELLED'];

const TYPE_ICON_CLASS = {
  PART: 'wc-obj-icon--part', DOCUMENT: 'wc-obj-icon--doc',
  PRODUCT: 'wc-obj-icon--product', PROJECT: 'wc-obj-icon--project',
  ECR: 'wc-obj-icon--ecr', ECN: 'wc-obj-icon--eco',
};
const TYPE_ROUTE = {
  PART: '/plm/parts', DOCUMENT: '/plm/documents',
  PRODUCT: '/plm/products', PROJECT: '/plm/projects',
  ECR: '/plm/changes', ECN: '/plm/changes',
};

const SearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery]   = useState('');
  const [type, setType]     = useState('ALL');
  const [state, setState]   = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError]       = useState(null);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await plmApi.search({ query: query.trim(), type: type !== 'ALL' ? type : undefined, state: state || undefined });
      setResults(res.data?.results || res.data || []);
      setSearched(true);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query, type, state]);

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handleResultClick = (item) => {
    const base = TYPE_ROUTE[item.objectType] || '/plm/parts';
    navigate(`${base}/${item.id}`);
  };

  const handleClear = () => { setQuery(''); setType('ALL'); setState(''); setResults([]); setSearched(false); setError(null); };

  return (
    <div className="search-page">
      <div className="wc-breadcrumb">
        <span className="wc-breadcrumb__item" onClick={() => navigate('/plm/parts')}>PLM</span>
        <span className="wc-breadcrumb__sep">›</span>
        <span className="wc-breadcrumb__current">Search</span>
      </div>

      <div className="wc-page-header">
        <div className="wc-page-header__title">🔍 Search PLM Objects</div>
      </div>

      {/* Search Form */}
      <div className="search-form-area">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-form__row">
            <input
              className="wc-search-input search-form__main-input"
              placeholder="Enter part number, name, description, or keyword…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <select className="wc-search-select" value={type} onChange={e => setType(e.target.value)}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="wc-search-select" value={state} onChange={e => setState(e.target.value)}>
              <option value="">All States</option>
              {STATE_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="wc-btn wc-btn--primary" type="submit" disabled={loading || !query.trim()}>
              {loading ? 'Searching…' : '🔍 Search'}
            </button>
            {(query || searched) && (
              <button className="wc-btn wc-btn--secondary" type="button" onClick={handleClear}>✕ Clear</button>
            )}
          </div>
        </form>

        {/* Quick-type filter chips */}
        <div className="search-type-chips">
          {TYPES.map(t => (
            <button
              key={t.value}
              className={`search-type-chip${type === t.value ? ' active' : ''}`}
              onClick={() => setType(t.value)}
              type="button"
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="wc-table-wrap">
        {loading && <div className="wc-spinner">Searching…</div>}
        {error && <div className="search-error">⚠ {error}</div>}
        {!loading && searched && (
          <>
            <div className="search-results-header">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
              {type !== 'ALL' && <> in <strong>{type}</strong></>}
              {state && <> with state <strong>{state}</strong></>}
            </div>
            <table className="wc-table">
              <thead>
                <tr>
                  <th className="wc-table__icon-col"></th>
                  <th>Type</th>
                  <th>Number / ID</th>
                  <th>Name</th>
                  <th>State</th>
                  <th>Rev</th>
                  <th>Iter</th>
                  <th>Context</th>
                  <th>Modified</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr><td colSpan={9} className="wc-table__empty">
                    <div className="wc-table__empty-icon">🔍</div>
                    No results match your search criteria.
                  </td></tr>
                )}
                {results.map((item, i) => (
                  <tr key={i} className="search-result-row" onClick={() => handleResultClick(item)} style={{ cursor: 'pointer' }}>
                    <td><span className={`wc-obj-icon ${TYPE_ICON_CLASS[item.objectType] || 'wc-obj-icon--part'}`}>{item.objectType?.charAt(0) || 'O'}</span></td>
                    <td>{item.objectType || '—'}</td>
                    <td><span className="wc-table__link">{item.number || item.partNumber || item.title || item.name || `#${item.id}`}</span></td>
                    <td title={item.name}>{item.name || '—'}</td>
                    <td>
                      {item.lifecycleState && <span className={`wc-badge wc-badge--${item.lifecycleState.toLowerCase()}`}>{item.lifecycleState}</span>}
                    </td>
                    <td>{item.revision || '—'}</td>
                    <td>{item.iteration || '—'}</td>
                    <td>{item.contextId || '—'}</td>
                    <td style={{ color: '#6b7280' }}>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {!loading && !searched && (
          <div className="search-hint">
            <div className="search-hint__icon">🔍</div>
            <div className="search-hint__title">Search across PLM objects</div>
            <div className="search-hint__text">Enter a part number, name, description or keyword above.<br />You can filter by object type and lifecycle state.</div>
            <div className="search-hint__examples">
              <strong>Examples:</strong> &nbsp;
              <span className="search-hint__chip" onClick={() => { setQuery('ENG-'); handleSearch(); }}>ENG-</span>
              <span className="search-hint__chip" onClick={() => { setQuery('housing'); handleSearch(); }}>housing</span>
              <span className="search-hint__chip" onClick={() => { setQuery('bracket'); handleSearch(); }}>bracket</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
