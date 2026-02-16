import axios from 'axios';
import { getToken, clearAuth, isTokenExpired } from './localStorage';

// Keep base URL at host level so callers can use paths like /api/v1/...
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const redirectToLogin = () => {
  clearAuth();
  // Avoid infinite redirect loops
  if (window.location.pathname !== '/login') {
    setTimeout(() => {
      window.location.href = '/login';
    }, 150);
  }
};

// Request interceptor - add token to every request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      if (isTokenExpired(token)) {
        redirectToLogin();
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // Network / backend down cases
    if (!error.response) {
      const networkErr = new Error('Backend not reachable. Is the backend container running?');
      networkErr.cause = error;
      return Promise.reject(networkErr);
    }

    if (status === 401 || status === 403) {
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
