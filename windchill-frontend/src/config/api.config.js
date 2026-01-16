const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    VALIDATE: `${API_BASE_URL}/auth/validate`,
  },
  USERS: {
    CREATE: `${API_BASE_URL}/users`,
    GET_ALL: `${API_BASE_URL}/users`,
    GET_BY_ID: (id) => `${API_BASE_URL}/users/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/users/${id}`,
    DELETE: (id) => `${API_BASE_URL}/users/${id}`,
  },
  PRODUCTS: {
    CREATE: `${API_BASE_URL}/products`,
    GET_ALL: `${API_BASE_URL}/products`,
    GET_BY_ID: (id) => `${API_BASE_URL}/products/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/products/${id}`,
    DELETE: (id) => `${API_BASE_URL}/products/${id}`,
  },
  DOCUMENTS: {
    CREATE: `${API_BASE_URL}/documents`,
    GET_ALL: `${API_BASE_URL}/documents`,
    GET_BY_ID: (id) => `${API_BASE_URL}/documents/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/documents/${id}`,
    DELETE: (id) => `${API_BASE_URL}/documents/${id}`,
  },
  PROJECTS: {
    CREATE: `${API_BASE_URL}/projects`,
    GET_ALL: `${API_BASE_URL}/projects`,
    GET_BY_ID: (id) => `${API_BASE_URL}/projects/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/projects/${id}`,
    DELETE: (id) => `${API_BASE_URL}/projects/${id}`,
  },
};

export default API_BASE_URL;
