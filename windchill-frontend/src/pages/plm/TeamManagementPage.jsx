import React, { useState, useEffect, useContext, useCallback } from 'react';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { useAuth } from '../../hooks/useAuth';
import './TeamManagementPage.css';

const ROLES = ['OWNER', 'APPROVER', 'MEMBER', 'VIEWER'];

const ROLE_COLORS = {
  OWNER:    { bg: '#fef3c7', text: '#92400e' },
  APPROVER: { bg: '#dbeafe', text: '#1e40af' },
  MEMBER:   { bg: '#dcfce7', text: '#166534' },
  VIEWER:   { bg: '#f1f5f9', text: '#475569' },
};

const TeamManagementPage = () => {
  const { user }                                   = useAuth();
  const { selectedContextId, selectedContextName } = useContext(PlmWorkspaceContext);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  // form now uses `username` (string) — backend DTO field is `user`
  const [form,    setForm]    = useState({ username: '', role: 'MEMBER' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const canManage = user?.role === 'ADMIN' ||
    members.some(m => String(m.userId) === String(user?.id) && m.role === 'OWNER');

  const load = useCallback(async () => {
    if (!selectedContextId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await plmApi.listContextMembers(selectedContextId);
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedContextId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) { setError('Username is required'); return; }
    setError('');
    setAdding(true);
    try {
      // Backend DTO: { user: string, role: RoleEnum }
      await plmApi.addContextMember(selectedContextId, {
        user: form.username.trim(),
        role: form.role,
      });
      setForm({ username: '', role: 'MEMBER' });
      setSuccess('Member added ✓');
      setTimeout(() => setSuccess(''), 3000);
      await load();
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await plmApi.updateContextMemberRole(selectedContextId, userId, newRole);
      setMembers(prev => prev.map(m => String(m.userId) === String(userId) ? { ...m, role: newRole } : m));
    } catch { setError('Failed to update role'); }
  };

  const handleRemove = async (userId, label) => {
    if (!window.confirm(`Remove ${label} from this context?`)) return;
    try {
      await plmApi.removeContextMember(selectedContextId, userId);
      setMembers(prev => prev.filter(m => String(m.userId) !== String(userId)));
    } catch { setError('Failed to remove member'); }
  };

  return (
    <div className="tm-page">
      <div className="tm-page-header">
        <h1 className="tm-page-title">👥 Team Management</h1>
        <p className="tm-page-sub">Manage context members and their roles</p>
      </div>

      <div className="tm-context-banner">
        <span className="tm-context-label">Context</span>
        <span className="tm-context-name">
          {selectedContextId ? (selectedContextName || `#${selectedContextId}`) : 'No context selected'}
        </span>
        <span className="tm-member-count">{members.length} member{members.length !== 1 ? 's' : ''}</span>
      </div>

      {!selectedContextId ? (
        <div className="tm-empty"><span>🏢</span><p>Select a context from the sidebar to manage its team.</p></div>
      ) : (
        <>
          {canManage && (
            <div className="tm-card">
              <h2 className="tm-section-title">➕ Add Member</h2>
              <form className="tm-add-form" onSubmit={handleAdd}>
                <div className="tm-field">
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="e.g. john.doe"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    autoComplete="off"
                  />
                </div>
                <div className="tm-field">
                  <label>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button className="tm-btn-add" type="submit" disabled={adding}>
                  {adding ? 'Adding…' : 'Add Member'}
                </button>
              </form>
              {error   && <div className="tm-msg tm-msg--error">{error}</div>}
              {success && <div className="tm-msg tm-msg--success">{success}</div>}
            </div>
          )}

          <div className="tm-card">
            <h2 className="tm-section-title">👥 Team Members</h2>
            {loading ? (
              <div className="tm-loading"><div className="tm-spinner" /><p>Loading members…</p></div>
            ) : members.length === 0 ? (
              <div className="tm-empty-sm">No members yet.{canManage && ' Add the first one above.'}</div>
            ) : (
              <div className="tm-table-wrap">
                <table className="tm-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Username</th><th>Name</th><th>Role</th>
                      {canManage && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => {
                      const isSelf = String(m.userId) === String(user?.id);
                      const c = ROLE_COLORS[m.role] || ROLE_COLORS.VIEWER;
                      const label = m.username || `User #${m.userId}`;
                      return (
                        <tr key={m.userId} className={isSelf ? 'tm-row-self' : ''}>
                          <td className="tm-id">{m.userId}</td>
                          <td className="tm-username">
                            {label}{isSelf && <span className="tm-you">You</span>}
                          </td>
                          <td>{m.fullName || m.firstName || '—'}</td>
                          <td>
                            {canManage && !isSelf ? (
                              <select
                                className="tm-role-select"
                                value={m.role}
                                style={{ background: c.bg, color: c.text }}
                                onChange={e => handleRoleChange(m.userId, e.target.value)}
                              >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            ) : (
                              <span className="tm-role-badge" style={{ background: c.bg, color: c.text }}>
                                {m.role}
                              </span>
                            )}
                          </td>
                          {canManage && (
                            <td>
                              {!isSelf && (
                                <button className="tm-btn-remove" onClick={() => handleRemove(m.userId, label)}>
                                  Remove
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeamManagementPage;
