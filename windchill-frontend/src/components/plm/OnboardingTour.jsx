import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import './OnboardingTour.css';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to PLM Learning Workspace',
    body: 'This platform lets you practice real Product Lifecycle Management (PLM) workflows — the same kind used at Boeing, Airbus, and top manufacturers. Manage parts, BOM, change requests, documents, and team approvals, just like on an enterprise system.',
    target: null,
    position: 'center',
    icon: '🚀',
  },
  {
    id: 'sidebar',
    title: 'Your Navigation Sidebar',
    body: 'Everything lives here: Parts & BOM, Change Management (ECR/ECO), Documents, Worklist, Library, and more. Expand any section header to see sub-items. Use the ‹ button at the bottom-right of the sidebar to collapse it and gain more screen space.',
    target: '.wc-shell__nav',
    position: 'right',
    icon: '🗂️',
  },
  {
    id: 'search',
    title: 'Global Search  (⌘K / Ctrl+K)',
    body: 'Search everything — parts, documents, change requests — from anywhere in the app. Press Ctrl+K (Windows) or ⌘K (Mac) anytime to open search instantly without clicking.',
    target: '.gsb-wrap',
    position: 'bottom',
    icon: '🔍',
  },
  {
    id: 'notifications',
    title: 'Notifications & Worklist',
    body: 'The bell icon shows pending approvals, change notices, and system alerts. Your Worklist (/plm/worklist) is where daily PLM tasks land — approve a change request, review a document, or complete an assigned action item.',
    target: '.nb-bell',
    position: 'bottom',
    icon: '🔔',
  },
  {
    id: 'theme',
    title: 'Light & Dark Mode',
    body: 'Toggle between light and dark themes — your preference is saved automatically. The entire interface adapts, including all charts, panels, and lifecycle state badges.',
    target: '.wc-theme-toggle',
    position: 'bottom',
    icon: '🌙',
  },
  {
    id: 'ai',
    title: 'AI PLM Assistant',
    body: 'The floating button (bottom-right corner) opens your AI assistant. Ask it to find parts, run impact analysis on a change request, explain any lifecycle state, or generate a change notice. It understands full PLM context.',
    target: '.ai-chat-bubble',
    position: 'top',
    icon: '🤖',
  },
  {
    id: 'help',
    title: 'Replay This Tour Anytime',
    body: 'Click the ? button in the header anytime to restart this tour. If you want to go deeper, check the Docs pages and the Windchill System reference at /plm/admin/system.',
    target: '.tour-help-btn',
    position: 'bottom',
    icon: '❓',
  },
  {
    id: 'done',
    title: "You're all set — explore freely!",
    body: "Try the full change loop: create a Part → submit an ECR → approve it in your Worklist → promote to a Change Order. That's real enterprise PLM. The AI assistant can guide you through each step if you get stuck.",
    target: null,
    position: 'center',
    icon: '🎉',
  },
];

const PAD = 12;
const CARD_W = 340;

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep]     = useState(0);
  const [spot, setSpot]     = useState(null);
  const [cardStyle, setCardStyle] = useState({});

  const cur    = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const start = useCallback(() => { setStep(0); setActive(true); }, []);
  const close = useCallback(() => {
    setActive(false);
    localStorage.setItem('wc-tour-seen', '1');
  }, []);

  const next = () => isLast ? close() : setStep(s => s + 1);
  const prev = () => step > 0 && setStep(s => s - 1);

  // Auto-start on first visit
  useEffect(() => {
    if (!localStorage.getItem('wc-tour-seen')) {
      const t = setTimeout(start, 1400);
      return () => clearTimeout(t);
    }
  }, [start]);

  // Re-trigger via header ? button
  useEffect(() => {
    window.addEventListener('wc-start-tour', start);
    return () => window.removeEventListener('wc-start-tour', start);
  }, [start]);

  // Esc to close
  useEffect(() => {
    if (!active) return;
    const h = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [active, close]);

  // Spotlight rect tracking
  const calcSpot = useCallback(() => {
    if (!active || !cur?.target) { setSpot(null); return; }
    const el = document.querySelector(cur.target);
    if (!el) { setSpot(null); return; }
    const r = el.getBoundingClientRect();
    setSpot({
      top:    r.top    - PAD,
      left:   r.left   - PAD,
      width:  r.width  + PAD * 2,
      height: r.height + PAD * 2,
    });
  }, [active, cur]);

  useEffect(() => {
    calcSpot();
    window.addEventListener('resize', calcSpot);
    window.addEventListener('scroll', calcSpot, true);
    return () => {
      window.removeEventListener('resize', calcSpot);
      window.removeEventListener('scroll', calcSpot, true);
    };
  }, [calcSpot]);

  // Card positioning
  useLayoutEffect(() => {
    if (!active) return;
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;
    const tw  = Math.min(CARD_W, vw - 32);
    const GAP = 16;

    if (!spot || cur.position === 'center') {
      setCardStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: tw });
      return;
    }

    const clampL = (l) => Math.max(16, Math.min(l, vw - tw - 16));
    const clampT = (t) => Math.max(16, Math.min(t, vh - 260));

    switch (cur.position) {
      case 'bottom': {
        const top  = clampT(spot.top + spot.height + GAP);
        const left = clampL(spot.left + spot.width / 2 - tw / 2);
        setCardStyle({ top, left, width: tw });
        break;
      }
      case 'top': {
        const top  = clampT(spot.top - 260 - GAP);
        const left = clampL(spot.left + spot.width / 2 - tw / 2);
        setCardStyle({ top, left, width: tw });
        break;
      }
      case 'right': {
        const left = Math.min(spot.left + spot.width + GAP, vw - tw - 16);
        const top  = clampT(spot.top + spot.height / 2 - 130);
        setCardStyle({ top, left, width: tw });
        break;
      }
      case 'left': {
        const left = clampL(spot.left - tw - GAP);
        const top  = clampT(spot.top + spot.height / 2 - 130);
        setCardStyle({ top, left, width: tw });
        break;
      }
      default:
        setCardStyle({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: tw });
    }
  }, [spot, active, cur]);

  if (!active) return null;

  const isCenter = !spot || cur.position === 'center';

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-label="Platform tour">

      {/* Backdrop — always rendered; hidden on desktop for spotlight steps */}
      <div
        className={`tour-backdrop ${isCenter ? 'tour-backdrop--active' : 'tour-backdrop--mobile-only'}`}
        onClick={close}
      />

      {/* Spotlight ring */}
      {!isCenter && spot && (
        <div
          className="tour-spotlight"
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        />
      )}

      {/* Tooltip card — key=step remounts to retrigger pop-in animation */}
      <div
        key={step}
        className="tour-card"
        style={{ position: 'fixed', zIndex: 9995, ...cardStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tour-card__hdr">
          <span className="tour-step-lbl">Step {step + 1} / {STEPS.length}</span>
          <button className="tour-x" onClick={close} title="Skip tour" aria-label="Skip tour">✕</button>
        </div>

        <div className="tour-card__title-row">
          <span className="tour-icon" aria-hidden="true">{cur.icon}</span>
          <h3 className="tour-title">{cur.title}</h3>
        </div>

        <p className="tour-body">{cur.body}</p>

        <div className="tour-dots" aria-label="Tour progress">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`tour-dot${i === step ? ' active' : ''}`}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <div className="tour-card__footer">
          <button className="tour-btn tour-btn--ghost" onClick={prev} disabled={step === 0}>← Back</button>
          <button className="tour-btn tour-btn--primary" onClick={next}>
            {isLast ? 'Finish 🎉' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
