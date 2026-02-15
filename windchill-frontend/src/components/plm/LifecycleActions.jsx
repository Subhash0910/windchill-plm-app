import React, { useMemo } from 'react';
import Button from '../atoms/Button/Button';
import './LifecycleActions.css';

const LifecycleActions = ({ state, onPromote, disabled }) => {
  const actions = useMemo(() => {
    if (state === 'INWORK') return [{ label: 'Submit for Review', target: 'UNDERREVIEW' }];
    if (state === 'UNDERREVIEW') return [{ label: 'Release', target: 'RELEASED' }];
    if (state === 'RELEASED') return [{ label: 'Obsolete', target: 'OBSOLETE' }];
    return [];
  }, [state]);

  return (
    <div className="lifecycle-wrap">
      <div className="lifecycle-state">State: <span className="mono">{state}</span></div>
      <div className="lifecycle-actions">
        {actions.map(a => (
          <Button key={a.target} variant="secondary" size="sm" onClick={() => onPromote(a.target)} disabled={disabled}>
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default LifecycleActions;
