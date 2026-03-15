import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../windchill-theme.css';
import './WhereUsedPage.css';
import plmApi from '../../services/plmApi';

const WhereUsedPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [part, setPart] = useState(null);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [partRes, whereRes] = await Promise.all([
          plmApi.getPartById(id),
          plmApi.getWhereUsed(id),
        ]);
        setPart(partRes.data);
        setParents(whereRes.data || []);
      } catch (e) {
        setError(e.message || 'Failed to load where-used data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const filtered = parents.filter(p =>
    !searchTerm ||
    p.parentPart?.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.parentPart?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="whereused-page">
      <div className="wc-breadcrumb">
        <span className="wc-breadcrumb__item" onClick={() => navigate('/plm/parts')}>Parts</span>
        <span className="wc-breadcrumb__sep">›</span>
        {part && <span className="wc-breadcrumb__item" onClick={() => navigate(`/plm/parts/${id}`)}>{part.partNumber}</span>}
        <span className="wc-breadcrumb__sep">›</span>
        <span className="wc-breadcrumb__current">Where Used</span>
      </div>

      <div className="wc-page-header">
        <div>
          <div className="wc-page-header__title">
            <span className="wc-obj-icon wc-obj-icon--part">P</span>
            {part ? `${part.partNumber} — Where Used` : 'Where Used'}
          </div>
          {part && <div className="wc-page-header__subtitle">{part.name} | Rev {part.revision} | Iter {part.iteration}</div>}
        </div>
        <div className="wc-page-header__actions">
          <button className="wc-btn wc-btn--secondary wc-btn--sm" onClick={() => navigate(`/plm/bom/${id}`)}>⊞ Structure</button>
          <button className="wc-btn wc-btn--secondary wc-btn--sm" onClick={() => navigate(`/plm/parts/${id}`)}>← Part Detail</button>
        </div>
      </div>

      <div className="wc-toolbar">
        <span className="wc-toolbar__label">{filtered.length} parent assembl{filtered.length !== 1 ? 'ies' : 'y'} found</span>
      </div>

      <div className="wc-search-bar">
        <input
          className="wc-search-input"
          placeholder="Filter by parent part number or name…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm && <button className="wc-btn wc-btn--secondary wc-btn--sm" onClick={() => setSearchTerm('')}>✕ Clear</button>}
      </div>

      <div className="wc-table-wrap">
        {loading && <div className="wc-spinner">Loading where-used data…</div>}
        {error && <div className="whereused-error">⚠ {error}</div>}
        {!loading && !error && (
          <table className="wc-table">
            <thead>
              <tr>
                <th></th>
                <th>Parent Part Number</th>
                <th>Name</th>
                <th>Rev</th>
                <th>Iter</th>
                <th>State</th>
                <th>Qty Used</th>
                <th>Unit</th>
                <th>Find #</th>
                <th>Ref Desig</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="wc-table__empty">
                  <div className="wc-table__empty-icon">🔍</div>
                  This part is not used in any assembly.
                </td></tr>
              )}
              {filtered.map((entry, i) => (
                <tr key={i}>
                  <td className="wc-table__icon-col"><span className="wc-obj-icon wc-obj-icon--part">P</span></td>
                  <td>
                    <span className="wc-table__link" onClick={() => navigate(`/plm/parts/${entry.parentPart?.id}`)}>
                      {entry.parentPart?.partNumber || '—'}
                    </span>
                  </td>
                  <td title={entry.parentPart?.name}>{entry.parentPart?.name || '—'}</td>
                  <td>{entry.parentPart?.revision || 'A'}</td>
                  <td>{entry.parentPart?.iteration || 1}</td>
                  <td>
                    <span className={`wc-badge wc-badge--${(entry.parentPart?.lifecycleState || 'INWORK').toLowerCase()}`}>
                      {entry.parentPart?.lifecycleState || 'INWORK'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{entry.quantity ?? 1}</td>
                  <td>{entry.unit || 'EA'}</td>
                  <td>{entry.findNumber ?? '—'}</td>
                  <td>{entry.refDesignator || '—'}</td>
                  <td>{entry.parentPart?.contextId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WhereUsedPage;
