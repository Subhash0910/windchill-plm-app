import React, { useState, useEffect, useContext, useCallback } from 'react';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { useAuth } from '../../hooks/useAuth';
import styles from './TeamManagementPage.module.css';

const ROLES = ['OWNER', 'APPROVER', 'MEMBER', 'VIEWER'];

const TeamManagementPage = () => {
  const { user }                                   = useAuth();
  const { selectedContextId, selectedContextName } = useContext(PlmWorkspaceContext);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
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
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>👥 Team Management</h1>
        <p className={styles.pageSub}>Manage context members and their roles</p>
      </div>

      <div className={styles.contextBanner}>
        <span className={styles.contextLabel}>Context</span>
        <span className={styles.contextName}>
          {selectedContextId ? (selectedContextName || `#${selectedContextId}`) : 'No context selected'}
        </span>
        <span className={styles.memberCount}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
      </div>

      {!selectedContextId ? (
        <div className={styles.empty}><span>🏢</span><p>Select a context from the sidebar to manage its team.</p></div>
      ) : (
        <>
          {canManage && (
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>➕ Add Member</h2>
              <form className={styles.addForm} onSubmit={handleAdd}>
                <div className={styles.field}>
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="e.g. john.doe"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.field}>
                  <label>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button className={styles.btnAdd} type="submit" disabled={adding}>
                  {adding ? 'Adding…' : 'Add Member'}
                </button>
              </form>
              {error   && <div className={`${styles.msg} ${styles.msgError}`}>{error}</div>}
              {success && <div className={`${styles.msg} ${styles.msgSuccess}`}>{success}</div>}
            </div>
          )}

          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>👥 Team Members</h2>
            {loading ? (
              <div className={styles.loading}><div className={styles.spinner} /><p>Loading members…</p></div>
            ) : members.length === 0 ? (
              <div className={styles.emptySm}>No members yet.{canManage && ' Add the first one above.'}</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th><th>Username</th><th>Name</th><th>Role</th>
                      {canManage && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => {
                      const isSelf = String(m.userId) === String(user?.id);
                      const label = m.username || `User #${m.userId}`;
                      return (
                        <tr key={m.userId} className={isSelf ? styles.rowSelf : ''}>
                          <td className={styles.id}>{m.userId}</td>
                          <td className={styles.username}>
                            {label}{isSelf && <span className={styles.you}>You</span>}
                          </td>
                          <td>{m.fullName || m.firstName || '—'}</td>
                          <td>
                            {canManage && !isSelf ? (
                              <select
                                className={styles.roleSelect}
                                value={m.role}
                                onChange={e => handleRoleChange(m.userId, e.target.value)}
                              >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            ) : (
                              <span className={styles.roleBadge}>
                                {m.role}
                              </span>
                            )}
                          </td>
                          {canManage && (
                            <td>
                              {!isSelf && (
                                <button className={styles.btnRemove} onClick={() => handleRemove(m.userId, label)}>
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
