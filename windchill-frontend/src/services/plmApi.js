import api from '../utils/api';

export const plmApi = {
  // ── Contexts ────────────────────────────────────────────────────────
  listContexts: async () => {
    const res = await api.get('/api/v1/plm/contexts');
    return res.data.data;
  },
  createContext: async (payload) => {
    const res = await api.post('/api/v1/plm/contexts', payload);
    return res.data.data;
  },

  // ── Context Team / Members ─────────────────────────────────────────
  listContextMembers: async (contextId) => {
    const res = await api.get(`/api/v1/plm/contexts/${contextId}/members`);
    return res.data.data;
  },
  addContextMember: async (contextId, payload) => {
    const res = await api.post(`/api/v1/plm/contexts/${contextId}/members`, payload);
    return res.data.data;
  },
  updateContextMemberRole: async (contextId, userId, role) => {
    const res = await api.patch(`/api/v1/plm/contexts/${contextId}/members/${userId}`, { role });
    return res.data.data;
  },
  removeContextMember: async (contextId, userId) => {
    const res = await api.delete(`/api/v1/plm/contexts/${contextId}/members/${userId}`);
    return res.data.data;
  },

  // ── Folders ────────────────────────────────────────────────────────
  listFolders: async (contextId) => {
    const res = await api.get(`/api/v1/plm/contexts/${contextId}/folders`);
    return res.data.data;
  },
  createFolder: async (contextId, payload) => {
    const res = await api.post(`/api/v1/plm/contexts/${contextId}/folders`, payload);
    return res.data.data;
  },
  deleteFolder: async (contextId, folderId) => {
    const res = await api.delete(`/api/v1/plm/contexts/${contextId}/folders/${folderId}`);
    return res.data.data;
  },

  // ── Parts ─────────────────────────────────────────────────────────
  listParts: async (contextId) => {
    const res = await api.get('/api/v1/plm/parts', { params: { contextId } });
    return res.data.data;
  },
  getPart: async (id) => {
    const res = await api.get(`/api/v1/plm/parts/${id}`);
    return res.data.data;
  },
  createPart: async (payload) => {
    const res = await api.post('/api/v1/plm/parts', payload);
    return res.data.data;
  },
  updatePart: async (id, payload) => {
    const res = await api.put(`/api/v1/plm/parts/${id}`, payload);
    return res.data.data;
  },
  deletePart: async (id) => {
    const res = await api.delete(`/api/v1/plm/parts/${id}`);
    return res.data.data;
  },
  promotePart: async (id, target) => {
    const res = await api.post(`/api/v1/plm/parts/${id}/promote`, null, { params: { target } });
    return res.data.data;
  },
  revisePart: async (id) => {
    const res = await api.post(`/api/v1/plm/parts/${id}/revise`);
    return res.data.data;
  },
  getWhereUsed: async (id) => {
    const res = await api.get(`/api/v1/plm/parts/${id}/where-used`);
    return res.data.data;
  },

  // ── Dashboard Stats ──────────────────────────────────────────────
  /**
   * Returns { totalParts, inwork, underReview, released, obsolete,
   *           pendingWorkItems } for the given context.
   * Powers the KPI cards on the Dashboard page.
   */
  getDashboardStats: async (contextId) => {
    const res = await api.get('/api/v1/plm/dashboard/stats', { params: { contextId } });
    return res.data.data;
  },

  // ── Promotions ──────────────────────────────────────────────────
  getLatestPromotion: async (partId) => {
    const res = await api.get(`/api/v1/plm/promotions/parts/${partId}/latest`);
    return res.data.data;
  },

  // ── Worklist / Work Items ────────────────────────────────────────
  listMyWorkItems: async () => {
    const res = await api.get('/api/v1/plm/workitems/my');
    return res.data.data;
  },
  approveWorkItem: async (id, comment) => {
    const payload = comment ? { comment } : null;
    const res = await api.post(`/api/v1/plm/workitems/${id}/approve`, payload);
    return res.data.data;
  },
  rejectWorkItem: async (id, comment) => {
    const res = await api.post(`/api/v1/plm/workitems/${id}/reject`, { comment });
    return res.data.data;
  },

  // ── Notifications ───────────────────────────────────────────────
  /** Unread count — used by the bell badge */
  getNotificationCount: async () => {
    const res = await api.get('/api/v1/notifications/count');
    return res.data?.data?.unreadCount ?? 0;
  },
  /** All notifications (read + unread) for the full notification panel */
  getNotifications: async () => {
    const res = await api.get('/api/v1/notifications');
    return res.data?.data ?? [];
  },
  /** Only unread — used by the bell dropdown */
  getUnreadNotifications: async () => {
    const res = await api.get('/api/v1/notifications/unread');
    return res.data?.data ?? [];
  },
  markNotificationRead: async (id) => {
    const res = await api.put(`/api/v1/notifications/${id}/read`);
    return res.data?.data;
  },
  markAllNotificationsRead: async () => {
    const res = await api.put('/api/v1/notifications/read-all');
    return res.data?.data;
  },
  deleteNotification: async (id) => {
    const res = await api.delete(`/api/v1/notifications/${id}`);
    return res.data?.data;
  },

  // ── BOM ───────────────────────────────────────────────────────────
  listBom: async (parentPartId) => {
    const res = await api.get(`/api/v1/plm/parts/${parentPartId}/bom`);
    return res.data.data;
  },
  addBomLine: async (parentPartId, payload) => {
    const res = await api.post(`/api/v1/plm/parts/${parentPartId}/bom`, payload);
    return res.data.data;
  },
  deleteBomLine: async (bomLineId) => {
    const res = await api.delete(`/api/v1/plm/bom-lines/${bomLineId}`);
    return res.data.data;
  },

  // ── Audit ──────────────────────────────────────────────────────────
  getAudit: async (entityType, entityId) => {
    const res = await api.get('/api/v1/plm/audit', { params: { entityType, entityId } });
    return res.data.data;
  },

  // ── Changes (ECR) ────────────────────────────────────────────
  createEcr: async (payload) => {
    const res = await api.post('/api/changes/ecr', payload);
    return res.data;
  },
  submitEcr: async (id, payload) => {
    const res = await api.post(`/api/changes/ecr/${id}/submit`, payload);
    return res.data;
  },
  listEcrs: async (statusOrNull) => {
    const params = {};
    if (statusOrNull) params.status = statusOrNull;
    const res = await api.get('/api/changes/ecr', { params });
    return res.data;
  },
  getEcrDetails: async (id) => {
    const res = await api.get(`/api/changes/ecr/${id}/details`);
    return res.data;
  },
  getEcrInsights: async (id) => {
    const res = await api.get(`/api/changes/ecr/${id}/insights`);
    return res.data;
  },
  analyzeEcr: async (id) => {
    const res = await api.post(`/api/changes/ecr/${id}/analyze`);
    return res.data;
  },

  // ── Changes (tasks) ─────────────────────────────────────────
  getMyChangeTasks: async (pendingOnly = true) => {
    const res = await api.get('/api/changes/tasks/my', { params: { pendingOnly } });
    return res.data;
  },
  approveChangeTask: async (taskId, comment) => {
    const payload = comment ? { comment } : { comment: '' };
    const res = await api.post(`/api/changes/tasks/${taskId}/approve`, payload);
    return res.data;
  },
  rejectChangeTask: async (taskId, comment) => {
    const res = await api.post(`/api/changes/tasks/${taskId}/reject`, { comment: comment || '' });
    return res.data;
  },
};
