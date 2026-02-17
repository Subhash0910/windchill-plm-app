import { useState } from 'react';
import ImpactPreview from '../components/ai/ImpactPreview';
import './AIDemo.css';

/**
 * AI Demo Page - Standalone page to test AI Impact Analysis
 * This page allows testing the AI features without integrating into ECR/ECN flow
 */
const AIDemo = () => {
  const [partId, setPartId] = useState('');
  const [changeType, setChangeType] = useState('OBSOLETE');
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    console.log('AI Analysis Result:', result);
  };

  const handleClear = () => {
    setPartId('');
    setChangeType('OBSOLETE');
    setAnalysisResult(null);
  };

  return (
    <div className="ai-demo-page">
      <div className="ai-demo-header">
        <h1>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          AI Impact Analysis Demo
        </h1>
        <p>Test the AI-powered engineering impact analysis engine</p>
      </div>

      <div className="ai-demo-container">
        {/* Input Controls */}
        <div className="ai-demo-controls">
          <h2>Configure Analysis</h2>
          
          <div className="form-group">
            <label htmlFor="partId">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
              </svg>
              Part ID
            </label>
            <input
              id="partId"
              type="number"
              placeholder="Enter part ID (e.g., 1, 2, 3...)"
              value={partId}
              onChange={(e) => setPartId(e.target.value)}
              className="form-input"
            />
            <small>Enter the ID of an existing part in your database</small>
          </div>

          <div className="form-group">
            <label htmlFor="changeType">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Change Type
            </label>
            <select
              id="changeType"
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              className="form-select"
            >
              <option value="OBSOLETE">Obsolete Part</option>
              <option value="MODIFY">Modify Part</option>
              <option value="REVISE">Revise Part</option>
              <option value="REPLACE">Replace Part</option>
              <option value="DELETE">Delete Part</option>
            </select>
            <small>Select the type of change you want to analyze</small>
          </div>

          <div className="demo-actions">
            <button 
              onClick={handleClear}
              className="btn-secondary"
              disabled={!partId}
            >
              Clear
            </button>
          </div>

          {/* Info Box */}
          <div className="info-box">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              How It Works
            </h3>
            <ol>
              <li>Enter a part ID from your database</li>
              <li>Select the type of change</li>
              <li>AI analyzes:
                <ul>
                  <li>BOM structure impact</li>
                  <li>Where-used dependencies</li>
                  <li>Lifecycle state conflicts</li>
                  <li>Risk prediction (ML model)</li>
                </ul>
              </li>
              <li>Get recommendations and warnings</li>
            </ol>
          </div>

          {/* Analysis Result JSON */}
          {analysisResult && (
            <div className="result-json">
              <h3>Raw API Response</h3>
              <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
              <button 
                onClick={() => navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2))}
                className="btn-copy"
              >
                Copy JSON
              </button>
            </div>
          )}
        </div>

        {/* Impact Preview */}
        <div className="ai-demo-preview">
          <ImpactPreview 
            partId={partId} 
            changeType={changeType}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
      </div>

      {/* Quick Test Section */}
      <div className="quick-test-section">
        <h2>Quick Test Scenarios</h2>
        <div className="test-scenarios">
          <div className="scenario-card" onClick={() => { setPartId('1'); setChangeType('OBSOLETE'); }}>
            <h4>🔴 High Risk</h4>
            <p>Obsolete a released part with many dependencies</p>
            <code>Part ID: 1, Type: OBSOLETE</code>
          </div>
          <div className="scenario-card" onClick={() => { setPartId('2'); setChangeType('MODIFY'); }}>
            <h4>🟡 Medium Risk</h4>
            <p>Modify a part under review</p>
            <code>Part ID: 2, Type: MODIFY</code>
          </div>
          <div className="scenario-card" onClick={() => { setPartId('3'); setChangeType('REVISE'); }}>
            <h4>🟢 Low Risk</h4>
            <p>Revise a work-in-progress part</p>
            <code>Part ID: 3, Type: REVISE</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDemo;