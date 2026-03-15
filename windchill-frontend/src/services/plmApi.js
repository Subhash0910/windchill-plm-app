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

// ── PARTS ─────────────────────────────────────────────
export const getParts            = (params)     => api.get('/v1/plm/parts', { params });
export const getPartById         = (id)         => api.get(`/v1/plm/parts/${id}`);
export const createPart          = (data)       => api.post('/v1/plm/parts', data);
export const updatePart          = (id, data)   => api.put(`/v1/plm/parts/${id}`, data);
export const deletePart          = (id)         => api.delete(`/v1/plm/parts/${id}`);
export const promotePart         = (id, params) => api.post(`/v1/plm/parts/${id}/promote`, null, { params });
export const revisePart          = (id)         => api.post(`/v1/plm/parts/${id}/revise`);
export const checkoutPart        = (id)         => api.post(`/v1/plm/parts/${id}/checkout`);
export const checkinPart         = (id, data)   => api.post(`/v1/plm/parts/${id}/checkin`, data);
export const undoCheckoutPart    = (id)         => api.post(`/v1/plm/parts/${id}/undo-checkout`);

// ── BOM ───────────────────────────────────────────────
export const getBomStructure     = (partId)     => api.get(`/v1/plm/parts/${partId}/bom`);
export const getWhereUsed        = (partId)     => api.get(`/v1/plm/parts/${partId}/where-used`);
export const addBomLine          = (partId, data) => api.post(`/v1/plm/parts/${partId}/bom`, data);
export const updateBomLine       = (partId, bomLineId, data) => api.put(`/v1/plm/parts/${partId}/bom/${bomLineId}`, data);
export const deleteBomLine       = (partId, bomLineId) => api.delete(`/v1/plm/parts/${partId}/bom/${bomLineId}`);

// ── DOCUMENTS ─────────────────────────────────────────
export const getDocuments        = (params)     => api.get('/v1/documents', { params });
export const getDocumentById     = (id)         => api.get(`/v1/documents/${id}`);
export const createDocument      = (data)       => api.post('/v1/documents', data);
export const updateDocument      = (id, data)   => api.put(`/v1/documents/${id}`, data);
export const deleteDocument      = (id)         => api.delete(`/v1/documents/${id}`);
export const promoteDocument     = (id, data)   => api.post(`/v1/documents/${id}/promote`, data);
export const checkoutDocument    = (id)         => api.post(`/v1/documents/${id}/checkout`);
export const checkinDocument     = (id, data)   => api.post(`/v1/documents/${id}/checkin`, data);

// ── PRODUCTS ───────────────────────────────────────────
export const getProducts         = (params)     => api.get('/v1/products', { params });
export const getProductById      = (id)         => api.get(`/v1/products/${id}`);
export const createProduct       = (data)       => api.post('/v1/products', data);
export const updateProduct       = (id, data)   => api.put(`/v1/products/${id}`, data);
export const deleteProduct       = (id)         => api.delete(`/v1/products/${id}`);

// ── PROJECTS ───────────────────────────────────────────
export const getProjects         = (params)     => api.get('/v1/projects', { params });
export const getProjectById      = (id)         => api.get(`/v1/projects/${id}`);
export const createProject       = (data)       => api.post('/v1/projects', data);
export const updateProject       = (id, data)   => api.put(`/v1/projects/${id}`, data);
export const deleteProject       = (id)         => api.delete(`/v1/projects/${id}`);

// ── PLM CONTEXTS ────────────────────────────────────────
export const getContexts         = (params)     => api.get('/v1/plm/contexts', { params });
export const getContextById      = (id)         => api.get(`/v1/plm/contexts/${id}`);
export const createContext       = (data)       => api.post('/v1/plm/contexts', data);
export const getLibraries        = ()           => api.get('/v1/plm/contexts', { params: { type: 'LIBRARY' } });

// ── FOLDERS ────────────────────────────────────────────
export const getFolders          = (contextId)       => api.get(`/v1/plm/contexts/${contextId}/folders`);
export const createFolder        = (contextId, data) => api.post(`/v1/plm/contexts/${contextId}/folders`, data);
export const deleteFolder        = (contextId, folderId) => api.delete(`/v1/plm/contexts/${contextId}/folders/${folderId}`);

