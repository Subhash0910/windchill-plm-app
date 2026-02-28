import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { getToken } from '../utils/localStorage'; // ← FIX: reads sessionStorage 'auth_token'

/**
 * Custom hook for WebSocket / STOMP real-time notifications.
 *
 * FIX: Was using localStorage.getItem('token') which always returns null because
 * the app stores JWT in sessionStorage under 'auth_token' via localStorage.js util.
 * Now uses getToken() from the shared localStorage util.
 *
 * Added max reconnect attempts (3) to prevent infinite reconnect loops.
 */
export const useWebSocket = (onNotification, onCountUpdate) => {
  const [connected, setConnected] = useState(false);
  const [error,     setError]     = useState(null);

  const stompClientRef        = useRef(null);
  const reconnectTimeoutRef   = useRef(null);
  const reconnectAttemptsRef  = useRef(0);
  const MAX_RECONNECTS        = 3;

  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = () => {
    const token = getToken(); // sessionStorage 'auth_token'
    if (!token) {
      console.warn('\u26A0\uFE0F No auth token found — skipping WebSocket (polling fallback active)');
      return;
    }
    if (reconnectAttemptsRef.current >= MAX_RECONNECTS) {
      console.warn('\u26A0\uFE0F Max WebSocket reconnect attempts reached — using polling only');
      return;
    }

    try {
      const socket      = new SockJS('http://localhost:8080/ws');
      const stompClient = Stomp.over(socket);

      stompClient.debug = process.env.NODE_ENV === 'development'
        ? (msg) => console.log('[STOMP]', msg)
        : () => {};

      stompClient.connect(
        { Authorization: `Bearer ${token}` },
        () => {
          console.log('\u2705 WebSocket connected');
          setConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;

          stompClient.subscribe('/user/queue/notifications', ({ body }) => {
            const notification = JSON.parse(body);
            if (onNotification) onNotification(notification);
          });

          stompClient.subscribe('/user/queue/notifications/count', ({ body }) => {
            const { unreadCount } = JSON.parse(body);
            if (onCountUpdate) onCountUpdate(unreadCount);
          });

          stompClient.subscribe('/topic/announcements', ({ body }) => {
            const { message } = JSON.parse(body);
            console.log('\uD83D\uDCE2 Announcement:', message);
          });
        },
        (err) => {
          console.warn('\u26A0\uFE0F WebSocket unavailable — falling back to 30s polling', err?.message);
          setConnected(false);
          setError(err?.message ?? 'Connection failed');
          reconnectAttemptsRef.current += 1;

          if (reconnectAttemptsRef.current < MAX_RECONNECTS) {
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
          }
        }
      );

      stompClientRef.current = stompClient;
    } catch (err) {
      console.warn('\u26A0\uFE0F WebSocket setup failed:', err.message);
      setError(err.message);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (stompClientRef.current?.connected) {
      stompClientRef.current.disconnect(() => {
        console.log('\uD83D\uDD0C WebSocket disconnected');
        setConnected(false);
      });
    }
  };

  const send = (destination, body) => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.send(destination, {}, JSON.stringify(body));
    } else {
      console.warn('\u26A0\uFE0F WebSocket not connected — cannot send');
    }
  };

  return { connected, error, send, reconnect: connect, disconnect };
};
