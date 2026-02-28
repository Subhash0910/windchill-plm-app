import React, { useState, useEffect, useCallback } from 'react';
import { plmApi } from '../../services/plmApi';
import './NotificationsPage.css';

const TYPE_ICON = {
  WORKLIST_ASSIGNED: '📋',
  ECR_SUBMITTED:     '📝',
  ECR_APPROVED:      '✅',
  ECR_REJECTED:      '❌',
  PART_PROMOTED:     '⬆️',
  PART_REVISED:      '🔄',
  SYSTEM:            '⚙️',
  INFO:              'ℹ️',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await plmApi.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    try {
      await plmApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await plmApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const deleteNotif = async (id) => {
    try {
      await plmApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'READ')   return  n.read;
    return true;
  });

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="np-page">

      {/* Page title — PlmLayout already renders the app header above */}
      <div className="np-page-header">
        <h1 className="np-page-title">🔔 Notifications</h1>
        <p className="np-page-sub">Your activity feed &amp; alerts</p>
      </div>

      {/* Toolbar */}
      <div className="np-toolbar">
        <div className="np-filters">
          {[
            { key: 'ALL',    label: `All (${notifications.length})` },
            { key: 'UNREAD', label: `Unread (${unreadCount})` },
            { key: 'READ',   label: `Read (${notifications.length - unreadCount})` },
          ].map(f => (
            <button
              key={f.key}
              className={`np-filter-btn${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button className="np-mark-all" onClick={markAllRead}>
            ✓ Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="np-loading">
          <div className="np-spinner" />
          <p>Loading notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="np-empty">
          <span className="np-empty-icon">🎉</span>
          <h3>All caught up!</h3>
          <p>
            {filter === 'UNREAD'
              ? 'No unread notifications.'
              : filter === 'READ'
              ? 'No read notifications yet.'
              : 'No notifications yet.'}
          </p>
        </div>
      ) : (
        <div className="np-list">
          {filtered.map(n => (
            <div
              key={n.id}
              className={`np-item${!n.read ? ' np-item--unread' : ''}`}
            >
              <div className="np-item-icon">
                {TYPE_ICON[n.type] || '🔔'}
              </div>
              <div className="np-item-body">
                <div className="np-item-header">
                  <span className="np-item-title">{n.title}</span>
                  <span className="np-item-time">{timeAgo(n.createdAt)}</span>
                </div>
                {n.message && (
                  <p className="np-item-msg">{n.message}</p>
                )}
                {n.entityNumber && (
                  <span className="np-entity-tag">
                    {n.entityType} &middot; {n.entityNumber}
                  </span>
                )}
              </div>
              <div className="np-item-actions">
                {!n.read && (
                  <button
                    className="np-btn-read"
                    onClick={() => markRead(n.id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="np-btn-del"
                  onClick={() => deleteNotif(n.id)}
                  title="Delete"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
