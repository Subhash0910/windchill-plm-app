const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
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
