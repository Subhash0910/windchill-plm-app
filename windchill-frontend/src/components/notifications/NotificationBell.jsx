import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import axios from 'axios';
import { useWebSocket } from '../../hooks/useWebSocket';
import NotificationDropdown from './NotificationDropdown';
import { toast } from 'react-hot-toast';

/**
 * Notification Bell Component
 * Shows unread count and dropdown
 */
const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch initial unread count
  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, []);

  // WebSocket connection
  const { connected } = useWebSocket(
    (notification) => {
      // New notification received
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast.success(notification.title, {
        duration: 4000,
        icon: '🔔',
      });
    },
    (count) => {
      // Unread count updated
      setUnreadCount(count);
    }
  );

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/notifications/count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/notifications/unread', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/v1/notifications/${notificationId}/read`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/v1/notifications/read-all', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection Status */}
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
        />
      )}
    </div>
  );
};

export default NotificationBell;
