import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../../utils/api';
import NotificationDropdown from './NotificationDropdown';
import { toast } from 'react-hot-toast';

/**
 * Notification Bell — polls backend every 30 s via the authenticated api util.
 * No raw axios, no localStorage.getItem('token') — auth is handled by api.js interceptor.
 */
const NotificationBell = () => {
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
    intervalRef.current = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/api/v1/notifications/count');
      // Backend: ApiResponse<Map> → res.data.data.unreadCount
      const count = res.data?.data?.unreadCount ?? res.data?.unreadCount ?? 0;
      setUnreadCount(Number(count));
    } catch {
      // Silent — never redirect to login on a background poll
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/v1/notifications/unread');
      const data = res.data?.data ?? res.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // Silent
    }
  };

  const handleBellClick = () => {
    const next = !showDropdown;
    setShowDropdown(next);
    if (next) fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/api/v1/notifications/${notificationId}/read`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/v1/notifications/read-all');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Mark all as read failed:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await api.delete(`/api/v1/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Delete notification failed:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

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
