import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './ChangesHomePage.css';

const STATUS = ['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];

const ChangesHomePage = () => {
  const navigate = useNavigate();
  const { selectedContextId } = useContext(PlmWorkspaceContext);

  // Open by ID (debug)
  const [ecrId, setEcrId] = useState('');

  // Create draft
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parts, setParts] = useState([]);
  const [partId, setPartId] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // List
  const [status, setStatus] = useState('ALL');
  const [ecrs, setEcrs] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const [error, setError] = useState('');

  const canOpen = useMemo(() => {
    const t = String(ecrId || '').trim();
    return /^\d+$/.test(t);
  }, [ecrId]);

  const open = () => {
    const t = String(ecrId || '').trim();
    if (!/^\d+$/.test(t)) return;
    navigate(`/plm/changes/ecr/${t}`);
  };

  const loadParts = async () => {
    setError('');
    if (!selectedContextId) {
      setParts([]);
      setPartId('');
      return;
    }
    try {
      const p = await plmApi.listParts(selectedContextId);
      setParts(Array.isArray(p) ? p : []);
      // keep selection if still valid
      if (p && partId && !p.some((x) => String(x.id) === String(partId))) {
        setPartId('');
      }
    } catch (e) {
      setParts([]);
      setPartId('');
      setError(e?.message || e?.response?.data?.message || 'Failed to load parts');
    }
  };

  const loadEcrs = async () => {
    setListLoading(true);
    setError('');
    try {
      const st = status === 'ALL' ? null : status;
      const res = await plmApi.listEcrs(st);
      setEcrs(Array.isArray(res) ? res : []);
    } catch (e) {
      setEcrs([]);
      setError(e?.message || e?.response?.data?.message || 'Failed to load ECRs');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContextId]);

  useEffect(() => {
    loadEcrs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const createDraft = async () => {
    const t = String(title || '').trim();
    if (!t) {
      setError('Title is required');
      return;
    }
    if (!partId) {
      setError('Select a Part to create an ECR');
      return;
    }

    setCreateLoading(true);
    setError('');
    try {
      const created = await plmApi.createEcr({
        title: t,
        description: description || '',
        contextType: 'PART',
        contextId: String(partId),
      });
      if (created?.id) {
        navigate(`/plm/changes/ecr/${created.id}`);
      } else {
        setError('ECR created but response did not include id');
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to create ECR');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="chg-home">
      <div className="chg-head">
        <div>
          <div className="chg-title">Changes</div>
          <div className="chg-sub">Create ECRs, route reviews, and track impact like Windchill.</div>
        </div>

        <div className="chg-actions">
          <Button variant="secondary" size="sm" onClick={loadEcrs} disabled={listLoading}>Refresh list</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/changes/tasks')}>My change tasks</Button>
        </div>
      </div>

      {error ? <div className="plm-error">{error}</div> : null}

      <div className="chg-split">
        <div className="chg-card">
          <div className="chg-card-title">Create draft ECR</div>
          <div className="plm-muted" style={{ marginBottom: 10 }}>
            Uses your selected workspace context. Pick a Part and describe the change.
          </div>

          <div className="chg-form">
            <div className="chg-field">
              <label>Title</label>
              <input className="plm-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Reduce bracket thickness" />
            </div>

            <div className="chg-field">
              <label>Description</label>
              <textarea className="plm-input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why are we changing this? What is the expected impact?" />
            </div>

            <div className="chg-field">
              <label>Part (context)</label>
              <select className="plm-input" value={partId} onChange={(e) => setPartId(e.target.value)}>
                <option value="">Select a part…</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>{p.number ? `${p.number} - ${p.name}` : `${p.id} - ${p.name}`}</option>
                ))}
              </select>
              {!selectedContextId ? (
                <div className="chg-hint">Select a context in the left panel first.</div>
              ) : null}
            </div>

            <div className="chg-actions">
              <Button variant="primary" size="sm" onClick={createDraft} disabled={createLoading}>
                {createLoading ? 'Creating…' : 'Create draft'}
              </Button>
            </div>
          </div>
        </div>

        <div className="chg-card">
          <div className="chg-card-title">Browse ECRs</div>

          <div className="chg-row" style={{ marginBottom: 10 }}>
            <div className="chg-field">
              <label>Status</label>
              <select className="plm-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="chg-field">
              <label>Open by ECR ID (debug)</label>
              <input
                className="plm-input"
                placeholder="Example: 12"
                value={ecrId}
                onChange={(e) => setEcrId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') open();
                }}
              />
              <div className="chg-hint">Numeric database ID (same value used in APIs).</div>
            </div>
          </div>

          <div className="chg-actions" style={{ marginBottom: 10 }}>
            <Button variant="secondary" size="sm" onClick={open} disabled={!canOpen}>Open</Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="chg-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Number</th>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Context</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ecrs.map((e) => (
                  <tr key={e.id}>
                    <td className="mono">{e.id}</td>
                    <td className="mono">{e.number || '-'}</td>
                    <td><span className="chg-pill">{e.status || '-'}</span></td>
                    <td>{e.title || '-'}</td>
                    <td className="mono">{e.contextType || '-'}{e.contextId ? `(${e.contextId})` : ''}</td>
                    <td className="mono">{e.updatedAt ? String(e.updatedAt) : '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/changes/ecr/${e.id}`)}>Open</Button>
                    </td>
                  </tr>
                ))}
                {ecrs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="plm-muted" style={{ padding: 12 }}>{listLoading ? 'Loading…' : 'No ECRs found.'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="chg-card" style={{ marginTop: 12 }}>
        <div className="chg-card-title">AI where it matters</div>
        <div className="chg-list">
          <div>On submit: impact analysis + similarity evidence + routing decision (audited).</div>
          <div>In review: reviewers see why risk is high and what is impacted.</div>
        </div>
      </div>
    </div>
  );
};

export default ChangesHomePage;
