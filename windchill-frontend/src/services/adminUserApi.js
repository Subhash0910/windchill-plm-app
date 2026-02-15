import api from '../utils/api';

export const adminUserApi = {
  list: async () => {
    const res = await api.get('/api/v1/admin/users');
    return res.data.data;
  },
  create: async (payload) => {
    const res = await api.post('/api/v1/admin/users', payload);
    return res.data.data;
  },
  setActive: async (id, active) => {
    const res = await api.patch(`/api/v1/admin/users/${id}/status`, { active });
    return res.data.data;
  },
  resetPassword: async (id, newPassword) => {
    const res = await api.post(`/api/v1/admin/users/${id}/reset-password`, { newPassword });
    return res.data.data;
  },
};
