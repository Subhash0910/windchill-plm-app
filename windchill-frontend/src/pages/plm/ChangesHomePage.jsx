import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { AuthContext } from '../../context/AuthContext';
import './ChangesHomePage.css';

const STATUSES = ['ALL', 'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'];

const PRIORITY_META = {
  CRITICAL: { label: 'Critical', cls: 'priority-critical' },
  HIGH:     { label: 'High',     cls: 'priority-high'     },
  NORMAL:   { label: 'Normal',   cls: 'priority-normal'   },
  LOW:      { label: 'Low',      cls: 'priority-low'      },
};

const STATUS_META = {
  DRAFT:     { label: 'Draft',      cls: 'ecr-status-draft'     },
  SUBMITTED: { label: 'Submitted',  cls: 'ecr-status-submitted' },
  IN_REVIEW: { label: 'In Review',  cls: 'ecr-status-inreview'  },
  APPROVED:  { label: 'Approved',   cls: 'ecr-status-approved'  },
  REJECTED:  { label: 'Rejected',   cls: 'ecr-status-rejected'  },
  CLOSED:    { label: 'Closed',     cls: 'ecr-status-closed'    },
};

const PriorityPill = ({ value }) => {
  const m = PRIORITY_META[value] || { label: value, cls: 'priority-normal' };
  return <span className={`priority-pill ${m.cls}`}>{m.label}</span>;
};

const StatusPill = ({ value }) => {
  const m = STATUS_META[value] || { label: value, cls: 'ecr-status-draft' };
  return <span className={`ecr-status-pill ${m.cls}`}>{m.label}</span>;
};

const EMPTY_FORM = { title: '', description: '', reason: '', priority: 'NORMAL', impactedPartIds: '' };

const ChangesHomePage = () => {
  const navigate = useNavigate();
  const { selectedContextId } = useContext(PlmWorkspaceContext);
  const { user } = useContext(AuthContext);

  const [ecrs,        setEcrs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [statusFilter,setStatusFilter]= useState('ALL');
  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState(null);
  const [parts,       setParts]       = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const status = statusFilter === 'ALL' ? undefined : statusFilter;
      const data = await plmApi.listEcrs(selectedContextId || undefined, status);
      setEcrs(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load ECRs');
    } finally { setLoading(false); }
  };

  const loadParts = async () => {
    if (!selectedContextId) return;
    try {
      const data = await plmApi.listParts(selectedContextId);
      setParts(data || []);
    } catch { setParts([]); }
  };

  useEffect(() => { load(); }, [selectedContextId, statusFilter]); // eslint-disable-line

  const openModal = () => {
    setForm(EMPTY_FORM);
    setSelectedParts([]);
    setFormError(null);
    loadParts();
    setShowModal(true);
  };

  const togglePart = (id) => {
    setSelectedParts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    if (!selectedContextId)  { setFormError('Select a context first'); return; }
    try {
      setSubmitting(true); setFormError(null);
      const body = {
        contextId:      selectedContextId,
        title:          form.title.trim(),
        description:    form.description.trim() || null,
        reason:         form.reason.trim()       || null,
        priority:       form.priority,
        impactedPartIds: selectedParts,
      };
      const ecr = await plmApi.createEcr(body);
      setShowModal(false);
      navigate(`/plm/changes/ecr/${ecr.id}`);
    } catch (e) {
      setFormError(e.response?.data?.message || e.message || 'Failed to create ECR');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="changes-page">

      {/* ── Page header ── */}
      <div className="changes-header">
        <div>
          <div className="page-title">Change Management</div>
          <div className="page-sub">Engineering Change Requests (ECR)</div>
        </div>
        <Button variant="primary" size="sm" onClick={openModal}>+ New ECR</Button>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="ecr-filter-bar">
        {STATUSES.map(s => (
          <button
            key={s}
            type="button"
            className={`ecr-filter-tab${statusFilter === s ? ' active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? 'All' : STATUS_META[s]?.label || s}
          </button>
        ))}
        <button type="button" className="ecr-filter-refresh" onClick={load} disabled={loading} title="Refresh">
          ↻
        </button>
      </div>

      {/* ── Error ── */}
      {error && <div className="plm-error" style={{ marginBottom: 12 }}>{error}</div>}

      {/* ── ECR table ── */}
      {loading ? (
        <div className="plm-muted" style={{ padding: 24 }}>Loading ECRs…</div>
      ) : ecrs.length === 0 ? (
        <div className="ecr-empty">
          <div className="ecr-empty-icon">📋</div>
          <div className="ecr-empty-title">No change requests found</div>
          <div className="ecr-empty-sub">
            {statusFilter !== 'ALL'
              ? `No ECRs with status "${STATUS_META[statusFilter]?.label || statusFilter}".`
              : 'Create your first Engineering Change Request to get started.'}
          </div>
          {statusFilter === 'ALL' && (
            <Button variant="primary" size="sm" onClick={openModal} style={{ marginTop: 12 }}>+ New ECR</Button>
          )}
        </div>
      ) : (
        <div className="ecr-table-wrap">
          <table className="ecr-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Parts</th>
                <th>Created By</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ecrs.map(ecr => (
                <tr key={ecr.id} className="ecr-row" onClick={() => navigate(`/plm/changes/ecr/${ecr.id}`)}>
                  <td className="mono">{ecr.changeNumber}</td>
                  <td className="ecr-title-cell">{ecr.title}</td>
                  <td><PriorityPill value={ecr.priority} /></td>
                  <td><StatusPill value={ecr.status} /></td>
                  <td className="ecr-part-count">{ecr.impactedPartCount ?? 0}</td>
                  <td className="mono">{ecr.createdBy}</td>
                  <td className="mono">{ecr.createdAt ? new Date(ecr.createdAt).toLocaleDateString() : '—'}</td>
                  <td><Button variant="secondary" size="sm" onClick={e => { e.stopPropagation(); navigate(`/plm/changes/ecr/${ecr.id}`); }}>Open</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create ECR Modal ── */}
      {showModal && (
        <div className="ecr-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ecr-modal" onClick={e => e.stopPropagation()}>
            <div className="ecr-modal-header">
              <div className="ecr-modal-title">New Engineering Change Request</div>
              <button type="button" className="ecr-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate} className="ecr-modal-body">
              {formError && <div className="plm-error" style={{ marginBottom: 10 }}>{formError}</div>}

              <div className="ecr-form-row">
                <label>Title <span className="ecr-required">*</span></label>
                <input
                  className="plm-input"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Brief description of the change"
                  required
                />
              </div>

              <div className="ecr-form-row">
                <label>Description</label>
                <textarea
                  className="plm-textarea"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed description of what needs to change and why"
                  rows={3}
                />
              </div>

              <div className="ecr-form-row">
                <label>Reason / Business Justification</label>
                <textarea
                  className="plm-textarea"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Why is this change necessary?"
                  rows={2}
                />
              </div>

              <div className="ecr-form-row">
                <label>Priority</label>
                <select
                  className="plm-input"
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="ecr-form-row">
                <label>Impacted Parts</label>
                {parts.length === 0 ? (
                  <div className="plm-muted">No parts in selected context.</div>
                ) : (
                  <div className="ecr-parts-picker">
                    {parts.map(p => (
                      <label key={p.id} className="ecr-part-check">
                        <input
                          type="checkbox"
                          checked={selectedParts.includes(p.id)}
                          onChange={() => togglePart(p.id)}
                        />
                        <span className="mono">{p.partNumber}</span>
                        <span className="ecr-part-name">{p.name}</span>
                        <span className={`pill pill-${(p.lifecycleState || '').toLowerCase()}`}>{p.lifecycleState}</span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedParts.length > 0 && (
                  <div className="plm-muted" style={{ marginTop: 4 }}>{selectedParts.length} part(s) selected</div>
                )}
              </div>

              <div className="ecr-modal-footer">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create ECR (DRAFT)'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangesHomePage;
