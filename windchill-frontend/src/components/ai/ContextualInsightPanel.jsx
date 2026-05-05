import React from 'react';
import './ContextualInsightPanel.css';

export default function ContextualInsightPanel({
  title = 'AI Advisory',
  subtitle,
  insight,
  loading = false,
  error = '',
  footer = null,
  emptyMessage = 'No advisory is available yet.',
}) {
  const facts = insight?.facts ?? [];
  const recommendations = insight?.recommendedActions ?? [];
  const warnings = insight?.warnings ?? [];

  return (
    <section className="contextual-ai-panel">
      <div className="contextual-ai-panel__head">
        <div>
          <div className="contextual-ai-panel__eyebrow">AI Advisory</div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {typeof insight?.confidence === 'number' ? (
          <span className="contextual-ai-panel__confidence">{insight.confidence}% confidence</span>
        ) : null}
      </div>

      {loading ? <div className="contextual-ai-panel__state">Loading guidance...</div> : null}
      {!loading && error ? <div className="contextual-ai-panel__error">{error}</div> : null}
      {!loading && !error && !insight ? <div className="contextual-ai-panel__state">{emptyMessage}</div> : null}

      {!loading && !error && insight ? (
        <div className="contextual-ai-panel__body">
          {insight.assessment ? (
            <div className="contextual-ai-panel__assessment">{insight.assessment}</div>
          ) : null}

          {facts.length > 0 ? (
            <div className="contextual-ai-panel__section">
              <div className="contextual-ai-panel__sectionTitle">Computed facts</div>
              <div className="contextual-ai-panel__facts">
                {facts.map((fact) => (
                  <div key={`${fact.label}-${fact.value}`} className="contextual-ai-panel__fact">
                    <span>{fact.label}</span>
                    <strong>{fact.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {recommendations.length > 0 ? (
            <div className="contextual-ai-panel__section">
              <div className="contextual-ai-panel__sectionTitle">Recommended next steps</div>
              <ul className="contextual-ai-panel__list">
                {recommendations.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className="contextual-ai-panel__section">
              <div className="contextual-ai-panel__sectionTitle">Warnings</div>
              <ul className="contextual-ai-panel__list contextual-ai-panel__list--warning">
                {warnings.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ) : null}

          {footer ? <div className="contextual-ai-panel__footer">{footer}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
