import api from '../utils/api';

// ── ECR (Change Requests) ─────────────────────────────────────────────────────
// Backend: GET /api/v1/plm/changes?contextId={id}  (query param, not path param)
export const getEcrsByContext  = (ctxId)     => api.get('/api/v1/plm/changes', { params: { contextId: ctxId } });
export const getEcrsPaginated  = (ctxId, page, size, sortBy = 'id', sortDir = 'desc') =>
  api.get('/api/v1/plm/changes/paginated', { params: { contextId: ctxId, page, size, sortBy, sortDir } });
export const getEcrById        = (id)        => api.get(`/api/v1/plm/changes/${id}`);
export const createEcr         = (data)      => api.post('/api/v1/plm/changes', data);
export const promoteEcr        = (id, state) => api.post(`/api/v1/plm/changes/${id}/promote?targetState=${state}`);
export const submitEcr         = (id)        => api.post(`/api/v1/plm/changes/${id}/submit`);
export const startEcrReview    = (id)        => api.post(`/api/v1/plm/changes/${id}/start-review`);
export const approveEcr        = (id, body)  => api.post(`/api/v1/plm/changes/${id}/approve`, body);
export const rejectEcr         = (id, body)  => api.post(`/api/v1/plm/changes/${id}/reject`, body);
export const closeEcr          = (id)        => api.post(`/api/v1/plm/changes/${id}/close`);
export const reopenEcr         = (id)        => api.post(`/api/v1/plm/changes/${id}/reopen`);
export const deleteEcr         = (id)        => api.delete(`/api/v1/plm/changes/${id}`);

// ── ECO (Change Orders) ───────────────────────────────────────────────────────
// Backend: GET /api/v1/plm/changes/eco/context/{id}  (ChangeOrderController — plain list, no ApiResponse wrapper)
export const getEcosByContext  = (ctxId)     => api.get(`/api/v1/plm/changes/eco/context/${ctxId}`);
export const getEcosPaginated  = async (ctxId, page, size) => {
  const r = await api.get(`/api/v1/plm/changes/eco/context/${ctxId}`);
  const all = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
  const totalElements = all.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const start = page * size;
  const content = all.slice(start, start + size);
  return { data: { data: { content, totalElements, totalPages, page, size } } };
};
export const getEcoById        = (id)        => api.get(`/api/v1/plm/changes/eco/${id}`);
export const getEcosByEcr      = (ecrId)     => api.get(`/api/v1/plm/changes/eco/by-ecr/${ecrId}`);
export const createEco         = (data)      => api.post('/api/v1/plm/changes/eco', data);
export const promoteEco        = (id, state) => api.post(`/api/v1/plm/changes/eco/${id}/promote?targetState=${state}`);
export const linkEcoAiResult   = (id, body)  => api.post(`/api/v1/plm/changes/eco/${id}/ai-result`, body);
export const deleteEco         = (id)        => api.delete(`/api/v1/plm/changes/eco/${id}`);

// ── Change Tasks (ChangeActivities) ────────────────────────────────────────────
// Backend: ChangeTaskController at /api/v1/plm/change-tasks
export const getTasksByOrder    = (orderId, status) => {
  const params = status ? { status } : {};
  return api.get(`/api/v1/plm/change-tasks/by-order/${orderId}`, { params });
};
export const getMyTasks         = (userId)   => api.get('/api/v1/plm/change-tasks/my-tasks', { params: { assigneeUserId: userId } });
export const createChangeTask   = (data)     => api.post('/api/v1/plm/change-tasks', data);
export const updateChangeTask   = (id, data) => api.put(`/api/v1/plm/change-tasks/${id}`, data);
export const startChangeTask    = (id)       => api.post(`/api/v1/plm/change-tasks/${id}/start`);
export const completeChangeTask = (id, body) => api.post(`/api/v1/plm/change-tasks/${id}/complete`, body);
export const cancelChangeTask   = (id)       => api.post(`/api/v1/plm/change-tasks/${id}/cancel`);
export const deleteChangeTask   = (id)       => api.delete(`/api/v1/plm/change-tasks/${id}`);
