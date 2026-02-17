import { useState, useEffect } from 'react';
import './ImpactPreview.css';

/**
 * ImpactPreview - Real-time AI impact analysis component
 * Shows risk score, affected parts, warnings, and recommendations
 */
export const ImpactPreview = ({ partId, changeType, onAnalysisComplete }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (partId && changeType) {
      analyzeImpact();
    } else {
      setAnalysis(null);
    }
  }, [partId, changeType]);

  const analyzeImpact = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/ai/impact/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partId: parseInt(partId),
          changeType: changeType,
          userId: JSON.parse(localStorage.getItem('user'))?.id || 1
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (err) {
      console.error('Impact analysis error:', err);
      setError(err.message);
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
            {risk.confidence && (
              <small className="confidence">Confidence: {(risk.confidence * 100).toFixed(0)}%</small>
            )}
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="impact-preview__summary">
        <div className="summary-stat">
          <span className="stat-value">{graph.totalAffectedCount || 0}</span>
          <span className="stat-label">Total Affected</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value" style={{ color: '#e53e3e' }}>
            {graph.releasedAffectedCount || 0}
          </span>
          <span className="stat-label">Released Parts</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value" style={{ color: '#ed8936' }}>
            {graph.conflictingChangesCount || 0}
          </span>
          <span className="stat-label">Conflicts</span>
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
            Warnings
          </h4>
          <ul>
            {warnings.map((warning, i) => (
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
            AI Recommendations
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
            Affected Parts ({analysis.affectedParts.length})
          </h4>
          <div className="affected-parts-list">
            {analysis.affectedParts.slice(0, 5).map((part, i) => (
              <div key={i} className="affected-part-item">
                <span className="part-number">{part.partNumber}</span>
                <span className="part-name">{part.name}</span>
                <span className={`part-state part-state--${part.lifecycleState?.toLowerCase()}`}>
                  {part.lifecycleState}
                </span>
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
        </div>
      )}
    </div>
  );
};

export default ImpactPreview;