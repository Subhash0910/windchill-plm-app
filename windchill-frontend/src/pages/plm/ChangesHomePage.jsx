import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import './ChangesHomePage.css';

const ChangesHomePage = () => {
  const navigate = useNavigate();
  const [ecrId, setEcrId] = useState('');

  const canOpen = useMemo(() => {
    const t = String(ecrId || '').trim();
    return /^\d+$/.test(t);
  }, [ecrId]);

  const open = () => {
    const t = String(ecrId || '').trim();
    if (!/^\d+$/.test(t)) return;
    navigate(`/plm/changes/ecr/${t}`);
  };

  return (
    <div className="chg-home">
      <div className="chg-head">
        <div>
          <div className="chg-title">Changes</div>
          <div className="chg-sub">Open an Engineering Change Request (ECR) and view impact + insights.</div>
        </div>
      </div>

      <div className="chg-card">
        <div className="chg-card-title">Open ECR</div>
        <div className="chg-form">
          <div className="chg-field">
            <label>ECR ID</label>
            <input
              className="plm-input"
              placeholder="Example: 12"
              value={ecrId}
              onChange={(e) => setEcrId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') open();
              }}
            />
            <div className="chg-hint">Use the numeric database ID (same value you use in APIs).</div>
          </div>

          <div className="chg-actions">
            <Button variant="primary" size="sm" onClick={open} disabled={!canOpen}>Open</Button>
          </div>
        </div>
      </div>

      <div className="chg-card" style={{ marginTop: 12 }}>
        <div className="chg-card-title">What you’ll see</div>
        <div className="chg-list">
          <div>Impact score + risk (lifecycle-aware).</div>
          <div>Similar past changes (impact-overlap based).</div>
          <div>Routing decision explanation (audited).</div>
        </div>
      </div>
    </div>
  );
};

export default ChangesHomePage;
