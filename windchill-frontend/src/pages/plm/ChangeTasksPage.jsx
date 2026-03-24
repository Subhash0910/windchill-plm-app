import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';

const NOTICE_STATUS_META = {
  OPEN:     { label: 'Open',     bg: '#dbeafe', color: '#1d4ed8' },
  RELEASED: { label: 'Released', bg: '#dcfce7', color: '#166534' },
  OBSOLETE: { label: 'Obsolete', bg: '#e5e7eb', color: '#6b7280' },
};

const NoticeStatusPill = ({ value }) => {
  const m = NOTICE_STATUS_META[value] || { label: value, bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 999,
      fontSize: 11, fontWeight: 700,
      background: m.bg, color: m.color,
    }}>{m.label}</span>
  );
};

const ChangeTasksPage = () => {
  const navigate = useNavigate();
  const { selectedContextId } = useContext(PlmWorkspaceContext);

  const [notices,  setNotices]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [releasing,setReleasing]= useState(null); // noticeId being released

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const data = await plmApi.listEcns(selectedContextId || undefined);
      setNotices(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load ECNs');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [selectedContextId]); // eslint-disable-line

  const release = async (noticeId) => {
    try {
      setReleasing(noticeId); setError(null);
      const released = await plmApi.releaseEcn(noticeId);
      setNotices(prev => prev.map(n => n.id === noticeId ? released : n));
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to release ECN');
    } finally { setReleasing(null); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="page-title">Change Management</div>
          <div className="page-sub">Engineering Change Notices (ECN)</div>
        </div>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>↻ Refresh</Button>
      </div>

      {error && <div className="plm-error" style={{ marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div className="plm-muted">Loading ECNs…</div>
      ) : notices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📢</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No Change Notices yet</div>
          <div style={{ fontSize: 13 }}>ECNs are auto-created when an ECR is approved.</div>
          <Button variant="secondary" size="sm" style={{ marginTop: 12 }} onClick={() => navigate('/plm/changes')}>
            View ECRs
          </Button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="ecr-order-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>ECN Number</th>
                <th>Title</th>
                <th>Status</th>
                <th>ECR</th>
                <th>Created By</th>
                <th>Created</th>
                <th>Released By</th>
                <th>Released At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {notices.map(n => (
                <tr key={n.id}>
                  <td className="mono" style={{ fontWeight: 700 }}>{n.noticeNumber}</td>
                  <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</td>
                  <td><NoticeStatusPill value={n.status} /></td>
                  <td>
                    {n.changeRequestId && (
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#0f4d6d', cursor: 'pointer', fontWeight: 700, padding: 0, fontFamily: 'Courier New, monospace', fontSize: 12 }}
                        onClick={() => navigate(`/plm/changes/ecr/${n.changeRequestId}`)}
                      >
                        {n.changeRequestNumber || `#${n.changeRequestId}`}
                      </button>
                    )}
                  </td>
                  <td className="mono">{n.createdBy}</td>
                  <td className="mono">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="mono">{n.releasedBy || '—'}</td>
                  <td className="mono">{n.releasedAt ? new Date(n.releasedAt).toLocaleDateString() : '—'}</td>
                  <td style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/plm/changes/ecr/${n.changeRequestId}`)}>View ECR</Button>
                    {n.status === 'OPEN' && (
                      <Button variant="primary" size="sm" onClick={() => release(n.id)} disabled={releasing === n.id}>
                        {releasing === n.id ? 'Releasing…' : '📢 Release'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChangeTasksPage;
