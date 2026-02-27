import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ImpactPreview from '../components/ai/ImpactPreview';
import PartPickerModal from '../components/ai/PartPickerModal';
import './AIDemo.css';

const AIDemo = () => {
  const [selectedPart, setSelectedPart] = useState(null);
  const [changeType, setChangeType] = useState('MODIFY');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showPartPicker, setShowPartPicker] = useState(false);
  const [triggerAnalysis, setTriggerAnalysis] = useState(0);

  // Get AI action trigger from parent layout
  const outletContext = useOutletContext();
  const aiActionTrigger = outletContext?.aiActionTrigger;

  // Listen for AI-triggered actions
  useEffect(() => {
    if (aiActionTrigger && aiActionTrigger.part_number) {
      console.log('⚡ AI Action received:', aiActionTrigger);
      
      // Find the part by number
      const partNum = aiActionTrigger.part_number.toLowerCase();
      
      // For demo: if part number matches, simulate selection
      // In production, you'd fetch from API
      if (partNum === '001dfy') {
        const demoPart = {
          id: 1,
          partNumber: '001dfy',
          name: 'p1dfy',
          lifecycleState: 'UNDERREVIEW',
          revision: 'A',
          iteration: '1'
        };
        setSelectedPart(demoPart);
      }

      // Set change type if provided
      if (aiActionTrigger.change_type) {
        setChangeType(aiActionTrigger.change_type);
      }

      // Trigger analysis
      setTimeout(() => {
        setTriggerAnalysis(prev => prev + 1);
      }, 300);
    }
  }, [aiActionTrigger]);

  const getRecommendedChangeTypes = (lifecycleState) => {
    const recommendations = {
      'INWORK': [
        { value: 'MODIFY', label: 'Modify Part', description: 'Change attributes or design' },
        { value: 'REVISE', label: 'Revise Part', description: 'Create new revision' },
        { value: 'DELETE', label: 'Delete Part', description: 'Remove from system' },
      ],
      'UNDER_REVIEW': [
        { value: 'MODIFY', label: 'Modify Part', description: 'Update under review' },
        { value: 'REVISE', label: 'Revise Part', description: 'Create new revision' },
      ],
      'UNDERREVIEW': [
        { value: 'MODIFY', label: 'Modify Part', description: 'Update under review' },
        { value: 'REVISE', label: 'Revise Part', description: 'Create new revision' },
      ],
      'RELEASED': [
        { value: 'REVISE', label: 'Revise Part (ECN)', description: 'Create new revision via ECN', recommended: true },
        { value: 'OBSOLETE', label: 'Obsolete Part', description: 'Mark as obsolete' },
        { value: 'REPLACE', label: 'Replace Part', description: 'Replace with alternate' },
      ],
      'OBSOLETE': [
        { value: 'REPLACE', label: 'Replace Part', description: 'Replace with alternate' },
      ]
    };
    
    return recommendations[lifecycleState] || recommendations['INWORK'];
  };

  const handlePartSelect = (part) => {
    console.log('🔧 Part selected:', part);
    setSelectedPart(part);
    const recommended = getRecommendedChangeTypes(part.lifecycleState);
    if (recommended.length > 0) {
      setChangeType(recommended[0].value);
    }
    setAnalysisResult(null);
    
    // Auto-trigger analysis after selection
    setTimeout(() => {
      setTriggerAnalysis(prev => prev + 1);
    }, 300);
  };

  const handleAnalysisComplete = (result) => {
    console.log('✅ Analysis complete:', result);
    setAnalysisResult(result);
  };

  const handleClear = () => {
    setSelectedPart(null);
    setChangeType('MODIFY');
    setAnalysisResult(null);
  };

  const changeTypeOptions = selectedPart 
    ? getRecommendedChangeTypes(selectedPart.lifecycleState)
    : [
        { value: 'MODIFY', label: 'Modify Part' },
        { value: 'REVISE', label: 'Revise Part' },
        { value: 'OBSOLETE', label: 'Obsolete Part' },
        { value: 'REPLACE', label: 'Replace Part' },
        { value: 'DELETE', label: 'Delete Part' },
      ];

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
        <div className="ai-demo-controls">
          <h2>Configure Analysis</h2>
          
          <div className="form-group">
            <label>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
              </svg>
              Select Part
            </label>
            
            {selectedPart ? (
              <div className="selected-part-display">
                <div className="selected-part-info">
                  <div className="part-number">{selectedPart.partNumber}</div>
                  <div className="part-name">{selectedPart.name}</div>
                  <div className="part-meta">
                    <span className={`part-state part-state--${selectedPart.lifecycleState?.toLowerCase()}`}>
                      {selectedPart.lifecycleState}
                    </span>
                    <span className="part-version">
                      {selectedPart.revision}.{selectedPart.iteration}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPartPicker(true)}
                  className="btn-change-part"
                >
                  Change
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowPartPicker(true)}
                className="btn-select-part"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Search & Select Part
              </button>
            )}
            <small>Select a part from your database to analyze</small>
          </div>

          <div className="form-group">
            <label htmlFor="changeType">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Change Type
              {selectedPart && selectedPart.lifecycleState === 'RELEASED' && (
                <span className="badge-warning">⚠️ Released Part</span>
              )}
            </label>
            <select
              id="changeType"
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              className="form-select"
              disabled={!selectedPart}
            >
              {changeTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.recommended ? ' ⭐ Recommended' : ''}
                  {option.description ? ` - ${option.description}` : ''}
                </option>
              ))}
            </select>
            <small>
              {selectedPart
                ? `Smart suggestions based on ${selectedPart.lifecycleState} state`
                : 'Select a part first to see appropriate change types'
              }
            </small>
          </div>

          <div className="demo-actions">
            <button 
              onClick={handleClear}
              className="btn-secondary"
              disabled={!selectedPart}
            >
              Clear
            </button>
          </div>

          <div className="info-box">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              How It Works
            </h3>
            <ol>
              <li>Search and select a part from your database</li>
              <li>AI suggests appropriate change types based on lifecycle state</li>
              <li>Real-time analysis of:
                <ul>
                  <li>BOM structure impact (where-used)</li>
                  <li>Released parts dependencies</li>
                  <li>Conflicting active changes</li>
                  <li>ML-powered risk prediction</li>
                </ul>
              </li>
              <li>Get actionable recommendations and warnings</li>
            </ol>
            
            <div className="info-highlight">
              🤖 <strong>Try the AI Chat Assistant!</strong>
              <p>Just ask: <em>"Analyze part 001dfy"</em> - I'll automatically load it and run the analysis!</p>
            </div>
          </div>

          {analysisResult && (
            <div className="result-json">
              <h3>Raw API Response</h3>
              <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
              <button 
                onClick={() => navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2))}
                className="btn-copy"
              >
                📋 Copy JSON
              </button>
            </div>
          )}
        </div>

        <div className="ai-demo-preview">
          <ImpactPreview 
            partId={selectedPart?.id} 
            changeType={changeType}
            onAnalysisComplete={handleAnalysisComplete}
            triggerAnalysis={triggerAnalysis}
          />
        </div>
      </div>

      <PartPickerModal
        isOpen={showPartPicker}
        onClose={() => setShowPartPicker(false)}
        onSelect={handlePartSelect}
      />
    </div>
  );
};

export default AIDemo;