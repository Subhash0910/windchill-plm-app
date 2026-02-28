import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/**
 * Custom hook for WebSocket connection
 * Provides real-time notification support
 * 
 * @param {function} onNotification - Callback when notification received
 * @param {function} onCountUpdate - Callback when unread count updates
 * @returns {Object} Connection status and methods
 */
export const useWebSocket = (onNotification, onCountUpdate) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const stompClientRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  const connect = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token found, skipping WebSocket connection');
        return;
      }

      // Create WebSocket connection
      const socket = new SockJS('http://localhost:8080/ws');
      const stompClient = Stomp.over(socket);

      // Disable debug logs in production
      stompClient.debug = (msg) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(msg);
        }
      };

      // Connect
      stompClient.connect(
        { Authorization: `Bearer ${token}` },
        () => {
          console.log('✅ WebSocket connected');
          setConnected(true);
          setError(null);

          // Subscribe to user-specific notifications
          stompClient.subscribe('/user/queue/notifications', (message) => {
            const notification = JSON.parse(message.body);
            console.log('🔔 Received notification:', notification);
            if (onNotification) {
              onNotification(notification);
            }
          });

          // Subscribe to unread count updates
          stompClient.subscribe('/user/queue/notifications/count', (message) => {
            const data = JSON.parse(message.body);
            console.log('🔢 Unread count:', data.unreadCount);
            if (onCountUpdate) {
              onCountUpdate(data.unreadCount);
            }
          });

          // Subscribe to global announcements
          stompClient.subscribe('/topic/announcements', (message) => {
            const data = JSON.parse(message.body);
            console.log('📢 Announcement:', data.message);
          });

          // Send heartbeat every 30 seconds
          setInterval(() => {
            if (stompClient.connected) {
              stompClient.send('/app/ping', {}, JSON.stringify({}));
            }
          }, 30000);
        },
        (error) => {
          console.error('❌ WebSocket connection error:', error);
          setConnected(false);
          setError(error.message || 'Connection failed');

          // Auto-reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }, 5000);
        }
      );

      stompClientRef.current = stompClient;
    } catch (err) {
      console.error('❌ WebSocket setup error:', err);
      setError(err.message);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.disconnect(() => {
        console.log('🔌 WebSocket disconnected');
        setConnected(false);
      });
    }
  };

  const send = (destination, body) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.send(destination, {}, JSON.stringify(body));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  };

  return {
    connected,
    error,
    send,
    reconnect: connect,
    disconnect
  };
};
