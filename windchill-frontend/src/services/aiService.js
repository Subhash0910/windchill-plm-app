/**
 * AI Service API Client
 * Handles all AI-related API calls
 */

const API_BASE = '/api/v1';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Get current user ID
 */
const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id || 1;
  } catch {
    return 1;
  }
};

/**
 * Analyze impact of a change on a part
 * @param {number|string} partId - Part ID
 * @param {string} changeType - Type of change (OBSOLETE, MODIFY, etc.)
 * @returns {Promise<Object>} Impact analysis result
 */
export const analyzeImpact = async (partId, changeType) => {
  const response = await fetch(`${API_BASE}/ai/impact/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      partId: parseInt(partId),
      changeType: changeType,
      userId: getCurrentUserId()
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Analysis failed: ${response.status}`);
  }

  return response.json();
};

/**
 * Get AI-recommended reviewers for a change
 * @param {number|string} partId - Part ID
 * @param {string} changeType - Type of change
 * @returns {Promise<Array>} List of recommended reviewers
 */
export const getRecommendedReviewers = async (partId, changeType) => {
  const response = await fetch(`${API_BASE}/ai/reviewers/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      partId: parseInt(partId),
      changeType: changeType
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get reviewer recommendations');
  }

  return response.json();
};

/**
 * Check AI service health
 * @returns {Promise<Object>} Health status
 */
export const checkAIHealth = async () => {
  const response = await fetch(`${API_BASE}/ai/health`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });

  if (!response.ok) {
    throw new Error('AI service health check failed');
  }

  return response.json();
};

/**
 * Get impact analysis for multiple parts (batch)
 * @param {Array<Object>} parts - Array of {partId, changeType}
 * @returns {Promise<Array>} Array of impact analyses
 */
export const batchAnalyzeImpact = async (parts) => {
  const response = await fetch(`${API_BASE}/ai/impact/batch-analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      parts: parts.map(p => ({
        partId: parseInt(p.partId),
        changeType: p.changeType
      })),
      userId: getCurrentUserId()
    })
  });

  if (!response.ok) {
    throw new Error('Batch analysis failed');
  }

  return response.json();
};

export default {
  analyzeImpact,
  getRecommendedReviewers,
  checkAIHealth,
  batchAnalyzeImpact
};