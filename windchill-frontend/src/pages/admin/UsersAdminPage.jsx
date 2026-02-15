import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/molecules/Card/Card';
import Button from '../../components/atoms/Button/Button';
import Input from '../../components/atoms/Input/Input';
import { adminUserApi } from '../../services/adminUserApi';
import './UsersAdminPage.css';

const ROLE_OPTIONS = ['ADMIN', 'MANAGER', 'ENGINEER', 'APPROVER', 'VIEWER'];

const UsersAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'ENGINEER',
  });
  const [creating, setCreating] = useState(false);

  const sorted = useMemo(() => {
    return [...(users || [])].sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')));
  }, [users]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminUserApi.list();
      setUsers(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async () => {
    try {
      setCreating(true);
      setError(null);
      await adminUserApi.create({
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      setCreateForm({ username: '', email: '', password: '', role: 'ENGINEER' });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      setError(null);
      await adminUserApi.setActive(u.id, !u.isActive);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to update status');
    }
  };

  const resetPassword = async (u) => {
    const ok = window.confirm(`Reset password for ${u.username}? A temporary password will be generated.`);
    if (!ok) return;

    try {
      setError(null);
      const res = await adminUserApi.resetPassword(u.id, '');
      const pwd = res?.temporaryPassword;
      if (pwd) {
        window.prompt('Temporary password (copy it now):', pwd);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to reset password');
    }
  };

  return (
    <div className="admin-users">
      <div className="page-title">Admin • Users</div>
      <div className="page-sub">Create users, activate/deactivate, and reset passwords. Then add them to a Context Team.</div>

      {error && <div className="plm-error">{error}</div>}

      <Card className="admin-card">
        <div className="admin-card-title">Create user</div>
        <div className="admin-grid">
          <Input label="Username" name="username" value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })} />
          <Input label="Email" name="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
          <Input label="Password" name="password" type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
          <div>
            <div className="input-label">Role</div>
            <select className="plm-select" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="admin-actions">
            <Button variant="primary" size="sm" onClick={createUser} disabled={creating || !createForm.username.trim() || !createForm.email.trim() || !createForm.password}>
              Create
            </Button>
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>Refresh</Button>
          </div>
        </div>
      </Card>

      <Card className="admin-card" style={{ marginTop: 12 }}>
        <div className="admin-card-title">Users</div>

        {loading && <div className="plm-muted">Loading users...</div>}

        {!loading && (
          <div className="users-table">
            <div className="users-head">
              <div>Username</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            {(sorted || []).map(u => (
              <div key={u.id} className="users-row">
                <div className="mono">{u.username}</div>
                <div className="mono">{u.email}</div>
                <div className="mono">{u.role}</div>
                <div className={u.isActive ? 'ok' : 'bad'}>{u.isActive ? 'ACTIVE' : 'INACTIVE'}</div>
                <div className="row-actions">
                  <Button variant="secondary" size="sm" onClick={() => toggleActive(u)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => resetPassword(u)}>
                    Reset password
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default UsersAdminPage;
