import axios from 'axios';
import { getToken, clearAuth } from '../utils/localStorage';

// In production (nginx), VITE_API_URL is '' so base = '/api/v1'
// In local dev, VITE_API_URL is 'http://localhost:8080' so base = 'http://localhost:8080/api/v1'
const _origin = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const API_BASE = _origin + '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── PARTS ─────────────────────────────────────────────
export const getParts            = (params)               => api.get('/plm/parts', { params });
export const getPartById         = (id)                   => api.get(`/plm/parts/${id}`);
export const createPart          = (data)                 => api.post('/plm/parts', data);
export const updatePart          = (id, data)             => api.put(`/plm/parts/${id}`, data);
export const deletePart          = (id)                   => api.delete(`/plm/parts/${id}`);
export const promotePart         = (id, params)           => api.post(`/plm/parts/${id}/promote`, null, { params });
export const revisePart          = (id)                   => api.post(`/plm/parts/${id}/revise`);
export const checkoutPart        = (id)                   => api.post(`/plm/parts/${id}/checkout`);
export const checkinPart         = (id, data)             => api.post(`/plm/parts/${id}/checkin`, data);
export const undoCheckoutPart    = (id)                   => api.post(`/plm/parts/${id}/undo-checkout`);

// ── BOM ───────────────────────────────────────────────
export const getBomStructure     = (partId)               => api.get(`/plm/parts/${partId}/bom`);
export const getWhereUsed        = (partId)               => api.get(`/plm/parts/${partId}/where-used`);
export const addBomLine          = (partId, data)         => api.post(`/plm/parts/${partId}/bom`, data);
export const updateBomLine       = (partId, bomLineId, data) => api.put(`/plm/parts/${partId}/bom/${bomLineId}`, data);
export const deleteBomLine       = (partId, bomLineId)    => api.delete(`/plm/parts/${partId}/bom/${bomLineId}`);

// ── DOCUMENTS ─────────────────────────────────────────
export const getDocuments        = (params)               => api.get('/documents', { params });
export const getDocumentById     = (id)                   => api.get(`/documents/${id}`);
export const createDocument      = (data)                 => api.post('/documents', data);
export const updateDocument      = (id, data)             => api.put(`/documents/${id}`, data);
export const deleteDocument      = (id)                   => api.delete(`/documents/${id}`);
export const promoteDocument     = (id, data)             => api.post(`/documents/${id}/promote`, data);
export const checkoutDocument    = (id)                   => api.post(`/documents/${id}/checkout`);
export const checkinDocument     = (id, data)             => api.post(`/documents/${id}/checkin`, data);

// ── PRODUCTS ───────────────────────────────────────────
export const getProducts         = (params)               => api.get('/products', { params });
export const getProductById      = (id)                   => api.get(`/products/${id}`);
export const createProduct       = (data)                 => api.post('/products', data);
export const updateProduct       = (id, data)             => api.put(`/products/${id}`, data);
export const deleteProduct       = (id)                   => api.delete(`/products/${id}`);

// ── PROJECTS ───────────────────────────────────────────
export const getProjects         = (params)               => api.get('/projects', { params });
export const getProjectById      = (id)                   => api.get(`/projects/${id}`);
export const createProject       = (data)                 => api.post('/projects', data);
export const updateProject       = (id, data)             => api.put(`/projects/${id}`, data);
export const deleteProject       = (id)                   => api.delete(`/projects/${id}`);

// ── PLM CONTEXTS ────────────────────────────────────────
export const getContexts         = (params)               => api.get('/plm/contexts', { params });
export const getContextById      = (id)                   => api.get(`/plm/contexts/${id}`);
export const createContext       = (data)                 => api.post('/plm/contexts', data);
export const getLibraries        = ()                     => api.get('/plm/contexts', { params: { type: 'LIBRARY' } });

// ── FOLDERS ────────────────────────────────────────────
export const getFolders          = (contextId)            => api.get(`/plm/contexts/${contextId}/folders`);
export const createFolder        = (contextId, data)      => api.post(`/plm/contexts/${contextId}/folders`, data);
export const deleteFolder        = (contextId, folderId)  => api.delete(`/plm/contexts/${contextId}/folders/${folderId}`);
export const getFolderContents   = (contextId, folderId)  => api.get(`/plm/contexts/${contextId}/folders/${folderId}/contents`);

