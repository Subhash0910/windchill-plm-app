import React, { useContext, useEffect, useMemo, useState } from 'react';
import Button from '../atoms/Button/Button';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './ContextTeamPanel.css';

const ROLE_OPTIONS = ['ADMIN', 'MANAGER', 'ENGINEER', 'APPROVER', 'VIEWER'];

const ContextTeamPanel = () => {
  const { selectedContextId } = useContext(PlmWorkspaceContext);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ user: '', role: 'ENGINEER' });
  const [saving, setSaving] = useState(false);
  const [rowBusy, setRowBusy] = useState({});

  const canRender = !!selectedContextId;

  const sortedMembers = useMemo(() => {
    const list = members || [];
    return [...list].sort((a, b) => {
      const ar = String(a.role || '');
      const br = String(b.role || '');
      if (ar !== br) return ar.localeCompare(br);
      return String(a.username || '').localeCompare(String(b.username || ''));
    });
  }, [members]);

  const load = async () => {
    if (!selectedContextId) {
      setMembers([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await plmApi.listContextMembers(selectedContextId);
      setMembers(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load team');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContextId]);

  const addMember = async () => {
    if (!selectedContextId) return;
    if (!form.user.trim()) return;

    try {
      setSaving(true);
      setError(null);
      await plmApi.addContextMember(selectedContextId, {
        user: form.user.trim(),
        role: form.role,
      });
      setForm({ user: '', role: 'ENGINEER' });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (userId, role) => {
    if (!selectedContextId) return;
    if (!userId) return;

    try {
      setRowBusy(prev => ({ ...prev, [userId]: true }));
      setError(null);
      await plmApi.updateContextMemberRole(selectedContextId, userId, role);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to update role');
    } finally {
      setRowBusy(prev => ({ ...prev, [userId]: false }));
    }
  };

  const removeMember = async (userId) => {
    if (!selectedContextId) return;
    if (!userId) return;

    const ok = window.confirm('Remove this member from the context team?');
    if (!ok) return;

    try {
      setRowBusy(prev => ({ ...prev, [userId]: true }));
      setError(null);
      await plmApi.removeContextMember(selectedContextId, userId);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to remove member');
    } finally {
      setRowBusy(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="plm-block">
      <div className="plm-block-header">
        <div>
          <div className="plm-block-title">Team</div>
          <div className="plm-block-sub">Context members & roles</div>
        </div>
        <Button variant="secondary" size="sm" onClick={load} disabled={!canRender || loading}>
          Refresh
        </Button>
      </div>

      {!selectedContextId && (
        <div className="plm-muted">Select a context to view its team.</div>
      )}

      {!!selectedContextId && (
        <>
          <div className="team-add">
            <input
              className="plm-input"
              placeholder="Username or email"
              value={form.user}
              onChange={e => setForm({ ...form, user: e.target.value })}
              disabled={saving}
            />
            <select
              className="plm-select"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              disabled={saving}
            >
              {ROLE_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={addMember}
              disabled={!form.user.trim() || saving}
            >
              Add
            </Button>
          </div>

          {loading && <div className="plm-muted">Loading team...</div>}

          {!loading && (sortedMembers || []).length === 0 && (
            <div className="plm-muted">No members found.</div>
          )}

          {!loading && (sortedMembers || []).length > 0 && (
            <div className="team-list">
              {(sortedMembers || []).map(m => (
                <div key={m.userId} className="team-row">
                  <div className="team-user">
                    <div className="team-username">{m.fullName ? `${m.fullName} (${m.username})` : m.username}</div>
                    <div className="team-email">{m.email}</div>
                  </div>

                  <div className="team-role">
                    <select
                      className="plm-select"
                      value={m.role || 'VIEWER'}
                      onChange={e => updateRole(m.userId, e.target.value)}
                      disabled={!!rowBusy[m.userId]}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="team-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeMember(m.userId)}
                      disabled={!!rowBusy[m.userId]}
                      title="Remove"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="plm-muted" style={{ marginTop: 8 }}>
            If you get “Access denied”, you are not a MANAGER/ADMIN for this context.
          </div>
        </>
      )}

      {error && <div className="plm-error">{error}</div>}
    </div>
  );
};

export default ContextTeamPanel;
