import axios from 'axios';
import { getToken, clearAuth } from './localStorage';

// Keep base URL at host level so callers can use paths like /api/v1/...
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to every request
api.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor - handle errors and token expiry
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      clearAuth();
      setTimeout(() => {
        window.location.href = '/login';
      }, 200);
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
