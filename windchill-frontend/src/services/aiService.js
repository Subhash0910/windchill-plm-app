import api from '../utils/api';
import { getUser } from '../utils/localStorage';

export const AI_MODES = {
  LEARNING_ASSIST: 'learning_assist',
  PROCESS_INSIGHT: 'process_insight',
};

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

const getCurrentUserId = () => getUser()?.id ?? 1;

export const aiService = {
  /**
   * Analyze change impact for a part — returns risk score, confidence, risk level,
   * factors, and affected parts.
   */
  analyzeImpact: async ({ partId, changeType, lifecycleState, bomDepth, whereUsedCount }) => {
    const response = await api.post('/api/v1/ai/analyze-impact', {
      partId: Number(partId),
      changeType,
      ...(lifecycleState ? { lifecycleState } : {}),
      ...(bomDepth != null ? { bomDepth: Number(bomDepth) } : {}),
      ...(whereUsedCount != null ? { whereUsedCount: Number(whereUsedCount) } : {}),
    });
    return unwrap(response);
  },

  /**
   * Convenience alias — analyze risk for a single part.
   */
  analyzeRisk: async (partId, changeType, lifecycleState, bomDepth, whereUsedCount) =>
    aiService.analyzeImpact({ partId, changeType, lifecycleState, bomDepth, whereUsedCount }),

  checkHealth: async () => {
    const response = await api.get('/api/v1/ai/health');
    return unwrap(response);
  },

  learningAssist: async ({ message, context = {}, sessionId } = {}) => {
    const response = await api.post('/api/v1/ai/chat', {
      mode: AI_MODES.LEARNING_ASSIST,
      message,
      context,
      sessionId,
      userId: getCurrentUserId(),
    });
    return unwrap(response);
  },

  processInsight: async ({ message, partNumber, partId, changeType, sessionId } = {}) => {
    const response = await api.post('/api/v1/ai/chat', {
      mode: AI_MODES.PROCESS_INSIGHT,
      message,
      context: {
        ...(partNumber ? { part_number: partNumber } : {}),
        ...(partId ? { part_id: partId } : {}),
        ...(changeType ? { change_type: changeType } : {}),
      },
      sessionId,
      userId: getCurrentUserId(),
    });
    return unwrap(response);
  },

  /**
   * Get AI contextual guidance for a part — facts, recommended actions, warnings,
   * confidence, risk score, risk level, and assessment.
   */
  getPartGuidance: async (partId) => {
    const response = await api.get(`/api/v1/ai/contextual/parts/${partId}`);
    return unwrap(response);
  },

  /**
   * Alias — get full part insights (same as getPartGuidance).
   */
  getPartInsights: async (partId) => aiService.getPartGuidance(partId),

  getEcrReviewSummary: async (ecrId) => {
    const response = await api.get(`/api/v1/ai/contextual/ecrs/${ecrId}`);
    return unwrap(response);
  },

  getWorkItemSummary: async (workItemId) => {
    const response = await api.get(`/api/v1/ai/contextual/workitems/${workItemId}`);
    return unwrap(response);
  },

  getDocumentGuidance: async (documentId) => {
    const response = await api.get(`/api/v1/ai/contextual/documents/${documentId}`);
    return unwrap(response);
  },
};

export const analyzeImpact = aiService.analyzeImpact;
export const analyzeRisk = aiService.analyzeRisk;
export const checkAIHealth = aiService.checkHealth;
export const learningAssist = aiService.learningAssist;
export const processInsight = aiService.processInsight;
export const getPartGuidance = aiService.getPartGuidance;
export const getPartInsights = aiService.getPartInsights;
export const getEcrReviewSummary = aiService.getEcrReviewSummary;
export const getWorkItemSummary = aiService.getWorkItemSummary;
export const getDocumentGuidance = aiService.getDocumentGuidance;

export default aiService;
