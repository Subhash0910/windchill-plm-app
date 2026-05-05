import api from '../utils/api';
import { getUser } from '../utils/localStorage';

export const AI_MODES = {
  LEARNING_ASSIST: 'learning_assist',
  PROCESS_INSIGHT: 'process_insight',
};

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

const getCurrentUserId = () => getUser()?.id ?? 1;

export const aiService = {
  analyzeImpact: async (partId, changeType) => {
    const response = await api.post('/api/v1/ai/analyze-impact', {
      partId: Number(partId),
      changeType,
    });
    return unwrap(response);
  },

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

  getPartGuidance: async (partId) => {
    const response = await api.get(`/api/v1/ai/contextual/parts/${partId}`);
    return unwrap(response);
  },

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
export const checkAIHealth = aiService.checkHealth;
export const learningAssist = aiService.learningAssist;
export const processInsight = aiService.processInsight;
export const getPartGuidance = aiService.getPartGuidance;
export const getEcrReviewSummary = aiService.getEcrReviewSummary;
export const getWorkItemSummary = aiService.getWorkItemSummary;
export const getDocumentGuidance = aiService.getDocumentGuidance;

export default aiService;
