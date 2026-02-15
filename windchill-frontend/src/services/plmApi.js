import api from '../utils/api';

export const plmApi = {
  // Contexts
  listContexts: async () => {
    const res = await api.get('/api/v1/plm/contexts');
    return res.data.data;
  },
  createContext: async (payload) => {
    const res = await api.post('/api/v1/plm/contexts', payload);
    return res.data.data;
  },

  // Folders
  listFolders: async (contextId) => {
    const res = await api.get(`/api/v1/plm/contexts/${contextId}/folders`);
    return res.data.data;
  },
  createFolder: async (contextId, payload) => {
    const res = await api.post(`/api/v1/plm/contexts/${contextId}/folders`, payload);
    return res.data.data;
  },

  // Parts
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
  promotePart: async (id, target) => {
    const res = await api.post(`/api/v1/plm/parts/${id}/promote`, null, { params: { target } });
    return res.data.data;
  },
  revisePart: async (id) => {
    const res = await api.post(`/api/v1/plm/parts/${id}/revise`);
    return res.data.data;
  },

  // BOM
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

  // Audit
  getAudit: async (entityType, entityId) => {
    const res = await api.get('/api/v1/plm/audit', { params: { entityType, entityId } });
    return res.data.data;
  },
};
