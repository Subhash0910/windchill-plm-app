import api from '../utils/api';

export const plmApi = {
  // ── Contexts ────────────────────────────────────────────────────────────────────
  listContexts:     async ()        => { const r = await api.get('/api/v1/plm/contexts'); return r.data.data; },
  getContextById:   async (id)      => { const r = await api.get(`/api/v1/plm/contexts/${id}`); return r.data.data; },
  createContext:    async (p)       => { const r = await api.post('/api/v1/plm/contexts', p); return r.data.data; },
  updateContext:    async (id, p)   => { const r = await api.put(`/api/v1/plm/contexts/${id}`, p); return r.data.data; },
  deleteContext:    async (id)      => { const r = await api.delete(`/api/v1/plm/contexts/${id}`); return r.data.data; },

  // ── Context Team / Members ──────────────────────────────────────────────
  listContextMembers:      async (cid)            => { const r = await api.get(`/api/v1/plm/contexts/${cid}/members`); return r.data.data; },
  addContextMember:        async (cid, p)         => { const r = await api.post(`/api/v1/plm/contexts/${cid}/members`, p); return r.data.data; },
  updateContextMemberRole: async (cid, uid, role) => { const r = await api.patch(`/api/v1/plm/contexts/${cid}/members/${uid}`, { role }); return r.data.data; },
  removeContextMember:     async (cid, uid)       => { const r = await api.delete(`/api/v1/plm/contexts/${cid}/members/${uid}`); return r.data.data; },

  // ── Folders ───────────────────────────────────────────────────────────
  listFolders:  async (cid)      => { const r = await api.get(`/api/v1/plm/contexts/${cid}/folders`); return r.data.data; },
  createFolder: async (cid, p)   => { const r = await api.post(`/api/v1/plm/contexts/${cid}/folders`, p); return r.data.data; },
  deleteFolder: async (cid, fid) => { const r = await api.delete(`/api/v1/plm/contexts/${cid}/folders/${fid}`); return r.data.data; },

  // ── Parts ──────────────────────────────────────────────────────────────
  listParts:   async (contextId)          => { const r = await api.get('/api/v1/plm/parts', { params: { contextId } }); return r.data.data; },
  searchParts: async (kw, contextId)      => {
    const r = await api.get('/api/v1/plm/parts/search', { params: { keyword: kw, ...(contextId ? { contextId } : {}) } });
    return r.data.data ?? [];
  },
  getPartsByFolder: async (contextId, folderId) => {
    const r = await api.get('/api/v1/plm/parts', { params: { contextId, folderId } });
    return r.data.data ?? [];
  },
  getPart:      async (id)       => { const r = await api.get(`/api/v1/plm/parts/${id}`); return r.data.data; },
  createPart:   async (p)        => { const r = await api.post('/api/v1/plm/parts', p); return r.data.data; },
  updatePart:   async (id, p)    => { const r = await api.put(`/api/v1/plm/parts/${id}`, p); return r.data.data; },
  deletePart:   async (id)       => { const r = await api.delete(`/api/v1/plm/parts/${id}`); return r.data.data; },
  promotePart:  async (id, target) => { const r = await api.post(`/api/v1/plm/parts/${id}/promote`, null, { params: { target } }); return r.data.data; },
  revisePart:   async (id)       => { const r = await api.post(`/api/v1/plm/parts/${id}/revise`); return r.data.data; },
  getWhereUsed: async (id)       => { const r = await api.get(`/api/v1/plm/parts/${id}/where-used`); return r.data.data; },

  findSimilarParts: async (partNumber, name) => {
    try {
      const r = await api.get('/api/v1/plm/parts/similar', { params: { partNumber, name } });
      return r.data.data ?? [];
    } catch { return []; }
  },

  // ── Parts — Checkout / Checkin (Phase 0) ───────────────────────────────
  checkOutPart:    async (id)            => { const r = await api.post(`/api/v1/plm/parts/${id}/checkout`);         return r.data.data; },
  checkInPart:     async (id, body = {}) => { const r = await api.post(`/api/v1/plm/parts/${id}/checkin`, body);    return r.data.data; },
  undoCheckOut:    async (id)            => { const r = await api.post(`/api/v1/plm/parts/${id}/undo-checkout`);    return r.data.data; },
  getVersionLabel: async (id)            => { const r = await api.get(`/api/v1/plm/parts/${id}/version-label`);    return r.data.data; },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardStats: async (contextId) => { const r = await api.get('/api/v1/plm/dashboard/stats', { params: { contextId } }); return r.data.data; },

  // ── Promotions ────────────────────────────────────────────────────────────
  getLatestPromotion:    async (partId)      => { const r = await api.get(`/api/v1/plm/promotions/parts/${partId}/latest`); return r.data.data; },
  listPromotionRequests: async (contextId)   => {
    const r = await api.get('/api/v1/plm/promotions', { params: contextId ? { contextId } : {} });
    return r.data.data ?? [];
  },
  approvePromotion: async (id, comment) => { const r = await api.post(`/api/v1/plm/promotions/${id}/approve`, comment ? { comment } : null); return r.data.data; },
  rejectPromotion:  async (id, comment) => { const r = await api.post(`/api/v1/plm/promotions/${id}/reject`, { comment: comment || '' }); return r.data.data; },

  // ── Worklist ─────────────────────────────────────────────────────────────
  listMyWorkItems: async ()             => { const r = await api.get('/api/v1/plm/workitems/my'); return r.data.data; },
  approveWorkItem: async (id, comment)  => { const r = await api.post(`/api/v1/plm/workitems/${id}/approve`, comment ? { comment } : null); return r.data.data; },
  rejectWorkItem:  async (id, comment)  => { const r = await api.post(`/api/v1/plm/workitems/${id}/reject`, { comment }); return r.data.data; },

  // ── Notifications ──────────────────────────────────────────────────────────
  getNotificationCount:     async ()   => { const r = await api.get('/api/v1/notifications/count');       return r.data?.data?.unreadCount ?? 0; },
  getNotifications:         async ()   => { const r = await api.get('/api/v1/notifications');              return r.data?.data ?? []; },
  getUnreadNotifications:   async ()   => { const r = await api.get('/api/v1/notifications/unread');      return r.data?.data ?? []; },
  markNotificationRead:     async (id) => { const r = await api.put(`/api/v1/notifications/${id}/read`);  return r.data?.data; },
  markAllNotificationsRead: async ()   => { const r = await api.put('/api/v1/notifications/read-all');   return r.data?.data; },
  deleteNotification:       async (id) => { const r = await api.delete(`/api/v1/notifications/${id}`);   return r.data?.data; },

  // ── BOM ─────────────────────────────────────────────────────────────────
  listBom:       async (pid)     => { const r = await api.get(`/api/v1/plm/parts/${pid}/bom`); return r.data.data; },
  addBomLine:    async (pid, p)  => { const r = await api.post(`/api/v1/plm/parts/${pid}/bom`, p); return r.data.data; },
  deleteBomLine: async (id)      => { const r = await api.delete(`/api/v1/plm/bom-lines/${id}`); return r.data.data; },

  // ── Action Model Registry ─────────────────────────────────────────────────
  listActionModels:    async (objectType) => {
    const r = await api.get('/api/v1/plm/actions', { params: objectType ? { objectType } : {} });
    return r.data?.data ?? [];
  },
  createActionModel:   async (body)       => { const r = await api.post('/api/v1/plm/actions', body); return r.data?.data; },
  updateActionModel:   async (id, body)   => { const r = await api.put(`/api/v1/plm/actions/${id}`, body); return r.data?.data; },
  toggleActionModel:   async (id)         => { const r = await api.patch(`/api/v1/plm/actions/${id}/toggle`); return r.data?.data; },
  deleteActionModel:   async (id)         => { const r = await api.delete(`/api/v1/plm/actions/${id}`); return r.data?.data; },
  getActionXml:        async (id)         => { const r = await api.get(`/api/v1/plm/actions/${id}/xml`); return r.data?.data; },

  // ── IBA (Instance-Based Attributes) ─────────────────────────────────────
  listIbaAttributes:   async (partId)       => { const r = await api.get(`/api/v1/plm/parts/${partId}/iba`); return r.data?.data ?? []; },
  createIbaAttribute:  async (partId, body) => { const r = await api.post(`/api/v1/plm/parts/${partId}/iba`, body); return r.data?.data; },
  updateIbaAttribute:  async (partId, id, body) => { const r = await api.put(`/api/v1/plm/parts/${partId}/iba/${id}`, body); return r.data?.data; },
  deleteIbaAttribute:  async (partId, id)   => { const r = await api.delete(`/api/v1/plm/parts/${partId}/iba/${id}`); return r.data?.data; },

  // ── Part Substitutes / Alternates ──────────────────────────────────────
  listSubstitutes:   async (partId)       => { const r = await api.get(`/api/v1/plm/parts/${partId}/substitutes`); return r.data?.data ?? []; },
  addSubstitute:     async (partId, body) => { const r = await api.post(`/api/v1/plm/parts/${partId}/substitutes`, body); return r.data?.data; },
  deleteSubstitute:  async (partId, id)   => { const r = await api.delete(`/api/v1/plm/parts/${partId}/substitutes/${id}`); return r.data?.data; },

  // ── Audit ──────────────────────────────────────────────────────────────
  getAudit: async (entityType, entityId) => {
    const r = await api.get('/api/v1/plm/audit', { params: { entityType, entityId } });
    return r.data.data;
  },
  getAllAuditLogs: async (limit = 200) => {
    const r = await api.get('/api/v1/plm/audit/all', { params: { limit } });
    return r.data?.data ?? [];
  },

  // ── Changes (ECR / ECO / ECN) ─────────────────────────────────────────
  listEcrs:        async (contextId, status) => {
    const r = await api.get('/api/v1/plm/changes', { params: { ...(contextId ? { contextId } : {}), ...(status ? { status } : {}) } });
    return r.data?.data ?? r.data ?? [];
  },
  getEcr:          async (id)            => { const r = await api.get(`/api/v1/plm/changes/${id}`);                    return r.data?.data ?? r.data; },
  createEcr:       async (body)          => { const r = await api.post('/api/v1/plm/changes', body);                    return r.data?.data ?? r.data; },
  submitEcr:       async (id, body)      => { const r = await api.post(`/api/v1/plm/changes/${id}/submit`, body ?? null); return r.data?.data ?? r.data; },
  startEcrReview:  async (id)            => { const r = await api.post(`/api/v1/plm/changes/${id}/start-review`);      return r.data?.data ?? r.data; },
  approveEcr:      async (id, comment)   => { const r = await api.post(`/api/v1/plm/changes/${id}/approve`,  { comment: comment || '' }); return r.data?.data ?? r.data; },
  rejectEcr:       async (id, comment)   => { const r = await api.post(`/api/v1/plm/changes/${id}/reject`,   { comment: comment || '' }); return r.data?.data ?? r.data; },
  closeEcr:        async (id)            => { const r = await api.post(`/api/v1/plm/changes/${id}/close`);              return r.data?.data ?? r.data; },
  reopenEcr:       async (id)            => { const r = await api.post(`/api/v1/plm/changes/${id}/reopen`);             return r.data?.data ?? r.data; },
  getEcrOrderItems:async (id)            => { const r = await api.get(`/api/v1/plm/changes/${id}/order-items`);        return r.data?.data ?? []; },
  getEcrNotice:    async (id)            => { try { const r = await api.get(`/api/v1/plm/changes/ecn/by-ecr/${id}`); return r.data?.data ?? null; } catch { return null; } },
  listEcns:        async (contextId)     => { try { const r = await api.get('/api/v1/plm/changes/ecn', { params: { contextId } }); return r.data?.data ?? []; } catch { return []; } },
  getEcn:          async (id)            => { const r = await api.get(`/api/v1/plm/changes/ecn/${id}`); return r.data?.data ?? r.data; },
  promoteEcn:      async (id, target)    => { const r = await api.post(`/api/v1/plm/changes/ecn/${id}/promote`, null, { params: { target } }); return r.data?.data ?? r.data; },
  updateEcn:       async (id, body)      => { const r = await api.patch(`/api/v1/plm/changes/ecn/${id}`, body); return r.data?.data ?? r.data; },
  createEcn:       async (body)          => { const r = await api.post('/api/v1/plm/changes/ecn', body); return r.data?.data ?? r.data; },

  getEcrDetails: async (id) => {
    const [ecr, ecn] = await Promise.all([
      plmApi.getEcr(id),
      plmApi.getEcrNotice(id),
    ]);
    return {
      ecr,
      ecn,
      tasks: [],
    };
  },

  getEcrInsights: async (id) => {
    try {
      const contextual = await api.get(`/api/v1/ai/contextual/ecrs/${id}`);
      return {
        impact: null,
        contextual: contextual.data?.data ?? null,
      };
    } catch (error) {
      return {
        impact: null,
        contextual: null,
      };
    }
  },

  analyzeEcr: async (id) => {
    const insights = await plmApi.getEcrInsights(id);
    return insights?.contextual ?? null;
  },

  getEcrAiImpact: async (id) => {
    try {
      const r = await api.get(`/api/v1/ai/impact/ecr/${id}`);
      return r.data;
    } catch {
      return null;
    }
  },

  // ── Change Orders (ECO) ───────────────────────────────────────────────
  getEco:       async (id)                  => { const r = await api.get(`/api/v1/plm/changes/eco/${id}`);                              return r.data; },
  listEcoByContext: async (contextId)       => { const r = await api.get(`/api/v1/plm/changes/eco/context/${contextId}`);               return r.data ?? []; },
  promoteEco:   async (id, targetState)     => { const r = await api.post(`/api/v1/plm/changes/eco/${id}/promote`, null, { params: { targetState } }); return r.data; },
  deleteEco:    async (id)                  => api.delete(`/api/v1/plm/changes/eco/${id}`),

  // ── Change Tasks (legacy alias → ECN list) ────────────────────────────
  getMyChangeTasks:  async ()             => { const r = await api.get('/api/v1/plm/workitems/my'); return r.data.data ?? []; },
  approveChangeTask: async (id, comment)  => { const r = await api.post(`/api/v1/plm/workitems/${id}/approve`, comment ? { comment } : null); return r.data.data; },
  rejectChangeTask:  async (id, comment)  => { const r = await api.post(`/api/v1/plm/workitems/${id}/reject`, { comment: comment || '' }); return r.data.data; },

  // ── Documents ───────────────────────────────────────────────────────────
  getAllDocuments:        async ()      => { const r = await api.get('/api/v1/documents'); return r.data?.data ?? []; },
  getDocumentById:       async (id)    => { const r = await api.get(`/api/v1/documents/${id}`); return r.data?.data; },
  searchDocuments:       async (kw)    => { const r = await api.get('/api/v1/documents/search', { params: { keyword: kw } }); return r.data?.data ?? []; },
  createDocument:        async (p)     => { const r = await api.post('/api/v1/documents', p); return r.data?.data; },
  updateDocument:        async (id, p) => { const r = await api.put(`/api/v1/documents/${id}`, p); return r.data?.data; },
  deleteDocument:        async (id)    => { const r = await api.delete(`/api/v1/documents/${id}`); return r.data?.data; },
  getDocumentsByProject: async (pid)   => { const r = await api.get(`/api/v1/documents/project/${pid}`); return r.data?.data ?? []; },

  // ── Products ────────────────────────────────────────────────────────────
  getAllProducts:        async ()      => { const r = await api.get('/api/v1/products'); return r.data?.data ?? []; },
  getProductById:       async (id)    => { const r = await api.get(`/api/v1/products/${id}`); return r.data?.data; },
  searchProducts:       async (kw)    => { const r = await api.get('/api/v1/products/search', { params: { keyword: kw } }); return r.data?.data ?? []; },
  createProduct:        async (p)     => { const r = await api.post('/api/v1/products', p); return r.data?.data; },
  updateProduct:        async (id, p) => { const r = await api.put(`/api/v1/products/${id}`, p); return r.data?.data; },
  deleteProduct:        async (id)    => { const r = await api.delete(`/api/v1/products/${id}`); return r.data?.data; },
  getProductsByProject: async (pid)   => { const r = await api.get(`/api/v1/products/project/${pid}`); return r.data?.data ?? []; },

  // ── Projects ────────────────────────────────────────────────────────────
  getAllProjects:         async ()                => { const r = await api.get('/api/v1/projects'); return r.data?.data ?? []; },
  getProjectById:        async (id)              => { const r = await api.get(`/api/v1/projects/${id}`); return r.data?.data; },
  searchProjects:        async (kw)              => { const r = await api.get('/api/v1/projects/search', { params: { keyword: kw } }); return r.data?.data ?? []; },
  createProject:         async (p)               => { const r = await api.post('/api/v1/projects', p); return r.data?.data; },
  updateProject:         async (id, p)           => { const r = await api.put(`/api/v1/projects/${id}`, p); return r.data?.data; },
  updateProjectProgress: async (id, progress)    => { const r = await api.put(`/api/v1/projects/${id}/progress`, null, { params: { progress } }); return r.data?.data; },
  deleteProject:         async (id)              => { const r = await api.delete(`/api/v1/projects/${id}`); return r.data?.data; },
};
