import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentApi } from '../../services/documentApi';
import { AuthContext } from '../../context/AuthContext';
import StateBadge from '../../components/plm/StateBadge';
import './DocumentDetailPage.css';

const PROMOTE_MAP = {
  INWORK:      ['UNDERREVIEW'],
  UNDERREVIEW: ['RELEASED', 'INWORK'],
  RELEASED:    ['OBSOLETE'],
  OBSOLETE:    [],
};

const DocumentDetailPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const auth       = useContext(AuthContext);
  const username   = auth?.user?.username ?? auth?.username ?? '';

  const [doc,     setDoc]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('details');
  const [busy,    setBusy]    = useState(false);
  const [msg,     setMsg]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try   { setDoc(await documentApi.get(id)); }
    catch { setDoc(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn, label) => {
    setBusy(true); setMsg('');
    try   { await fn(); await load(); setMsg(label + ' successful.'); }
    catch (e) { setMsg(e?.response?.data?.message || label + ' failed.'); }
    finally   { setBusy(false); }
  };

  if (loading) return (
    <div className="ddp__loading"><div className="ddp__spin" /><span>Loading…</span></div>
  );
  if (!doc) return (
    <div className="ddp__err-page">
      Document not found.
      <button onClick={() => navigate(-1)}>Go back</button>
    </div>
  );

  const transitions      = PROMOTE_MAP[doc.lifecycleState] ?? [];
  const isCheckedOutByMe = doc.checkedOutBy && doc.checkedOutBy === username;
  const isCheckedOut     = !!doc.checkedOutBy;

  return (
    <div className="ddp">

      {/* ── Info header */}
      <div className="ddp__info-hdr">
        <div className="ddp__info-left">
          <p className="ddp__crumb">
            <button className="ddp__back" onClick={() => navigate('/plm/documents')}>← Documents</button>
          </p>
          <h1 className="ddp__doc-name">{doc.name}</h1>
          <div className="ddp__meta-row">
            <span className="ddp__docnum">{doc.docNumber}</span>
            <span className="ddp__ver-tag">{doc.versionLabel}</span>
            <StateBadge state={doc.lifecycleState} />
            {isCheckedOut && (
              <span className="ddp__co-banner">
                🔒 Checked out{isCheckedOutByMe ? ' by you' : ` by ${doc.checkedOutBy}`}
              </span>
            )}
          </div>
        </div>

        {/* Action toolbar */}
        <div className="ddp__actions">
          {transitions.map(t => (
            <button
              key={t}
              className="ddp__act-btn"
              disabled={busy || isCheckedOut}
              onClick={() => act(() => documentApi.promote(doc.id, t), `Promote to ${t}`)}
            >
              ➡ {t}
            </button>
          ))}
          {!isCheckedOut && (
            <button
              className="ddp__act-btn ddp__co-btn"
              disabled={busy}
              onClick={() => act(() => documentApi.checkOut(doc.id), 'Check out')}
            >🔒 Check Out</button>
          )}
          {isCheckedOutByMe && (
            <>
              <button
                className="ddp__act-btn ddp__ci-btn"
                disabled={busy}
                onClick={() => act(() => documentApi.checkIn(doc.id), 'Check in')}
              >✅ Check In</button>
              <button
                className="ddp__act-btn ddp__undo-btn"
                disabled={busy}
                onClick={() => act(() => documentApi.undoCheckOut(doc.id), 'Undo checkout')}
              >↩ Undo</button>
            </>
          )}
        </div>
      </div>

      {msg && <div className="ddp__toast">{msg}</div>}

      {/* ── Tabs */}
      <div className="ddp__tabs">
        {['details', 'related-parts'].map(t => (
          <button
            key={t}
            className={`ddp__tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'details' ? 'Details' : 'Related Parts'}
          </button>
        ))}
      </div>

      {/* ── Tab panels */}
      <div className="ddp__panel">
        {tab === 'details' && (
          <dl className="ddp__dl">
            <dt>Doc Number</dt>    <dd>{doc.docNumber}</dd>
            <dt>Name</dt>          <dd>{doc.name}</dd>
            <dt>Type</dt>          <dd>{doc.docType}</dd>
            <dt>Version</dt>       <dd>{doc.versionLabel}</dd>
            <dt>Lifecycle</dt>     <dd><StateBadge state={doc.lifecycleState} /></dd>
            <dt>Checked Out By</dt><dd>{doc.checkedOutBy || '—'}</dd>
            <dt>Description</dt>   <dd className="ddp__desc">{doc.description || '—'}</dd>
            <dt>Created By</dt>    <dd>{doc.createdBy}</dd>
            <dt>Created</dt>       <dd>{doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '—'}</dd>
            <dt>Updated By</dt>    <dd>{doc.updatedBy}</dd>
            <dt>Updated</dt>       <dd>{doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : '—'}</dd>
          </dl>
        )}
        {tab === 'related-parts' && (
          <RelatedParts docId={doc.id} />
        )}
      </div>
    </div>
  );
};

/* ── Sub-component: Related Parts tab */
const RelatedParts = ({ docId }) => {
  const navigate = useNavigate();
  const [parts,   setParts]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // GET /api/v1/plm/documents/by-doc/{docId} is not yet implemented on backend;
    // show placeholder until that endpoint is added.
    setParts([]);
    setLoading(false);
  }, [docId]);

  if (loading) return <p className="ddp__rp-hint">Loading…</p>;
  return (
    <div className="ddp__rp">
      {parts.length === 0
        ? <p className="ddp__rp-hint">No linked parts. Link a part from the Part Detail page.</p>
        : parts.map(p => (
            <div
              key={p.id}
              className="ddp__rp-item"
              onClick={() => navigate(`/plm/parts/${p.id}`)}
            >
              <strong>{p.partNumber}</strong> — {p.name}
            </div>
          ))
      }
    </div>
  );
};

export default DocumentDetailPage;