// ── CHANGES / ECR ──────────────────────────────────────
export const getChangeRequests    = (params)              => api.get('/plm/promotions', { params });
export const getChangeRequestById = (id)                  => api.get(`/plm/promotions/parts/${id}/latest`);
export const createChangeRequest  = (data)                => api.post('/plm/promotions', data);
export const updateChangeRequest  = (id, data)            => api.put(`/plm/promotions/${id}`, data);
export const promoteChangeRequest = (id, data)            => api.post(`/plm/promotions/${id}/complete`, data);
export const getChangeTasks       = (params)              => api.get('/plm/workitems/my', { params });
export const getChangeTaskById    = (id)                  => api.get(`/plm/workitems/${id}`);
export const updateChangeTask     = (id, data)            => api.put(`/plm/workitems/${id}`, data);

// ── WORK ITEMS ─────────────────────────────────────────
export const getWorkItems        = ()                     => api.get('/plm/workitems/my');
export const approveWorkItem     = (id, data)             => api.post(`/plm/workitems/${id}/approve`, data);
export const rejectWorkItem      = (id, data)             => api.post(`/plm/workitems/${id}/reject`, data);
export const delegateWorkItem    = (id, data)             => api.post(`/plm/workitems/${id}/delegate`, data);
export const getWorkItemById     = (id)                   => api.get(`/plm/workitems/${id}`);
export const updateWorkItem      = (id, data)             => api.put(`/plm/workitems/${id}`, data);

// ── NOTIFICATIONS ──────────────────────────────────────
export const getNotifications       = ()                  => api.get('/notifications');
export const getUnreadNotifications = ()                  => api.get('/notifications/unread');
export const getUnreadCount         = ()                  => api.get('/notifications/count');
export const markNotificationRead   = (id)                => api.put(`/notifications/${id}/read`);
export const markAllRead            = ()                  => api.put('/notifications/read-all');

// ── USERS / TEAMS ───────────────────────────────────────
export const getUsers            = (params)               => api.get('/users', { params });
export const getTeams            = ()                     => api.get('/teams');
export const getTeamById         = (id)                   => api.get(`/teams/${id}`);
export const createTeam          = (data)                 => api.post('/teams', data);

// ── AUDIT ───────────────────────────────────────────────
export const getAuditLog         = (params)               => api.get('/plm/audit/all', { params });
export const getEntityAudit      = (entityType, entityId) => api.get('/plm/audit', { params: { entityType, entityId } });

// ── SEARCH ───────────────────────────────────────────────
export const search              = (params)               => api.get('/search', { params });
export const searchByType        = (type, params)         => api.get(`/search/${type.toLowerCase()}`, { params });

// ── DASHBOARD ──────────────────────────────────────────
export const getDashboardStats   = ()                     => api.get('/dashboard/stats');
export const getRecentActivity   = ()                     => api.get('/dashboard/activity');

// ── AI ─────────────────────────────────────────────────────
export const runImpactAnalysis   = (data)                 => api.post('/ai/impact-analysis', data);
export const chatWithAI          = (data)                 => api.post('/ai/chat', data);
export const getAISuggestions    = (partId)               => api.get(`/ai/suggestions/${partId}`);

// ── PROMOTIONS ───────────────────────────────────────────
export const getPromotionForPart = (partId)               => api.get(`/plm/promotions/parts/${partId}/latest`);

const plmApi = {
  getParts, getPartById, createPart, updatePart, deletePart,
  promotePart, revisePart, checkoutPart, checkinPart, undoCheckoutPart,
  getBomStructure, getWhereUsed, addBomLine, updateBomLine, deleteBomLine,
  getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument,
  promoteDocument, checkoutDocument, checkinDocument,
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  getContexts, getContextById, createContext, getLibraries,
  getFolders, createFolder, deleteFolder, getFolderContents,
  getChangeRequests, getChangeRequestById, createChangeRequest,
  updateChangeRequest, promoteChangeRequest, getChangeTasks,
  getChangeTaskById, updateChangeTask,
  getWorkItems, approveWorkItem, rejectWorkItem,
  delegateWorkItem, getWorkItemById, updateWorkItem,
  getNotifications, getUnreadNotifications, getUnreadCount,
  markNotificationRead, markAllRead,
  getUsers, getTeams, getTeamById, createTeam,
  getAuditLog, getEntityAudit,
  search, searchByType,
  getDashboardStats, getRecentActivity,
  runImpactAnalysis, chatWithAI, getAISuggestions,
  getPromotionForPart,
};

export { plmApi };
export default plmApi;
