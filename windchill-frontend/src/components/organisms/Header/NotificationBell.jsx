import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../utils/api';
import './NotificationBell.css';

const TYPE_ICON = {
  WORKLIST_ASSIGNED: '📋',
  ECR_SUBMITTED:     '📝',
  ECR_APPROVED:      '✅',
  ECR_REJECTED:      '❌',
  PART_PROMOTED:     '⬆️',
  PART_REVISED:      '🔄',
  SYSTEM:            '⚙️',
};

const NotificationBell = () => {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [count,         setCount]         = useState(0);
  const [loading,       setLoading]       = useState(false);
  const dropRef = useRef(null);

  /* ── fetch unread count (mount + every 30 s) ── */
  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/notifications/count');
      // Backend returns ApiResponse<Map> → { success, data: { unreadCount: N }, message }
      const n = res.data?.data?.unreadCount ?? res.data?.unreadCount ?? 0;
      setCount(Number(n));
    } catch { /* silent */ }
  }, []);

  /* ── fetch unread list when panel opens ── */
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/notifications/unread');
      // Backend returns ApiResponse<List> → { success, data: [...], message }
      const data = res.data?.data ?? res.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  useEffect(() => { if (open) fetchList(); }, [open, fetchList]);

  /* ── close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── actions ── */
  const markRead = async (id) => {
    try {
      await api.put(`/api/v1/notifications/${id}/read`);
      setNotifications(prev => prev.filter(x => x.id !== id));
      setCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/v1/notifications/read-all');
      setNotifications([]);
      setCount(0);
    } catch { /* silent */ }
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    const wasUnread = notifications.find(x => x.id === id && !x.read);
    try {
      await api.delete(`/api/v1/notifications/${id}`);
      setNotifications(prev => prev.filter(x => x.id !== id));
      if (wasUnread) setCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="nb-wrap" ref={dropRef}>

      {/* Bell trigger */}
      <button
        className="nb-bell"
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        title="Notifications"
      >
        🔔
        {count > 0 && (
          <span className="nb-badge">{count > 99 ? '99+' : count}</span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span className="nb-title">🔔 Notifications</span>
            {notifications.length > 0 && (
              <button className="nb-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="nb-list">
            {loading ? (
              <div className="nb-empty">
                <div className="nb-spinner" />
                <p>Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="nb-empty">
                <span>🎉</span>
                <p>You're all caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`nb-item${!n.read ? ' nb-item--unread' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <span className="nb-type-icon">{TYPE_ICON[n.type] || '🔔'}</span>
                  <div className="nb-content">
                    <div className="nb-item-title">{n.title}</div>
                    {n.message && <div className="nb-item-msg">{n.message}</div>}
                    <div className="nb-item-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  <button
                    className="nb-del"
                    onClick={(e) => deleteNotif(n.id, e)}
                    title="Dismiss"
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="nb-footer">
              <span>{notifications.length} unread</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
