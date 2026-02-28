import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="nf-page">
      <div className="nf-card">
        <div className="nf-graphic">
          <span className="nf-emoji">🔍</span>
          <div className="nf-code">404</div>
        </div>
        <h1 className="nf-title">Page Not Found</h1>
        <p className="nf-desc">
          The page you’re looking for doesn’t exist, was moved, or the URL is incorrect.
        </p>
        <div className="nf-actions">
          <button
            className="nf-btn nf-btn--primary"
            onClick={() => navigate('/dashboard')}
          >
            ← Go to Dashboard
          </button>
          <button
            className="nf-btn nf-btn--ghost"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
        <p className="nf-hint">
          Quick links: &nbsp;
          <button className="nf-link" onClick={() => navigate('/plm/parts')}>Parts</button>
          &nbsp;· 
          <button className="nf-link" onClick={() => navigate('/plm/worklist')}>Worklist</button>
          &nbsp;· 
          <button className="nf-link" onClick={() => navigate('/plm/changes')}>Changes</button>
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
