import api from '../utils/api';

const BASE = '/api/v1/admin/data-utilities';

export const dataUtilitiesApi = {
  getSystemInfo: async () => {
    const res = await api.get(`${BASE}/system-info`);
    return res.data.data;
  },

  seedDemoData: async (contextId) => {
    const res = await api.post(`${BASE}/seed-demo-data`, { contextId });
    return res.data;
  },

  getDbStats: async () => {
    const res = await api.get(`${BASE}/db-stats`);
    return res.data.data;
  },

  reindex: async () => {
    const res = await api.post(`${BASE}/reindex`);
    return res.data;
  },

  getCacheStats: async () => {
    const res = await api.get(`${BASE}/cache-stats`);
    return res.data.data;
  },

  // ── Preferences ──────────────────────────────────────────────────────────
  getPreferences: async (params = {}) => {
    const res = await api.get('/api/v1/admin/preferences', { params });
    return res.data.data;
  },

  resolvePreference: async (key, contextId, userId) => {
    const res = await api.get('/api/v1/admin/preferences/resolve', {
      params: { key, contextId, userId },
    });
    return res.data.data;
  },

  createPreference: async (pref) => {
    const res = await api.post('/api/v1/admin/preferences', pref);
    return res.data;
  },

  updatePreference: async (id, pref) => {
    const res = await api.post('/api/v1/admin/preferences', pref);
    return res.data;
  },

  deletePreference: async (id) => {
    const res = await api.delete(`/api/v1/admin/preferences/${id}`);
    return res.data;
  },

  // ── Numbering Schemes ────────────────────────────────────────────────────
  getNumberingSchemes: async (params = {}) => {
    const res = await api.get('/api/v1/admin/numbering', { params });
    return res.data.data;
  },

  createNumberingScheme: async (scheme) => {
    const res = await api.post('/api/v1/admin/numbering', scheme);
    return res.data;
  },

  updateNumberingScheme: async (id, scheme) => {
    const res = await api.put(`/api/v1/admin/numbering/${id}`, scheme);
    return res.data;
  },

  resetNumberingScheme: async (id) => {
    const res = await api.post(`/api/v1/admin/numbering/${id}/reset`);
    return res.data;
  },

  generateNumber: async (targetType) => {
    const res = await api.post('/api/v1/admin/numbering/generate', null, {
      params: { targetType },
    });
    return res.data;
  },

  // ── Object Templates ─────────────────────────────────────────────────────
  getTemplates: async (params = {}) => {
    const res = await api.get('/api/v1/admin/templates', { params });
    return res.data.data;
  },

  createTemplate: async (tmpl) => {
    const res = await api.post('/api/v1/admin/templates', tmpl);
    return res.data;
  },

  updateTemplate: async (id, tmpl) => {
    const res = await api.put(`/api/v1/admin/templates/${id}`, tmpl);
    return res.data;
  },

  deleteTemplate: async (id) => {
    const res = await api.delete(`/api/v1/admin/templates/${id}`);
    return res.data;
  },

  applyTemplate: async (id) => {
    const res = await api.post(`/api/v1/admin/templates/${id}/apply`);
    return res.data;
  },
};
