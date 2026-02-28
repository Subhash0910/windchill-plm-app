import React from 'react';
import { X, Check, Bell, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}) => {
  const navigate = useNavigate();

  // Guard: always treat notifications as an array
  const items = Array.isArray(notifications) ? notifications : [];

  const handleNotificationClick = (notification) => {
    if (onMarkAsRead) onMarkAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      if (onClose) onClose();
    }
  };

  const getIcon = (type) => {
    const cls = 'w-5 h-5';
    switch (type) {
      case 'ECN_CREATED':
      case 'ECN_APPROVED':
      case 'ECN_REJECTED':  return <Bell className={`${cls} text-blue-500`} />;
      case 'APPROVAL_REQUIRED': return <Bell className={`${cls} text-orange-500`} />;
      case 'URGENT_CHANGE':     return <Bell className={`${cls} text-red-500`} />;
      default:                  return <Bell className={`${cls} text-gray-500`} />;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7)  return `${d}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); if (onMarkAsRead) onMarkAsRead(n.id); }}
                          className="p-1 text-gray-400 hover:text-green-600 rounded"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        {onDelete && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                            title="Delete"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{formatTime(n.createdAt)}</span>
                      {n.actionUrl && (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          View <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {n.priority === 'URGENT' && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded">Urgent</span>
                    )}
                    {n.priority === 'HIGH' && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded">High Priority</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <button
            onClick={() => { navigate('/plm/notifications'); if (onClose) onClose(); }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
