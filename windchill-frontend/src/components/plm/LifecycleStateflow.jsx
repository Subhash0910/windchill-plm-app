import React from 'react';
import './LifecycleStateflow.css';

const FLOWS = {
  part:     ['DRAFT', 'IN_WORK', 'IN_REVIEW', 'RELEASED', 'OBSOLETE'],
  document: ['DRAFT', 'IN_WORK', 'IN_REVIEW', 'RELEASED', 'OBSOLETE'],
  ecr:      ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'CLOSED'],
  eco:      ['DRAFT', 'OPEN', 'IN_REVIEW', 'APPROVED', 'CLOSED'],
  ecn:      ['OPEN', 'RELEASED', 'OBSOLETE'],
};

const LABELS = {
  IN_WORK: 'In Work', IN_REVIEW: 'In Review', SUBMITTED: 'Submitted',
  RELEASED: 'Released', OBSOLETE: 'Obsolete', APPROVED: 'Approved',
  CLOSED: 'Closed', DRAFT: 'Draft', OPEN: 'Open',
};

const LifecycleStateflow = ({ entityType = 'part', currentState }) => {
  const flow = FLOWS[entityType.toLowerCase()] ?? FLOWS.part;
  const norm = (s) => String(s || '').toUpperCase();
  const current = norm(currentState);
  const currentIdx = flow.findIndex(s => norm(s) === current);

  return (
    <div className="lsf-wrap">
      {flow.map((state, i) => {
        const isCurrent = norm(state) === current;
        const isPast    = currentIdx >= 0 && i < currentIdx;
        const cls = isCurrent ? 'lsf-node lsf-current' : isPast ? 'lsf-node lsf-past' : 'lsf-node lsf-future';
        return (
          <React.Fragment key={state}>
            <div className={cls}>
              <div className="lsf-dot" />
              <div className="lsf-label">{LABELS[state] ?? state}</div>
            </div>
            {i < flow.length - 1 && (
              <div className={isPast || isCurrent ? 'lsf-line lsf-line-done' : 'lsf-line'} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default LifecycleStateflow;
