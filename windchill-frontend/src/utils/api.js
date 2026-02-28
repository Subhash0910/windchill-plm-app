import axios from 'axios';
import { getToken, clearAuth, isTokenExpired } from './localStorage';

// Base URL comes from VITE_API_URL in .env.
// Docker Compose: nginx proxies /api → backend on the internal network.
// Split-deploy:  set VITE_API_URL=https://your-railway-backend.up.railway.app
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const redirectToLogin = () => {
  clearAuth();
  if (window.location.pathname !== '/login') {
    console.warn('Session expired — redirecting to login');
    setTimeout(() => {
      window.location.href = '/login';
    }, 150);
  }
};

// ── Request interceptor — attach JWT, reject immediately if expired ────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      if (isTokenExpired(token)) {
        redirectToLogin();
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401/403 and network errors ────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error?.response?.status;
    const url     = error?.config?.url;

    if (!error.response) {
      return Promise.reject(
        new Error('Backend not reachable. Is the backend container running?')
      );
    }

    if (status === 401 || status === 403) {
      redirectToLogin();
    } else {
      console.error('API error', {
        url,
        status,
        message: error.response?.data?.message || error.message,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
