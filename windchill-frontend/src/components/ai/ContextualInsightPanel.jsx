import React, { useMemo, useState } from 'react';
import './ContextualInsightPanel.css';

/** ── Risk Gauge ──────────────────────────────────────────── */

const GAUGE_ARC = 240; // degrees of the semicircle
const GAUGE_START = 150; // rotation offset (150deg from top, clockwise)

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
}

function RiskGauge({ score = 0, maxScore = 10, size = 160, animated = true }) {
  const cx = size / 2;
  const cy = size * 0.72;
  const outerR = size * 0.42;
  const innerR = outerR - 14;
  const needleR = outerR - 6;

  const scoreAngle = GAUGE_START + (score / maxScore) * GAUGE_ARC;
  const scoreClamped = Math.min(Math.max(score, 0), maxScore);

  // Color stops
  const getColor = (value) => {
    const ratio = value / maxScore;
    if (ratio <= 0.3) return 'var(--wc-success)';
    if (ratio <= 0.6) return 'var(--wc-warning)';
    return 'var(--wc-danger)';
  };

  // Arc segments
  const segments = [
    { start: GAUGE_START, end: GAUGE_START + GAUGE_ARC * 0.3, color: 'var(--wc-success)' },
    { start: GAUGE_START + GAUGE_ARC * 0.3, end: GAUGE_START + GAUGE_ARC * 0.6, color: 'var(--wc-warning)' },
    { start: GAUGE_START + GAUGE_ARC * 0.6, end: GAUGE_START + GAUGE_ARC, color: 'var(--wc-danger)' },
  ];

  // Needle
  const needleTip = polarToCartesian(cx, cy, needleR, scoreAngle);
  const needleBase1 = polarToCartesian(cx, cy, 8, scoreAngle + 90);
  const needleBase2 = polarToCartesian(cx, cy, 8, scoreAngle - 90);

  return (
    <div
      className={`cip-gauge${animated ? ' cip-gauge--animate' : ''}`}
      style={{ width: size, height: size * 0.8 }}
      role="meter"
      aria-valuenow={scoreClamped}
      aria-valuemin={0}
      aria-valuemax={maxScore}
      aria-label={`Risk score ${scoreClamped} out of ${maxScore}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Background track */}
        <path
          d={describeArc(cx, cy, outerR, GAUGE_START, GAUGE_START + GAUGE_ARC)}
          fill="none"
          stroke="var(--wc-border)"
          strokeWidth={outerR - innerR + 6}
          strokeLinecap="round"
          opacity={0.3}
        />

        {/* Colored segments */}
        {segments.map((seg) => (
          <path
            key={`${seg.start}-${seg.end}`}
            d={describeArc(cx, cy, outerR - 1, seg.start, seg.end)}
            fill="none"
            stroke={seg.color}
            strokeWidth={outerR - innerR}
            strokeLinecap="butt"
          />
        ))}

        {/* Inner shadow ring */}
        <path
          d={describeArc(cx, cy, innerR, GAUGE_START, GAUGE_START + GAUGE_ARC)}
          fill="none"
          stroke="var(--wc-content-bg)"
          strokeWidth={2}
        />

        {/* Tick marks */}
        {[0, 2.5, 5, 7.5, 10].map((tick) => {
          const a = GAUGE_START + (tick / maxScore) * GAUGE_ARC;
          const outer = polarToCartesian(cx, cy, outerR + 6, a);
          const inner = polarToCartesian(cx, cy, outerR - 3, a);
          return (
            <line
              key={tick}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="var(--wc-text-muted)"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}

        {/* Needle */}
        <polygon
          points={`${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y} ${needleTip.x},${needleTip.y}`}
          fill={getColor(scoreClamped)}
          stroke="var(--wc-content-bg)"
          strokeWidth={1}
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: animated ? `cip-needle-swing 0.8s var(--wc-ease-spring) both` : 'none',
            animationDelay: '0.3s',
          }}
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={10} fill="var(--wc-content-bg)" stroke="var(--wc-border)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={4} fill={getColor(scoreClamped)} />
      </svg>

      {/* Score text */}
      <div
        className="cip-gauge-value"
        style={{ color: getColor(scoreClamped) }}
      >
        <span className="cip-gauge-score">{scoreClamped}</span>
        <span className="cip-gauge-max">/{maxScore}</span>
      </div>

      {/* Label */}
      <div className="cip-gauge-label">RISK SCORE</div>
    </div>
  );
}

/** ── Risk Factors ────────────────────────────────────────── */

function RiskFactor({ factor, index }) {
  return (
    <div
      className="cip-factor"
      style={{ animationDelay: `${0.1 + index * 0.06}s` }}
    >
      <span className={`cip-factor-icon cip-factor-icon--${factor.severity || 'medium'}`}>
        {factor.severity === 'high' ? '!' : factor.severity === 'low' ? '~' : '?'}
      </span>
      <div className="cip-factor-content">
        <div className="cip-factor-label">{factor.label || factor.name || factor}</div>
        {factor.description && (
          <div className="cip-factor-desc">{factor.description}</div>
        )}
      </div>
    </div>
  );
}

/** ── Action Checkboxes ───────────────────────────────────── */

function ActionChecklist({ actions }) {
  const [checked, setChecked] = useState({});

  if (!actions || actions.length === 0) return null;

  return (
    <ul className="cip-checklist">
      {actions.map((action, i) => {
        const key = typeof action === 'string' ? action : (action.label || action.action || i);
        const label = typeof action === 'string' ? action : (action.label || action.action);
        return (
          <li
            key={key}
            className="cip-checklist-item"
            style={{ animationDelay: `${0.35 + i * 0.06}s` }}
          >
            <label className="cip-checklist-label">
              <input
                type="checkbox"
                checked={!!checked[key]}
                onChange={(e) => setChecked((prev) => ({ ...prev, [key]: e.target.checked }))}
                className="cip-checklist-check"
              />
              <span className={`cip-checklist-mark${checked[key] ? ' cip-checklist-mark--done' : ''}`}>
                {checked[key] ? '✓' : '○'}
              </span>
              <span className={`cip-checklist-text${checked[key] ? ' cip-checklist-text--done' : ''}`}>
                {label}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** ── Panel ───────────────────────────────────────────────── */

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
  const riskScore = insight?.riskScore ?? null;
  const riskFactors = insight?.riskFactors ?? [];
  const generatedAt = insight?.generatedAt ?? insight?.timestamp ?? null;

  const confidencePct = useMemo(() => {
    if (insight?.confidence == null) return null;
    if (typeof insight.confidence === 'number' && insight.confidence <= 1) {
      return Math.round(insight.confidence * 100);
    }
    return insight.confidence;
  }, [insight?.confidence]);

  return (
    <section className="contextual-ai-panel cip">
      {/* Header */}
      <div className="cip__head">
        <div>
          <div className="cip__eyebrow">AI Advisory</div>
          <h3 className="cip__title">{title}</h3>
          {subtitle ? <p className="cip__subtitle">{subtitle}</p> : null}
          {generatedAt && (
            <div className="cip__timestamp">
              Generated {new Date(generatedAt).toLocaleString()}
            </div>
          )}
        </div>

        <div className="cip__head-right">
          {confidencePct !== null && (
            <span className="cip__confidence">{confidencePct}% confidence</span>
          )}
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="cip__state">
          <span className="cip__spinner" />
          Loading AI guidance...
        </div>
      )}
      {!loading && error && <div className="cip__error">{error}</div>}
      {!loading && !error && !insight && (
        <div className="cip__state">{emptyMessage}</div>
      )}

      {/* Body */}
      {!loading && !error && insight && (
        <div className="cip__body">
          {/* Risk gauge row */}
          {riskScore != null && (
            <div className="cip__gauge-row">
              <RiskGauge score={riskScore} maxScore={10} size={150} />
              <div className="cip__gauge-meta">
                {insight.riskLevel && (
                  <div
                    className="cip__risk-level"
                    style={{
                      color:
                        insight.riskLevel === 'HIGH' ? 'var(--wc-danger)' :
                        insight.riskLevel === 'MEDIUM' ? 'var(--wc-warning)' :
                        'var(--wc-success)',
                      background:
                        insight.riskLevel === 'HIGH' ? 'var(--wc-danger-bg)' :
                        insight.riskLevel === 'MEDIUM' ? 'var(--wc-warning-bg)' :
                        'var(--wc-success-bg)',
                    }}
                  >
                    {insight.riskLevel} RISK
                  </div>
                )}
                {insight.confidence != null && (
                  <div className="cip__gauge-confidence">
                    Model confidence: {confidencePct}%
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assessment text */}
          {insight.assessment && (
            <div className="cip__assessment">{insight.assessment}</div>
          )}

          {/* Risk factors */}
          {riskFactors.length > 0 && (
            <div className="cip__section">
              <div className="cip__sectionTitle">Risk Factors</div>
              <div className="cip__factors">
                {riskFactors.map((factor, i) => (
                  <RiskFactor key={i} factor={factor} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Computed facts */}
          {facts.length > 0 && (
            <div className="cip__section">
              <div className="cip__sectionTitle">Computed facts</div>
              <div className="cip__facts">
                {facts.map((fact) => (
                  <div key={`${fact.label}-${fact.value}`} className="cip__fact">
                    <span>{fact.label}</span>
                    <strong>{fact.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended actions as checklist */}
          {recommendations.length > 0 && (
            <div className="cip__section">
              <div className="cip__sectionTitle">Recommended next steps</div>
              <ActionChecklist actions={recommendations} />
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="cip__section">
              <div className="cip__sectionTitle">Warnings</div>
              <ul className="cip__list cip__list--warning">
                {warnings.map((item) => (
                  <li key={typeof item === 'string' ? item : item.label || item}>
                    {typeof item === 'string' ? item : item.label || item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          {footer ? <div className="cip__footer">{footer}</div> : null}
        </div>
      )}
    </section>
  );
}