// ── CHANGES / ECR ──────────────────────────────────────
export const getChangeRequests   = (params)     => api.get('/v1/plm/promotions', { params });
export const getChangeRequestById = (id)        => api.get(`/v1/plm/promotions/parts/${id}/latest`);
export const createChangeRequest  = (data)      => api.post('/v1/plm/promotions', data);
export const updateChangeRequest  = (id, data)  => api.put(`/v1/plm/promotions/${id}`, data);
export const promoteChangeRequest = (id, data)  => api.post(`/v1/plm/promotions/${id}/complete`, data);
export const getChangeTasks       = (params)    => api.get('/v1/plm/workitems/my', { params });
export const getChangeTaskById    = (id)        => api.get(`/v1/plm/workitems/${id}`);
export const updateChangeTask     = (id, data)  => api.put(`/v1/plm/workitems/${id}`, data);

// ── WORK ITEMS ─────────────────────────────────────────
export const getWorkItems        = ()           => api.get('/v1/plm/workitems/my');
export const approveWorkItem     = (id, data)   => api.post(`/v1/plm/workitems/${id}/approve`, data);
export const rejectWorkItem      = (id, data)   => api.post(`/v1/plm/workitems/${id}/reject`, data);
export const completeWorkItem    = (id)         => api.post(`/v1/plm/workitems/${id}/approve`);
export const delegateWorkItem    = (id, data)   => api.post(`/v1/plm/workitems/${id}/delegate`, data);
export const getWorkItemById     = (id)         => api.get(`/v1/plm/workitems/${id}`);
export const updateWorkItem      = (id, data)   => api.put(`/v1/plm/workitems/${id}`, data);

// ── NOTIFICATIONS ──────────────────────────────────────
export const getNotifications       = ()        => api.get('/v1/notifications');
export const getUnreadNotifications = ()        => api.get('/v1/notifications/unread');
export const getUnreadCount         = ()        => api.get('/v1/notifications/count');
export const markNotificationRead   = (id)      => api.put(`/v1/notifications/${id}/read`);
export const markAllRead            = ()        => api.put('/v1/notifications/read-all');

// ── USERS / TEAMS ───────────────────────────────────────
export const getUsers            = (params)     => api.get('/v1/users', { params });
export const getTeams            = ()           => api.get('/v1/teams');
export const getTeamById         = (id)         => api.get(`/v1/teams/${id}`);
export const createTeam          = (data)       => api.post('/v1/teams', data);

// ── AUDIT ───────────────────────────────────────────────
export const getAuditLog         = (params)     => api.get('/v1/plm/audit/all', { params });
export const getEntityAudit      = (entityType, entityId) => api.get('/v1/plm/audit', { params: { entityType, entityId } });

// ── SEARCH ───────────────────────────────────────────────
export const search              = (params)     => api.get('/v1/search', { params });
export const searchByType        = (type, params) => api.get(`/v1/search/${type.toLowerCase()}`, { params });

// ── DASHBOARD ──────────────────────────────────────────
export const getDashboardStats   = ()           => api.get('/v1/dashboard/stats');
export const getRecentActivity   = ()           => api.get('/v1/dashboard/activity');

// ── AI ─────────────────────────────────────────────────────
export const runImpactAnalysis   = (data)       => api.post('/v1/ai/impact-analysis', data);
export const chatWithAI          = (data)       => api.post('/v1/ai/chat', data);
export const getAISuggestions    = (partId)     => api.get(`/v1/ai/suggestions/${partId}`);

// ── PROMOTIONS (direct) ─────────────────────────────────
export const getPromotionForPart = (partId)     => api.get(`/v1/plm/promotions/parts/${partId}/latest`);

