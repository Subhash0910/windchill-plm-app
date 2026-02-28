/**
 * useWebSocket — safe no-op hook.
 *
 * The backend has no WebSocket/STOMP endpoint yet.
 * The previous SockJS implementation was causing a crash loop:
 *   1. localStorage.getItem('token') returned null (token is in sessionStorage as 'auth_token')
 *   2. If token ever existed, SockJS threw on connection failure
 *   3. The onError callback scheduled a reconnect every 5 s → infinite loop
 *
 * NotificationBell now uses HTTP polling (every 30 s) via the authenticated api util.
 * When WebSocket is implemented on the backend, replace this file with the
 * SockJS + STOMP implementation and use getToken() from utils/localStorage.
 */
export const useWebSocket = (_onNotification, _onCountUpdate) => {
  return {
    connected: false,
    error: null,
    send: () => {},
    reconnect: () => {},
    disconnect: () => {},
  };
};

export default useWebSocket;
