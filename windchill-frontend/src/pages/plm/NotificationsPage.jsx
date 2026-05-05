import React, { useState, useEffect, useCallback } from 'react';
import { plmApi } from '../../services/plmApi';
import styles from './NotificationsPage.module.css';

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
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🔔 Notifications</h1>
        <p className={styles.pageSub}>Your activity feed &amp; alerts</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {[
            { key: 'ALL',    label: `All (${notifications.length})` },
            { key: 'UNREAD', label: `Unread (${unreadCount})` },
            { key: 'READ',   label: `Read (${notifications.length - unreadCount})` },
          ].map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.active : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button className={styles.markAll} onClick={markAllRead}>
            ✓ Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🎉</span>
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
        <div className={styles.list}>
          {filtered.map(n => (
            <div
              key={n.id}
              className={`${styles.item} ${!n.read ? styles.itemUnread : ''}`}
            >
              <div className={styles.itemIcon}>
                {TYPE_ICON[n.type] || '🔔'}
              </div>
              <div className={styles.itemBody}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemTitle}>{n.title}</span>
                  <span className={styles.itemTime}>{timeAgo(n.createdAt)}</span>
                </div>
                {n.message && (
                  <p className={styles.itemMsg}>{n.message}</p>
                )}
                {n.entityNumber && (
                  <span className={styles.entityTag}>
                    {n.entityType} &middot; {n.entityNumber}
                  </span>
                )}
              </div>
              <div className={styles.itemActions}>
                {!n.read && (
                  <button
                    className={styles.btnRead}
                    onClick={() => markRead(n.id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className={styles.btnDel}
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
