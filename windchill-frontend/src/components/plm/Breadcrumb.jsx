import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import styles from './Breadcrumb.module.css';

/**
 * Auto-generates breadcrumbs from the current URL path.
 * Supports custom overrides via `extra` prop for detail pages.
 *
 * Usage:
 *   <Breadcrumb />
 *   <Breadcrumb extra={[{ label: 'ECU-005', href: '/plm/parts/42' }]} />
 */

const SEGMENT_LABELS = {
  plm:           null,        // skip — implicit root
  parts:         'Parts',
  worklist:      'Worklist',
  changes:       'Change Management',
  tasks:         'Change Tasks',
  documents:     'Documents',
  products:      'Products',
  projects:      'Projects',
  library:       'Library',
  notifications: 'Notifications',
  'audit-log':   'Audit Log',
  team:          'Team',
  'ai-demo':     'AI Change Intelligence',
  ecr:           'ECR',
  admin:         'Admin',
  users:         'Users',
  dashboard:     'Dashboard',
};

const Breadcrumb = ({ extra = [] }) => {
  const { pathname } = useLocation();

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .reduce((acc, seg, idx, arr) => {
      // Build cumulative href
      const href = '/' + arr.slice(0, idx + 1).join('/');
      const label = SEGMENT_LABELS[seg];

      if (label === null) return acc;          // explicitly skip
      if (label === undefined) {
        // Likely a numeric ID — only show if there's no `extra` to replace it
        if (extra.length === 0) {
          acc.push({ label: `#${seg}`, href, muted: true });
        }
        return acc;
      }
      acc.push({ label, href });
      return acc;
    }, []);

  const crumbs = [
    { label: 'Workspace', href: '/plm/parts' },
    ...segments,
    ...extra,
  ];

  return (
    <nav className={styles.bc} aria-label="Breadcrumb">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className={styles.sep}>›</span>}
            {isLast
              ? <span className={`${styles.item} ${styles.active} ${c.muted ? styles.muted : ''}`}>{c.label}</span>
              : <Link  className={`${styles.item} ${c.muted ? styles.muted : ''}`} to={c.href}>{c.label}</Link>
            }
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
