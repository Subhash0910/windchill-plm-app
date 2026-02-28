import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import api from '../../utils/api';          // ← uses getToken() → sessionStorage 'auth_token'
import { useWebSocket } from '../../hooks/useWebSocket';
import NotificationDropdown from './NotificationDropdown';
import { toast } from 'react-hot-toast';

/**
 * NotificationBell
 *
 * FIX: Replaced raw axios + localStorage.getItem('token') with the shared
 * api util which reads the correct sessionStorage key ('auth_token').
 * The old code sent 'Bearer null' → backend 401 → interceptor redirected to /login.
 *
 * Response format: backend returns { success, message, data: { unreadCount } }
 * api util returns the full axios response, so we read res.data.data.
 */
const NotificationBell = () => {
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown,  setShowDropdown]  = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/notifications/count');
      setUnreadCount(res.data?.data?.unreadCount ?? 0);
    } catch {
      // silent — bell must never crash the app
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/notifications/unread');
      setNotifications(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
    // Poll every 30 s as a fallback when WebSocket is unavailable
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchNotifications]);

  // Real-time via WebSocket (gracefully degrades to polling if WS not available)
  const { connected } = useWebSocket(
    (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.success(notification.title, { duration: 4000, icon: '\uD83D\uDD14' });
    },
    (count) => setUnreadCount(count)
  );

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/api/v1/notifications/${notificationId}/read`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await api.put('/api/v1/notifications/read-all');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
    }
  }, []);

  const handleDelete = useCallback(async (notificationId) => {
    try {
      await api.delete(`/api/v1/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  }, []);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(prev => !prev)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-6 h-6" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Green dot = WebSocket live */}
        {connected && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setShowDropdown(false)}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default NotificationBell;
