import axios from 'axios';
import { getToken, clearAuth, isTokenExpired } from './localStorage';

// Keep base URL at host level so callers can use paths like /api/v1/...
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
  // Avoid infinite redirect loops
  if (window.location.pathname !== '/login') {
    console.warn('🔴 Session expired - redirecting to login');
    setTimeout(() => {
      window.location.href = '/login';
    }, 150);
  }
};

// Request interceptor - add token to every request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    console.log('🔑 API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    if (token) {
      // TEMPORARILY DISABLE expiration check for debugging
      /*
      if (isTokenExpired(token)) {
        console.error('❌ Token expired!');
        redirectToLogin();
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
      */
      
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found in storage!');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token expiry
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;

    console.error('❌ API Error:', {
      url,
      status,
      message: error.response?.data?.message || error.message
    });

    // Network / backend down cases
    if (!error.response) {
      const networkErr = new Error('Backend not reachable. Is the backend container running?');
      networkErr.cause = error;
      return Promise.reject(networkErr);
    }

    if (status === 401 || status === 403) {
      console.error('🚫 Auth failed - clearing session and redirecting');
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
