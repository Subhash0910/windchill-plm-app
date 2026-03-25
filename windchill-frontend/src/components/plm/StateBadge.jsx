import React from 'react';
import './StateBadge.css';

const STATE_MAP = {
  INWORK:      { label: 'In Work',       cls: 'badge--inwork'      },
  UNDERREVIEW: { label: 'Under Review',  cls: 'badge--underreview' },
  RELEASED:    { label: 'Released',      cls: 'badge--released'    },
  OBSOLETE:    { label: 'Obsolete',      cls: 'badge--obsolete'    },
  // Change object states
  OPEN:        { label: 'Open',          cls: 'badge--inwork'      },
  SUBMITTED:   { label: 'Submitted',     cls: 'badge--underreview' },
  APPROVED:    { label: 'Approved',      cls: 'badge--released'    },
  REJECTED:    { label: 'Rejected',      cls: 'badge--obsolete'    },
  IMPLEMENTED: { label: 'Implemented',   cls: 'badge--released'    },
  CLOSED:      { label: 'Closed',        cls: 'badge--obsolete'    },
};

const StateBadge = ({ state, size = 'md' }) => {
  if (!state) return null;
  const normalized = (state || '').toString().toUpperCase().trim();
  const config = STATE_MAP[normalized] || { label: state, cls: 'badge--default' };
  return (
    <span className={`wc-state-badge wc-state-badge--${size} ${config.cls}`}>
      {config.label}
    </span>
  );
};

export default StateBadge;
