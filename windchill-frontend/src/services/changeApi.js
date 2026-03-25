import api from '../utils/api';

// ── ECR (Change Requests) ─────────────────────────────────────────────────────
// Backend: GET /api/v1/plm/changes?contextId={id}  (query param, not path param)
export const getEcrsByContext  = (ctxId)     => api.get('/api/v1/plm/changes', { params: { contextId: ctxId } });
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
export const getEcoById        = (id)        => api.get(`/api/v1/plm/changes/eco/${id}`);
export const getEcosByEcr      = (ecrId)     => api.get(`/api/v1/plm/changes/eco/by-ecr/${ecrId}`);
export const createEco         = (data)      => api.post('/api/v1/plm/changes/eco', data);
export const promoteEco        = (id, state) => api.post(`/api/v1/plm/changes/eco/${id}/promote?targetState=${state}`);
export const linkEcoAiResult   = (id, body)  => api.post(`/api/v1/plm/changes/eco/${id}/ai-result`, body);
export const deleteEco         = (id)        => api.delete(`/api/v1/plm/changes/eco/${id}`);
