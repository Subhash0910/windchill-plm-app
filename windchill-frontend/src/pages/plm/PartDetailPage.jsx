import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import LifecycleActions from '../../components/plm/LifecycleActions';
import BomEditor from '../../components/plm/BomEditor';
import AuditPanel from '../../components/plm/AuditPanel';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './PartDetailPage.css';

const PartDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedContextId } = useContext(PlmWorkspaceContext);

  const [part, setPart] = useState(null);
  const [partsInCtx, setPartsInCtx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [edit, setEdit] = useState({ name: '', description: '' });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const p = await plmApi.getPart(id);
      setPart(p);
      setEdit({ name: p.name || '', description: p.description || '' });

      // Load parts list for BOM child picker (same context)
      const ctxId = p.contextId || selectedContextId;
      if (ctxId) {
        const list = await plmApi.listParts(ctxId);
        setPartsInCtx(list || []);
      } else {
        setPartsInCtx([]);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load part');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    if (!part) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await plmApi.updatePart(part.id, { name: edit.name, description: edit.description });
      setPart(updated);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to update part');
    } finally {
      setSaving(false);
    }
  };

  const promote = async (target) => {
    if (!part) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await plmApi.promotePart(part.id, target);
      setPart(updated);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to promote');
    } finally {
      setSaving(false);
    }
  };

  const revise = async () => {
    if (!part) return;
    try {
      setSaving(true);
      setError(null);
      const newRev = await plmApi.revisePart(part.id);
      navigate(`/plm/parts/${newRev.id}`);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to revise');
    } finally {
      setSaving(false);
    }
  };

  const childrenOptions = useMemo(() => {
    if (!part) return [];
    return (partsInCtx || []).filter(p => p.id !== part.id);
  }, [partsInCtx, part]);

  if (loading) return <div className="plm-muted">Loading part...</div>;
  if (error && !part) return <div className="plm-error">{error}</div>;
  if (!part) return <div className="plm-muted">Part not found.</div>;

  return (
    <div>
      <div className="detail-head">
        <div>
          <div className="page-title">Part</div>
          <div className="page-sub">
            <span className="mono">{part.partNumber}</span> — Rev <span className="mono">{part.revision}.{part.iteration}</span>
          </div>
        </div>
        <div className="detail-actions">
          <Button variant="secondary" size="sm" onClick={() => navigate('/plm/parts')}>Back</Button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <div className="card-title">Details</div>

          <div className="form-row">
            <label>Name</label>
            <input className="plm-input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea className="plm-textarea" value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} />
          </div>

          <div className="detail-bar">
            <LifecycleActions state={part.lifecycleState} onPromote={promote} disabled={saving} />
            <div className="revise-area">
              <Button variant="primary" size="sm" onClick={revise} disabled={saving || part.lifecycleState !== 'RELEASED'}>
                Revise
              </Button>
              <div className="hint">Revise is enabled only when RELEASED.</div>
            </div>
          </div>

          <div className="detail-save">
            <Button variant="secondary" size="sm" onClick={save} disabled={saving}>Save</Button>
          </div>

          {error && <div className="plm-error">{error}</div>}

          <BomEditor parentPartId={part.id} candidateChildren={childrenOptions} />
        </div>

        <div className="detail-card">
          <AuditPanel entityType="PART" entityId={part.id} />
        </div>
      </div>
    </div>
  );
};

export default PartDetailPage;
