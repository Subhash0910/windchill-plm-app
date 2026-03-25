import plmApi from './plmApi';

// ── ECR (Change Requests) ──────────────────────────────────────────────────
export const getEcrsByContext   = (ctxId)        => plmApi.get(`/changes/ecr/context/${ctxId}`);
export const getEcrById         = (id)           => plmApi.get(`/changes/ecr/${id}`);
export const createEcr          = (data)         => plmApi.post('/changes/ecr', data);
export const promoteEcr         = (id, state)    => plmApi.post(`/changes/ecr/${id}/promote?targetState=${state}`);
export const deleteEcr          = (id)           => plmApi.delete(`/changes/ecr/${id}`);

// ── ECO (Change Orders) ────────────────────────────────────────────────────
export const getEcosByContext   = (ctxId)        => plmApi.get(`/changes/eco/context/${ctxId}`);
export const getEcoById         = (id)           => plmApi.get(`/changes/eco/${id}`);
export const getEcosByEcr       = (ecrId)        => plmApi.get(`/changes/eco/by-ecr/${ecrId}`);
export const createEco          = (data)         => plmApi.post('/changes/eco', data);
export const promoteEco         = (id, state)    => plmApi.post(`/changes/eco/${id}/promote?targetState=${state}`);
export const linkEcoAiResult    = (id, body)     => plmApi.post(`/changes/eco/${id}/ai-result`, body);
export const deleteEco          = (id)           => plmApi.delete(`/changes/eco/${id}`);
