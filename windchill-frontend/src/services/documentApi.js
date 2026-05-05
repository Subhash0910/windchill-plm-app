/**
 * documentApi.js  —  WTDocument service calls (Phase 2)
 * All endpoints: /api/v1/plm/documents
 */
import api from '../utils/api';

export const documentApi = {

  // ---- list / get -------------------------------------------------------
  list:      async (contextId, docType) => {
    const r = await api.get('/api/v1/plm/documents', {
      params: { contextId, ...(docType ? { docType } : {}) }
    });
    return r.data?.data ?? [];
  },

  get: async (id) => {
    const r = await api.get(`/api/v1/plm/documents/${id}`);
    return r.data?.data;
  },

  // ---- create / update / delete ----------------------------------------
  create: async (payload) => {
    const r = await api.post('/api/v1/plm/documents', payload);
    return r.data?.data;
  },

  update: async (id, payload) => {
    const r = await api.put(`/api/v1/plm/documents/${id}`, payload);
    return r.data?.data;
  },

  delete: async (id) => {
    const r = await api.delete(`/api/v1/plm/documents/${id}`);
    return r.data?.data;
  },

  // ---- lifecycle --------------------------------------------------------
  promote: async (id, target) => {
    const r = await api.post(`/api/v1/plm/documents/${id}/promote`, null, {
      params: { target }
    });
    return r.data?.data;
  },

  // ---- checkout ---------------------------------------------------------
  checkOut:    async (id) => { const r = await api.post(`/api/v1/plm/documents/${id}/checkout`);      return r.data?.data; },
  checkIn:     async (id) => { const r = await api.post(`/api/v1/plm/documents/${id}/checkin`);       return r.data?.data; },
  undoCheckOut:async (id) => { const r = await api.post(`/api/v1/plm/documents/${id}/undo-checkout`); return r.data?.data; },

  // ---- part links -------------------------------------------------------
  byPart:      async (partId) => { const r = await api.get(`/api/v1/plm/documents/by-part/${partId}`); return r.data?.data ?? []; },
  byDoc:       async (docId)  => { const r = await api.get(`/api/v1/plm/documents/by-doc/${docId}`); return r.data?.data ?? []; },
  linkPart:    async (docId, partId) => api.post(`/api/v1/plm/documents/${docId}/link-part/${partId}`),
  unlinkPart:  async (docId, partId) => api.delete(`/api/v1/plm/documents/${docId}/link-part/${partId}`),
};
