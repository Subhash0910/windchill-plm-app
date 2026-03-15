import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── PARTS ────────────────────────────────────────────────────────────
export const getParts          = (params) => api.get('/v1/plm/parts', { params });
export const getPartById       = (id)     => api.get(`/v1/plm/parts/${id}`);
export const createPart        = (data)   => api.post('/v1/plm/parts', data);
export const updatePart        = (id, data) => api.put(`/v1/plm/parts/${id}`, data);
export const deletePart        = (id)     => api.delete(`/v1/plm/parts/${id}`);
export const promotePart       = (id, data) => api.post(`/v1/plm/parts/${id}/promote`, data);
export const revisePart        = (id)     => api.post(`/v1/plm/parts/${id}/revise`);

// ── BOM ────────────────────────────────────────────────────────────────
export const getBomStructure   = (partId) => api.get(`/v1/plm/parts/${partId}/bom`);
export const getWhereUsed      = (partId) => api.get(`/v1/plm/parts/${partId}/where-used`);
export const addBomLine        = (partId, data) => api.post(`/v1/plm/parts/${partId}/bom`, data);
export const updateBomLine     = (partId, bomLineId, data) => api.put(`/v1/plm/parts/${partId}/bom/${bomLineId}`, data);
export const deleteBomLine     = (partId, bomLineId) => api.delete(`/v1/plm/parts/${partId}/bom/${bomLineId}`);

// ── DOCUMENTS ──────────────────────────────────────────────────────────
export const getDocuments      = (params) => api.get('/v1/documents', { params });
export const getDocumentById   = (id)     => api.get(`/v1/documents/${id}`);
export const createDocument    = (data)   => api.post('/v1/documents', data);
export const updateDocument    = (id, data) => api.put(`/v1/documents/${id}`, data);
export const deleteDocument    = (id)     => api.delete(`/v1/documents/${id}`);
export const promoteDocument   = (id, data) => api.post(`/v1/documents/${id}/promote`, data);

// ── PRODUCTS ───────────────────────────────────────────────────────────
export const getProducts       = (params) => api.get('/v1/products', { params });
export const getProductById    = (id)     => api.get(`/v1/products/${id}`);
export const createProduct     = (data)   => api.post('/v1/products', data);
export const updateProduct     = (id, data) => api.put(`/v1/products/${id}`, data);
export const deleteProduct     = (id)     => api.delete(`/v1/products/${id}`);

// ── PROJECTS ───────────────────────────────────────────────────────────
export const getProjects       = (params) => api.get('/v1/projects', { params });
export const getProjectById    = (id)     => api.get(`/v1/projects/${id}`);
export const createProject     = (data)   => api.post('/v1/projects', data);
export const updateProject     = (id, data) => api.put(`/v1/projects/${id}`, data);
export const deleteProject     = (id)     => api.delete(`/v1/projects/${id}`);

// ── PLM CONTEXTS ───────────────────────────────────────────────────────
export const getContexts       = (params) => api.get('/v1/plm/contexts', { params });
export const getContextById    = (id)     => api.get(`/v1/plm/contexts/${id}`);
export const createContext     = (data)   => api.post('/v1/plm/contexts', data);
export const getLibraries      = ()       => api.get('/v1/plm/contexts', { params: { type: 'LIBRARY' } });

// ── FOLDERS ────────────────────────────────────────────────────────────
export const getFolders        = (contextId) => api.get(`/v1/plm/contexts/${contextId}/folders`);
export const createFolder      = (contextId, data) => api.post(`/v1/plm/contexts/${contextId}/folders`, data);
export const deleteFolder      = (contextId, folderId) => api.delete(`/v1/plm/contexts/${contextId}/folders/${folderId}`);

// ── WORK ITEMS ─────────────────────────────────────────────────────────
export const getWorkItems      = ()         => api.get('/v1/plm/workitems/my');
export const approveWorkItem   = (id, data) => api.post(`/v1/plm/workitems/${id}/approve`, data);
export const rejectWorkItem    = (id, data) => api.post(`/v1/plm/workitems/${id}/reject`, data);

