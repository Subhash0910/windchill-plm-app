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

// ── PARTS ──────────────────────────────────────────────────────────────
export const getParts          = (params) => api.get('/parts', { params });
export const getPartById       = (id)     => api.get(`/parts/${id}`);
export const createPart        = (data)   => api.post('/parts', data);
export const updatePart        = (id, data) => api.put(`/parts/${id}`, data);
export const deletePart        = (id)     => api.delete(`/parts/${id}`);
export const checkoutPart      = (id)     => api.post(`/parts/${id}/checkout`);
export const checkinPart       = (id, data) => api.post(`/parts/${id}/checkin`, data);
export const undoCheckoutPart  = (id)     => api.post(`/parts/${id}/undo-checkout`);
export const promotePart       = (id, data) => api.post(`/parts/${id}/promote`, data);
export const revisePart        = (id)     => api.post(`/parts/${id}/revise`);

// ── BOM ────────────────────────────────────────────────────────────────
export const getBomStructure   = (partId) => api.get(`/parts/${partId}/bom`);
export const getWhereUsed      = (partId) => api.get(`/parts/${partId}/where-used`);
export const addBomLine        = (partId, data) => api.post(`/parts/${partId}/bom`, data);
export const updateBomLine     = (partId, bomLineId, data) => api.put(`/parts/${partId}/bom/${bomLineId}`, data);
export const deleteBomLine     = (partId, bomLineId) => api.delete(`/parts/${partId}/bom/${bomLineId}`);

// ── DOCUMENTS ──────────────────────────────────────────────────────────
export const getDocuments      = (params) => api.get('/documents', { params });
export const getDocumentById   = (id)     => api.get(`/documents/${id}`);
export const createDocument    = (data)   => api.post('/documents', data);
export const updateDocument    = (id, data) => api.put(`/documents/${id}`, data);
export const deleteDocument    = (id)     => api.delete(`/documents/${id}`);
export const checkoutDocument  = (id)     => api.post(`/documents/${id}/checkout`);
export const checkinDocument   = (id, data) => api.post(`/documents/${id}/checkin`, data);
export const promoteDocument   = (id, data) => api.post(`/documents/${id}/promote`, data);

// ── PRODUCTS ───────────────────────────────────────────────────────────
export const getProducts       = (params) => api.get('/products', { params });
export const getProductById    = (id)     => api.get(`/products/${id}`);
export const createProduct     = (data)   => api.post('/products', data);
export const updateProduct     = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct     = (id)     => api.delete(`/products/${id}`);

// ── PROJECTS ───────────────────────────────────────────────────────────
export const getProjects       = (params) => api.get('/projects', { params });
export const getProjectById    = (id)     => api.get(`/projects/${id}`);
export const createProject     = (data)   => api.post('/projects', data);
export const updateProject     = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject     = (id)     => api.delete(`/projects/${id}`);

// ── PLM CONTEXTS ───────────────────────────────────────────────────────
export const getContexts       = (params) => api.get('/v1/plm/contexts', { params });
export const getContextById    = (id)     => api.get(`/v1/plm/contexts/${id}`);
export const createContext     = (data)   => api.post('/v1/plm/contexts', data);
export const getLibraries      = ()       => api.get('/v1/plm/contexts', { params: { type: 'LIBRARY' } });

// ── CHANGES ────────────────────────────────────────────────────────────
export const getChangeRequests  = (params) => api.get('/changes/ecr', { params });
export const getChangeRequestById = (id)  => api.get(`/changes/ecr/${id}`);
export const createChangeRequest  = (data) => api.post('/changes/ecr', data);
export const updateChangeRequest  = (id, data) => api.put(`/changes/ecr/${id}`, data);
export const promoteChangeRequest = (id, data) => api.post(`/changes/ecr/${id}/promote`, data);
export const getChangeTasks     = (params) => api.get('/changes/tasks', { params });
export const getChangeTaskById  = (id)    => api.get(`/changes/tasks/${id}`);
export const updateChangeTask   = (id, data) => api.put(`/changes/tasks/${id}`, data);

// ── WORK ITEMS (WORKLIST) ──────────────────────────────────────────────
export const getWorkItems       = (params) => api.get('/work-items', { params });
export const getWorkItemById    = (id)     => api.get(`/work-items/${id}`);
export const updateWorkItem     = (id, data) => api.put(`/work-items/${id}`, data);
export const completeWorkItem   = (id)     => api.post(`/work-items/${id}/complete`);
export const delegateWorkItem   = (id, data) => api.post(`/work-items/${id}/delegate`, data);

// ── FOLDERS ────────────────────────────────────────────────────────────
export const getFolders         = (params) => api.get('/folders', { params });
export const getFolderById      = (id)    => api.get(`/folders/${id}`);
export const getFolderContents  = (id)    => api.get(`/folders/${id}/contents`);
export const createFolder       = (data)  => api.post('/folders', data);
export const updateFolder       = (id, data) => api.put(`/folders/${id}`, data);
export const deleteFolder       = (id)    => api.delete(`/folders/${id}`);
export const moveToFolder       = (folderId, data) => api.post(`/folders/${folderId}/add`, data);

// ── SEARCH ─────────────────────────────────────────────────────────────
export const search             = (params) => api.get('/search', { params });
export const searchByType       = (type, params) => api.get(`/search/${type.toLowerCase()}`, { params });

