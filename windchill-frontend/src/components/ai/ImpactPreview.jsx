import { useState, useEffect } from 'react';
import api from '../../utils/api';
import './ImpactPreview.css';

/**
 * Build blocker messages from backend data.
 */
function buildBlockers(backendData, conflictingNumbers) {
  const blockers = [];

  if (backendData.releasedAffected > 0) {
    blockers.push(`${backendData.releasedAffected} RELEASED part(s) affected — ECN process required`);
  }

  if (backendData.conflictingChanges > 0 && conflictingNumbers.length > 0) {
    blockers.push(`Active ECR conflict(s): ${conflictingNumbers.join(', ')} — coordinate before proceeding`);
  } else if (backendData.conflictingChanges > 0) {
    blockers.push(`${backendData.conflictingChanges} active ECR(s) conflict with this change`);
  }

  if (backendData.hasComplianceIssues) {
    blockers.push('Compliance issues detected — review before submitting');
  }

  return blockers;
}

/**
 * ImpactPreview - Real-time AI impact analysis component
 * NOW SUPPORTS: External triggers from AI chat (triggerAnalysis prop)
 */
export const ImpactPreview = ({ partId, changeType, onAnalysisComplete, triggerAnalysis }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-analyze when part/changeType changes
  useEffect(() => {
    if (partId && changeType) {
      analyzeImpact();
    } else {
      setAnalysis(null);
    }
  }, [partId, changeType]);

  // ALSO respond to external triggers (from AI chat)
  useEffect(() => {
    if (triggerAnalysis > 0 && partId && changeType) {
      console.log('⚡ External trigger received, running analysis...');
      analyzeImpact();
    }
  }, [triggerAnalysis]);

  const analyzeImpact = async () => {
    if (!partId || !changeType) {
      console.warn('Cannot analyze: missing partId or changeType');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Running impact analysis: partId=${partId}, changeType=${changeType}`);
      
      const response = await api.post('/api/v1/ai/analyze-impact', {
        partId: parseInt(partId),
        changeType: changeType
      });

      console.log('✅ AI Analysis Response:', response.data);

      const backendData = response.data?.data;
      
      if (!backendData) {
        throw new Error('Invalid response format from backend');
      }

      // Transform backend flat structure to frontend nested structure
      const conflictingNumbers = backendData.conflictingChangeNumbers || [];
      const complianceIssues = backendData.hasComplianceIssues || false;
      const complianceWarningsList = backendData.complianceWarnings || [];

      const transformedData = {
        riskPrediction: {
          riskScore: backendData.riskScore || 0,
          riskLevel: backendData.riskLevel || 'UNKNOWN',
          confidence: backendData.confidence || 0,
          modelType: backendData.modelType || 'UNKNOWN'
        },
        graphAnalysis: {
          bomDepth: backendData.bomDepth || 0,
          totalAffectedCount: backendData.whereUsedCount || 0,
          releasedAffectedCount: backendData.releasedAffected || 0,
          conflictingChangesCount: backendData.conflictingChanges || 0,
          conflictingChangeNumbers: conflictingNumbers
        },
        warnings: backendData.riskLevel === 'HIGH' || backendData.riskLevel === 'MEDIUM'
          ? (backendData.riskFactors || [])
          : [],
        blockers: buildBlockers(backendData, conflictingNumbers),
        complianceIssues: complianceIssues,
        complianceWarnings: complianceWarningsList,
        recommendations: backendData.suggestedActions || [],
        affectedParts: (backendData.affectedPartNumbers || []).map((partNum, idx) => ({
          id: idx,
          partNumber: partNum,
          name: 'Assembly using this part',
          lifecycleState: 'UNKNOWN'
        })),
        impactSummary: backendData.recommendation || 'No recommendation available',
        estimatedCycleTimeDays: backendData.estimatedCycleTimeDays,
        analyzedAt: backendData.analyzedAt,
        analysisTimeMs: backendData.analysisTimeMs
      };

      console.log('💡 Transformed analysis:', transformedData);
      
      setAnalysis(transformedData);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(transformedData);
      }
    } catch (err) {
      console.error('❌ Impact analysis error:', err);
      setError(err.response?.data?.message || err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (!partId || !changeType) {
    return (
      <div className="impact-preview impact-preview--empty">
        <div className="impact-preview__placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Select a part and change type to see AI impact analysis</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="impact-preview impact-preview--loading">
        <div className="impact-preview__spinner">
          <div className="spinner"></div>
          <p>Analyzing impact...</p>
          <small>Scanning BOM structure and dependencies</small>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="impact-preview impact-preview--error">
        <div className="impact-preview__error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e53e3e">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error}</p>
          <button onClick={analyzeImpact} className="btn-retry">Retry Analysis</button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const risk = analysis.riskPrediction || {};
  const graph = analysis.graphAnalysis || {};
  const warnings = analysis.warnings || [];
  const recommendations = analysis.recommendations || [];
  const blockers = analysis.blockers || [];

  const getRiskColor = (level) => {
    switch(level) {
      case 'HIGH': return '#e53e3e';
      case 'MEDIUM': return '#ed8936';
      case 'LOW': return '#48bb78';
      default: return '#718096';
    }
  };

  const getRiskIcon = (level) => {
    switch(level) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="impact-preview">
      <div className="impact-preview__header">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          AI Impact Analysis
        </h3>
        <button 
          onClick={analyzeImpact} 
          className="btn-refresh"
          title="Refresh analysis"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Risk Score */}
      <div className="impact-preview__risk" style={{ borderColor: getRiskColor(risk.riskLevel) }}>
        <div className="risk-gauge">
          <div className="risk-gauge__circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                fill="none" 
                stroke="#e2e8f0" 
                strokeWidth="8"
              />
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                fill="none" 
                stroke={getRiskColor(risk.riskLevel)} 
                strokeWidth="8"
                strokeDasharray={`${(risk.riskScore / 10) * 339.292} 339.292`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <text 
                x="60" 
                y="60" 
                textAnchor="middle" 
                dy="8" 
                fontSize="32" 
                fontWeight="bold" 
                fill={getRiskColor(risk.riskLevel)}
              >
                {risk.riskScore?.toFixed(1) || '0'}
              </text>
            </svg>
          </div>
          <div className="risk-gauge__label">
            <span className="risk-level" style={{ color: getRiskColor(risk.riskLevel) }}>
              {getRiskIcon(risk.riskLevel)} {risk.riskLevel || 'UNKNOWN'}
            </span>
            <small>Risk Score (0-10)</small>
            {risk.confidence > 0 && (
              <small className="confidence">Confidence: {(risk.confidence * 100).toFixed(0)}%</small>
            )}
            {risk.modelType && (
              <small className="model-type">Model: {risk.modelType}</small>
            )}
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="impact-preview__summary">
        <div className="summary-stat">
          <span className="stat-value">{graph.totalAffectedCount || 0}</span>
          <span className="stat-label">Where Used</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value" style={{ color: '#e53e3e' }}>
            {graph.releasedAffectedCount || 0}
          </span>
          <span className="stat-label">Released</span>
        </div>
        <div className="summary-stat">
          <span
            className="stat-value"
            style={{ color: (graph.conflictingChangesCount || 0) > 0 ? '#e53e3e' : '#ed8936' }}
            title={graph.conflictingChangeNumbers?.length > 0
              ? `Conflicts: ${graph.conflictingChangeNumbers.join(', ')}`
              : 'No active conflicts'}
          >
            {graph.conflictingChangesCount || 0}
          </span>
          <span className="stat-label">
            Conflicts
            {graph.conflictingChangeNumbers?.length > 0 && (
              <small style={{display:'block',fontSize:'10px',color:'#e53e3e',marginTop:'2px'}}>
                {graph.conflictingChangeNumbers[0]}
                {graph.conflictingChangeNumbers.length > 1 && ` +${graph.conflictingChangeNumbers.length - 1}`}
              </small>
            )}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">{graph.bomDepth || 0}</span>
          <span className="stat-label">BOM Depth</span>
        </div>
      </div>

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="impact-preview__blockers">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53e3e">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeWidth="2"/>
            </svg>
            Critical Blockers
          </h4>
          <ul>
            {blockers.map((blocker, i) => (
              <li key={i} className="blocker-item">{blocker}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="impact-preview__warnings">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ed8936">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2"/>
              <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Risk Factors
          </h4>
          <ul>
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Compliance Issues */}
      {analysis.complianceIssues && analysis.complianceWarnings?.length > 0 && (
        <div className="impact-preview__compliance">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#805ad5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Compliance Issues
          </h4>
          <ul>
            {analysis.complianceWarnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="impact-preview__recommendations">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4299e1">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Suggested Actions
          </h4>
          <ul>
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Affected Parts Preview */}
      {analysis.affectedParts && analysis.affectedParts.length > 0 && (
        <div className="impact-preview__affected-parts">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
            </svg>
            Parent Assemblies ({analysis.affectedParts.length})
          </h4>
          <div className="affected-parts-list">
            {analysis.affectedParts.slice(0, 5).map((part, i) => (
              <div key={i} className="affected-part-item">
                <span className="part-number">{part.partNumber}</span>
                <span className="part-name">{part.name}</span>
              </div>
            ))}
            {analysis.affectedParts.length > 5 && (
              <p className="more-parts">...and {analysis.affectedParts.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      {/* Impact Summary Text */}
      {analysis.impactSummary && (
        <div className="impact-preview__summary-text">
          <p>{analysis.impactSummary}</p>
          {analysis.estimatedCycleTimeDays && (
            <p className="cycle-time">
              <strong>Estimated Cycle Time:</strong> {analysis.estimatedCycleTimeDays} days
            </p>
          )}
        </div>
      )}

      {/* Performance Metrics */}
      {analysis.analysisTimeMs && (
        <div className="impact-preview__metadata">
          <small>Analysis completed in {analysis.analysisTimeMs}ms</small>
        </div>
      )}
    </div>
  );
};

export default ImpactPreview;