// ── NOTIFICATIONS ──────────────────────────────────────────────────────
export const getNotifications      = ()    => api.get('/v1/notifications');
export const getUnreadNotifications = ()   => api.get('/v1/notifications/unread');
export const getUnreadCount         = ()   => api.get('/v1/notifications/count');
export const markNotificationRead   = (id) => api.put(`/v1/notifications/${id}/read`);
export const markAllRead            = ()   => api.put('/v1/notifications/read-all');

// ── USERS ──────────────────────────────────────────────────────────────
export const getUsers          = (params) => api.get('/v1/users', { params });

// ── AUDIT ─────────────────────────────────────────────────────────────
export const getAuditLog       = (params) => api.get('/v1/audit-log', { params });

// ── SEARCH ─────────────────────────────────────────────────────────────
export const search            = (params) => api.get('/v1/search', { params });

// ── DASHBOARD ──────────────────────────────────────────────────────────
export const getDashboardStats = ()       => api.get('/v1/dashboard/stats');
export const getRecentActivity = ()       => api.get('/v1/dashboard/activity');

// ── AI ─────────────────────────────────────────────────────────────────
export const runImpactAnalysis = (data)   => api.post('/v1/ai/impact-analysis', data);
export const chatWithAI        = (data)   => api.post('/v1/ai/chat', data);
export const getAISuggestions  = (partId) => api.get(`/v1/ai/suggestions/${partId}`);

// ── LEGACY ALIASES ─────────────────────────────────────────────────────
export const listParts         = (contextId) => getParts({ contextId }).then(r => r?.data?.data ?? r?.data ?? r);
export const listContexts      = ()          => getContexts().then(r => r?.data?.data ?? r?.data ?? r);
export const listLibraries     = ()          => getLibraries().then(r => r?.data?.data ?? r?.data ?? r);
export const listFolders       = (contextId) => getFolders(contextId).then(r => r?.data?.data ?? r?.data ?? r);
export const listDocuments     = (params)    => getDocuments(params || {}).then(r => r?.data?.data ?? r?.data ?? r);
export const listProducts      = (params)    => getProducts(params || {}).then(r => r?.data?.data ?? r?.data ?? r);
export const listProjects      = (params)    => getProjects(params || {}).then(r => r?.data?.data ?? r?.data ?? r);
export const listUsers         = (params)    => getUsers(params || {}).then(r => r?.data?.data ?? r?.data ?? r);
export const listNotifications = ()          => getNotifications().then(r => r?.data?.data ?? r?.data ?? r);
export const listMyWorkItems   = ()          => getWorkItems().then(r => r?.data?.data ?? r?.data ?? r);
export const listWorkItems     = ()          => getWorkItems().then(r => r?.data?.data ?? r?.data ?? r);
export const getPartBom        = (partId)    => getBomStructure(partId).then(r => r?.data?.data ?? r?.data ?? r);
export const getPartWhereUsed  = (partId)    => getWhereUsed(partId).then(r => r?.data?.data ?? r?.data ?? r);
export const searchParts       = (q, contextId) => getParts({ q, contextId }).then(r => r?.data?.data ?? r?.data ?? r);
export const searchDocuments   = (q)         => getDocuments({ q }).then(r => r?.data?.data ?? r?.data ?? r);
export const searchAll         = (q, params) => search({ q, ...params }).then(r => r?.data?.data ?? r?.data ?? r);

const plmApi = {
  getParts, getPartById, createPart, updatePart, deletePart, promotePart, revisePart,
  getBomStructure, getWhereUsed, addBomLine, updateBomLine, deleteBomLine,
  getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument, promoteDocument,
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  getContexts, getContextById, createContext, getLibraries,
  getFolders, createFolder, deleteFolder,
  getWorkItems, approveWorkItem, rejectWorkItem,
  getNotifications, getUnreadNotifications, getUnreadCount, markNotificationRead, markAllRead,
  getUsers, getAuditLog, search, getDashboardStats, getRecentActivity,
  runImpactAnalysis, chatWithAI, getAISuggestions,
  listParts, listContexts, listLibraries, listFolders, listDocuments,
  listProducts, listProjects, listUsers, listNotifications,
  listMyWorkItems, listWorkItems,
  getPartBom, getPartWhereUsed, searchParts, searchDocuments, searchAll,
};

export { plmApi };
export default plmApi;
