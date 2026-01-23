import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('[API Request Error]', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token expiry
api.interceptors.response.use(
  response => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    const message = error.response?.data?.message || error.message || 'Unknown error';
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn('[API] Unauthorized - Token invalid or expired. Redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } else if (error.response?.status === 403) {
      console.error('[API] Access forbidden:', message);
    } else if (error.response?.status === 404) {
      console.error('[API] Resource not found:', message);
    } else if (error.response?.status === 400) {
      console.error('[API] Bad request:', message);
    } else if (error.response?.status >= 500) {
      console.error('[API] Server error:', message);
    } else if (error.code === 'ERR_NETWORK') {
      console.error('[API] Network error - Cannot reach server at', API_BASE_URL);
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
