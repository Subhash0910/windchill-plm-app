import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ChangesHomePage.css';

const FEATURES = [
  {
    icon: '📝',
    title: 'Engineering Change Requests',
    desc: 'Create, track and route ECRs against any part with full lifecycle and audit trail.',
  },
  {
    icon: '🤖',
    title: 'AI Impact Analysis',
    desc: 'Auto-analyze what breaks when a part changes — BOM propagation, sibling parts, supplier dependencies.',
  },
  {
    icon: '🔗',
    title: 'Lifecycle Advancement',
    desc: 'Approved ECRs automatically advance parts from INWORK → UNDER_REVIEW → RELEASED with no manual steps.',
  },
  {
    icon: '📊',
    title: 'Change Analytics',
    desc: 'Trend ECRs by status, context, assignee and time-to-approve across your full product portfolio.',
  },
];

const FLOW_STEPS = [
  'Create Draft',
  'Submit for Review',
  'AI Impact Analysis',
  'Reviewer Approval',
  'Part Lifecycle Update',
  'Closed & Audited',
];

const ChangesHomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="chg-soon">

      {/* ── Hero ── */}
      <div className="chg-soon-hero">
        <div className="chg-soon-badge">Coming in v2</div>
        <h1 className="chg-soon-title">Engineering Change Management</h1>
        <p className="chg-soon-sub">
          Full ECR / ECN workflow with AI-powered impact analysis — modelled after Windchill’s change module.
          The backend API is being built now. Change task approvals are already live via the buttons below.
        </p>
        <div className="chg-soon-actions">
          <button
            className="chg-soon-btn chg-soon-btn--primary"
            onClick={() => navigate('/plm/changes/tasks')}
          >
            🔧 My Change Tasks &rarr;
          </button>
          <button
            className="chg-soon-btn chg-soon-btn--ghost"
            onClick={() => navigate('/plm/worklist')}
          >
            ✅ Go to Worklist
          </button>
          <button
            className="chg-soon-btn chg-soon-btn--ghost"
            onClick={() => navigate('/plm/ai-demo')}
          >
            ⚡ AI Demo
          </button>
        </div>
      </div>

      {/* ── Live-now banner ── */}
      <div className="chg-soon-live">
        <span className="chg-soon-live-dot" />
        <div>
          <strong>Live now:</strong>&nbsp;
          Part promotions, worklist approvals and notification routing all work today.
          Use the <strong>Worklist</strong> page to approve or reject parts, and
          <strong> Change Tasks</strong> to manage your review queue.
        </div>
      </div>

      {/* ── Feature preview grid ── */}
      <h2 className="chg-soon-section-title">What’s Coming</h2>
      <div className="chg-soon-grid">
        {FEATURES.map((f, i) => (
          <div key={i} className="chg-soon-card">
            <div className="chg-soon-card-icon">{f.icon}</div>
            <div className="chg-soon-card-title">{f.title}</div>
            <div className="chg-soon-card-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* ── ECR workflow steps ── */}
      <div className="chg-soon-flow">
        <h2 className="chg-soon-flow-title">Planned ECR Workflow</h2>
        <div className="chg-soon-steps">
          {FLOW_STEPS.map((step, i) => (
            <React.Fragment key={i}>
              <div className="chg-soon-step">
                <div className="chg-soon-step-num">{i + 1}</div>
                <div className="chg-soon-step-label">{step}</div>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div className="chg-soon-step-arrow">&rarr;</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ChangesHomePage;