// ── LEGACY ALIASES ─────────────────────────────────────────
export const listParts           = (contextId)  => getParts({ contextId }).then(r => r?.data?.data ?? r?.data ?? r);
export const listContexts        = ()           => getContexts().then(r => r?.data?.data ?? r?.data ?? r);
export const listLibraries       = ()           => getLibraries().then(r => r?.data?.data ?? r?.data ?? r);
export const listFolders         = (contextId)  => getFolders(contextId).then(r => r?.data?.data ?? r?.data ?? r);
export const listDocuments       = (params)     => getDocuments(params || {}).then(r => r?.data?.data ?? r?.data ?? r);
export const listProducts        = (params)     => getProducts(params || {}).then(r => r?.data?.data ?? r?.data ?? r);
export const listProjects        = (params)     => getProjects(params || {}).then(r => r?.data?.data ?? r?.data ?? r);
export const listUsers           = (params)     => getUsers(params || {}).then(r => r?.data?.data ?? r?.data ?? r);
export const listTeams           = ()           => getTeams().then(r => r?.data?.data ?? r?.data ?? r);
export const listNotifications   = ()           => getNotifications().then(r => r?.data?.data ?? r?.data ?? r);
export const listMyWorkItems     = ()           => getWorkItems().then(r => r?.data?.data ?? r?.data ?? r);
export const listWorkItems       = ()           => getWorkItems().then(r => r?.data?.data ?? r?.data ?? r);
export const listEcrs            = (params)     => getChangeRequests(params || {}).then(r => r?.data?.data ?? r?.data ?? r);
export const listChangeTasks     = (params)     => getChangeTasks(params || {}).then(r => r?.data?.data ?? r?.data ?? r);
export const getPartBom          = (partId)     => getBomStructure(partId).then(r => r?.data?.data ?? r?.data ?? r);
export const getPartWhereUsed    = (partId)     => getWhereUsed(partId).then(r => r?.data?.data ?? r?.data ?? r);
export const getFolderTree       = (contextId)  => getFolders(contextId).then(r => r?.data?.data ?? r?.data ?? r);
export const getEcrById          = (id)         => getChangeRequestById(id).then(r => r?.data?.data ?? r?.data ?? r);
export const updateEcr           = (id, data)   => updateChangeRequest(id, data).then(r => r?.data?.data ?? r?.data ?? r);
export const promoteEcr          = (id, data)   => promoteChangeRequest(id, data).then(r => r?.data?.data ?? r?.data ?? r);
export const searchParts         = (q, contextId) => getParts({ q, contextId }).then(r => r?.data?.data ?? r?.data ?? r);
export const searchDocuments     = (q)          => getDocuments({ q }).then(r => r?.data?.data ?? r?.data ?? r);
export const searchAll           = (q, params)  => search({ q, ...params }).then(r => r?.data?.data ?? r?.data ?? r);

const plmApi = {
  // Parts
  getParts, getPartById, createPart, updatePart, deletePart,
  promotePart, revisePart, checkoutPart, checkinPart, undoCheckoutPart,
  // BOM
  getBomStructure, getWhereUsed, addBomLine, updateBomLine, deleteBomLine,
  // Documents
  getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument,
  promoteDocument, checkoutDocument, checkinDocument,
  // Products
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  // Projects
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  // Contexts
  getContexts, getContextById, createContext, getLibraries,
  // Folders
  getFolders, createFolder, deleteFolder,
  // Changes / ECR
  getChangeRequests, getChangeRequestById, createChangeRequest,
  updateChangeRequest, promoteChangeRequest, getChangeTasks,
  getChangeTaskById, updateChangeTask,
  // Work Items
  getWorkItems, approveWorkItem, rejectWorkItem,
  completeWorkItem, delegateWorkItem, getWorkItemById, updateWorkItem,
  // Notifications
  getNotifications, getUnreadNotifications, getUnreadCount,
  markNotificationRead, markAllRead,
  // Users / Teams
  getUsers, getTeams, getTeamById, createTeam,
  // Audit
  getAuditLog, getEntityAudit,
  // Search
  search, searchByType,
  // Dashboard
  getDashboardStats, getRecentActivity,
  // AI
  runImpactAnalysis, chatWithAI, getAISuggestions,
  // Promotions
  getPromotionForPart,
  // Legacy aliases
  listParts, listContexts, listLibraries, listFolders, listDocuments,
  listProducts, listProjects, listUsers, listTeams, listNotifications,
  listMyWorkItems, listWorkItems, listEcrs, listChangeTasks,
  getPartBom, getPartWhereUsed, getFolderTree,
  getEcrById, updateEcr, promoteEcr,
  searchParts, searchDocuments, searchAll,
};

export { plmApi };
export default plmApi;
