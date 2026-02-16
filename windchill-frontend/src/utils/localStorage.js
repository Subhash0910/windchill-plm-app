// NOTE:
// We intentionally use sessionStorage (per-tab) for auth so you can log in
// with multiple users in different tabs/windows without overwriting each other.
// localStorage is shared across tabs and causes "user id swapping" during testing.

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const storage = (() => {
  try {
    if (typeof window === 'undefined') return null;
    // sessionStorage is per-tab in modern browsers
    if (window.sessionStorage) return window.sessionStorage;
    return window.localStorage;
  } catch (e) {
    return null;
  }
})();

const getItem = (k) => (storage ? storage.getItem(k) : null);
const setItem = (k, v) => { if (storage) storage.setItem(k, v); };
const removeItem = (k) => { if (storage) storage.removeItem(k); };

export const getToken = () => {
  return getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  removeItem(TOKEN_KEY);
};

export const getUser = () => {
  const user = getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = () => {
  removeItem(USER_KEY);
};

export const clearAuth = () => {
  removeToken();
  removeUser();
};

const parseJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (token, skewSeconds = 30) => {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  const exp = payload?.exp;
  if (!exp) return false; // if token has no exp, treat as non-expiring
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + skewSeconds;
};
