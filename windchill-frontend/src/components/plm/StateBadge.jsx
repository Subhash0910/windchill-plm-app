import React from 'react';
import './StateBadge.css';

/**
 * Maps every lifecycle / workflow state used across the app to a
 * display label + CSS modifier class.
 *
 * CSS classes reference CSS custom-properties defined in windchill-theme.css
 * (or index.css fallbacks). Unknown states get badge--default.
 */
const STATE_MAP = {
  // ── Part lifecycle ───────────────────────────────────────────────────────
  INWORK:       { label: 'In Work',       cls: 'badge--inwork'      },
  UNDERREVIEW:  { label: 'Under Review',  cls: 'badge--underreview' },
  RELEASED:     { label: 'Released',      cls: 'badge--released'    },
  OBSOLETE:     { label: 'Obsolete',      cls: 'badge--obsolete'    },

  // ── Worklist / workflow ──────────────────────────────────────────────────
  PENDING:      { label: 'Pending',       cls: 'badge--pending'     },
  IN_REVIEW:    { label: 'In Review',     cls: 'badge--underreview' },
  APPROVED:     { label: 'Approved',      cls: 'badge--released'    },
  REJECTED:     { label: 'Rejected',      cls: 'badge--obsolete'    },
  COMPLETED:    { label: 'Completed',     cls: 'badge--released'    },

  // ── ECR / Change pipeline ────────────────────────────────────────────────
  DRAFT:        { label: 'Draft',         cls: 'badge--draft'       },
  OPEN:         { label: 'Open',          cls: 'badge--inwork'      },
  SUBMITTED:    { label: 'Submitted',     cls: 'badge--underreview' },
  IMPLEMENTED:  { label: 'Implemented',   cls: 'badge--released'    },
  CLOSED:       { label: 'Closed',        cls: 'badge--obsolete'    },
  CANCELLED:    { label: 'Cancelled',     cls: 'badge--obsolete'    },

  // ── Priority (reused in change tables) ──────────────────────────────────
  CRITICAL:     { label: 'Critical',      cls: 'badge--critical'    },
  HIGH:         { label: 'High',          cls: 'badge--obsolete'    },
  MEDIUM:       { label: 'Medium',        cls: 'badge--pending'     },
  LOW:          { label: 'Low',           cls: 'badge--inwork'      },
};

/**
 * @param {string}  state  - Raw state/status string from the API
 * @param {'sm'|'md'|'lg'} [size='md'] - Badge size
 */
const StateBadge = ({ state, size = 'md' }) => {
  if (!state) return null;
  const key    = state.toString().toUpperCase().trim().replace(/-/g, '_');
  const config = STATE_MAP[key] ?? { label: state, cls: 'badge--default' };
  return (
    <span className={`wc-state-badge wc-state-badge--${size} ${config.cls}`}>
      {config.label}
    </span>
  );
};

export default StateBadge;