// ── NOTIFICATIONS ──────────────────────────────────────────────────────
export const getNotifications   = (params) => api.get('/notifications', { params });
export const markNotificationRead = (id)  => api.put(`/notifications/${id}/read`);
export const markAllRead        = ()       => api.put('/notifications/read-all');

// ── AUDIT LOG ──────────────────────────────────────────────────────────
export const getAuditLog        = (params) => api.get('/audit-log', { params });

// ── TEAMS & USERS ──────────────────────────────────────────────────────
export const getTeams           = ()      => api.get('/teams');
export const getTeamById        = (id)    => api.get(`/teams/${id}`);
export const createTeam         = (data)  => api.post('/teams', data);
export const getUsers           = (params) => api.get('/users', { params });

// ── DASHBOARD ──────────────────────────────────────────────────────────
export const getDashboardStats  = ()      => api.get('/dashboard/stats');
export const getRecentActivity  = ()      => api.get('/dashboard/activity');

// ── AI ─────────────────────────────────────────────────────────────────
export const runImpactAnalysis  = (data)  => api.post('/ai/impact-analysis', data);
export const chatWithAI         = (data)  => api.post('/ai/chat', data);
export const getAISuggestions   = (partId) => api.get(`/ai/suggestions/${partId}`);

// ── LEGACY ALIASES ─────────────────────────────────────────────────────
export const listParts           = (contextId) => getParts({ contextId }).then(r => r?.data ?? r);
export const listMyWorkItems     = ()          => getWorkItems({ assignedToMe: true }).then(r => r?.data ?? r);
export const listEcrs            = (params)    => getChangeRequests(params || {}).then(r => r?.data ?? r);
export const listFolders         = (contextId) => getFolders({ contextId }).then(r => r?.data ?? r);
export const listDocuments       = (params)    => getDocuments(params || {}).then(r => r?.data ?? r);
export const listProducts        = (params)    => getProducts(params || {}).then(r => r?.data ?? r);
export const listProjects        = (params)    => getProjects(params || {}).then(r => r?.data ?? r);
export const listChangeTasks     = (params)    => getChangeTasks(params || {}).then(r => r?.data ?? r);
export const listNotifications   = (params)    => getNotifications(params || {}).then(r => r?.data ?? r);
export const listWorkItems       = (params)    => getWorkItems(params || {}).then(r => r?.data ?? r);
export const listTeams           = ()          => getTeams().then(r => r?.data ?? r);
export const listUsers           = (params)    => getUsers(params || {}).then(r => r?.data ?? r);
export const listContexts        = ()          => getContexts().then(r => r?.data?.data ?? r?.data ?? r);
export const listLibraries       = ()          => getLibraries().then(r => r?.data?.data ?? r?.data ?? r);
export const searchParts         = (q, contextId) => getParts({ q, contextId }).then(r => r?.data ?? r);
export const searchDocuments     = (q, contextId) => getDocuments({ q, contextId }).then(r => r?.data ?? r);
export const searchAll           = (q, params)    => search({ q, ...params }).then(r => r?.data ?? r);
export const getPartBom          = (partId)   => getBomStructure(partId).then(r => r?.data ?? r);
export const getPartWhereUsed    = (partId)   => getWhereUsed(partId).then(r => r?.data ?? r);
export const getFolderTree       = (params)   => getFolders(params || {}).then(r => r?.data ?? r);
export const getEcrById          = (id)       => getChangeRequestById(id).then(r => r?.data ?? r);
export const updateEcr           = (id, data) => updateChangeRequest(id, data).then(r => r?.data ?? r);
export const promoteEcr          = (id, data) => promoteChangeRequest(id, data).then(r => r?.data ?? r);

const plmApi = {
  // Core Parts
  getParts, getPartById, createPart, updatePart, deletePart,
  checkoutPart, checkinPart, undoCheckoutPart, promotePart, revisePart,
  // BOM
  getBomStructure, getWhereUsed, addBomLine, updateBomLine, deleteBomLine,
  // Documents
  getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument,
  checkoutDocument, checkinDocument, promoteDocument,
  // Products
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  // Projects
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  // PLM Contexts
  getContexts, getContextById, createContext, getLibraries,
  // Changes
  getChangeRequests, getChangeRequestById, createChangeRequest, updateChangeRequest,
  promoteChangeRequest, getChangeTasks, getChangeTaskById, updateChangeTask,
  // Work Items
  getWorkItems, getWorkItemById, updateWorkItem, completeWorkItem, delegateWorkItem,
  // Folders
  getFolders, getFolderById, getFolderContents, createFolder, updateFolder, deleteFolder, moveToFolder,
  // Search
  search, searchByType,
  // Notifications
  getNotifications, markNotificationRead, markAllRead,
  // Audit
  getAuditLog,
  // Teams & Users
  getTeams, getTeamById, createTeam, getUsers,
  // Dashboard
  getDashboardStats, getRecentActivity,
  // AI
  runImpactAnalysis, chatWithAI, getAISuggestions,
  // Legacy aliases
  listParts, listMyWorkItems, listEcrs, listFolders, listDocuments,
  listProducts, listProjects, listChangeTasks, listNotifications,
  listWorkItems, listTeams, listUsers,
  listContexts, listLibraries,
  searchParts, searchDocuments, searchAll,
  getPartBom, getPartWhereUsed, getFolderTree,
  getEcrById, updateEcr, promoteEcr,
};

export { plmApi };
export default plmApi;
