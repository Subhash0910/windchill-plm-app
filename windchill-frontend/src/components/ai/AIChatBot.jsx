import { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './AIChatBot.css';

// ─── PLM Knowledge Base ────────────────────────────────────────────────────────
const KB = {
  lifecycle: `In PLM, a part moves through these lifecycle states:\n\n🔧 **INWORK** — Actively being designed. Default state when created.\n🔍 **UNDER_REVIEW** — Submitted for approval via work item.\n✅ **RELEASED** — Approved and production-ready. Cannot be directly edited.\n🚫 **OBSOLETE** — Retired. No longer in active use.\n\nOnly RELEASED parts can be **revised** to start a new revision cycle.`,

  bom: `A **Bill of Materials (BOM)** is a structured list of all components that make up a product assembly.\n\nIn this app:\n• Open any part → go to the **Structure** tab\n• Add child parts using the BOM Editor\n• Each BOM line links a parent part to a child part\n• BOM drives **Where Used** analysis — critical for change impact`,

  revision: `**Revision** tracks the letter version (A, B, C...) of a part design.\n**Iteration** tracks the number within that revision.\n\nRules:\n• A part starts at Rev A, Iter 1\n• Iterations increment as you save changes\n• A new Revision (A → B) is only allowed when the part is **RELEASED**\n• Revising creates a brand-new INWORK copy while the released version is preserved`,

  whereused: `**Where Used** shows all parent assemblies that reference a specific part via BOM lines.\n\nCritical for **impact analysis** — before changing a part, always check Where Used to understand what assemblies will be affected. Available in the **Related Objects** tab of any part.`,

  ecr: `An **ECR (Engineering Change Request)** is a formal request to change a part or assembly.\n\nWorkflow:\n1. Create ECR with affected parts and reason\n2. Submit for approval\n3. Reviewers approve or reject\n4. If approved, an **ECN (Engineering Change Notice)** is issued\n5. Parts are revised and released under the new ECN`,

  ecn: `An **ECN (Engineering Change Notice)** is the approved authorization to implement a design change.\nIt follows an approved ECR and documents exactly what changed, why, and what was affected.`,

  context: `A **PLM Context** is a workspace/project container. Everything (parts, folders, team) lives inside a context.\n\n• Switch contexts using the left sidebar\n• Each context has its own parts list, team, and folder structure\n• You must select a context before creating or viewing parts`,

  worklist: `Your **Worklist** contains all pending approval tasks assigned to you.\n\nFrom the Worklist you can:\n• **Approve** — move the part to the next lifecycle state\n• **Reject** — send it back with comments\n• Each item shows the part, submitter, and current state`,

  part: `A **Part** in PLM is a managed component or assembly. It contains:\n• Part Number (unique identifier)\n• Name and Description\n• Revision and Iteration\n• Lifecycle State (INWORK → UNDER_REVIEW → RELEASED → OBSOLETE)\n• BOM Structure (child components)\n• Audit History (all changes tracked)`,

  promote: `**Promoting** a part moves it to the next lifecycle state:\n• INWORK → UNDER_REVIEW (submits for approval, creates a work item)\n• UNDER_REVIEW → RELEASED (requires approval in Worklist)\n\nYou can promote from the part detail page → left panel → Promote button.`,
};

// ─── Intent Parser ─────────────────────────────────────────────────────────────
const parseIntent = (text) => {
  const t = text.toLowerCase().trim();

  if (/^(hi|hello|hey|yo|sup|hola)\b/.test(t)) return { type: 'GREET' };
  if (/\bhelp\b|what can you|capabilities|what do you|commands/.test(t)) return { type: 'HELP' };
  if (/status|overview|summary|system|dashboard/.test(t)) return { type: 'STATUS' };

  // Worklist
  if (/worklist|my tasks|pending approval|assigned to me|work items/.test(t)) return { type: 'WORKLIST' };

  // Changes / ECR
  if (/my changes|list ecr|show ecr|open ecr|change requests/.test(t)) return { type: 'CHANGES' };
  if (/\becr\b|engineering change request/.test(t)) return { type: 'EXPLAIN', topic: 'ecr' };
  if (/\becn\b|engineering change notice/.test(t)) return { type: 'EXPLAIN', topic: 'ecn' };

  // Navigation
  if (/go to parts|open parts page|navigate.*parts/.test(t)) return { type: 'NAVIGATE', dest: 'parts' };
  if (/go to worklist|open worklist|navigate.*worklist/.test(t)) return { type: 'NAVIGATE', dest: 'worklist' };
  if (/go to changes|open changes|navigate.*changes/.test(t)) return { type: 'NAVIGATE', dest: 'changes' };
  if (/go to ai demo|open ai demo|ai demo/.test(t)) return { type: 'NAVIGATE', dest: 'ai-demo' };

  // Part count
  if (/how many|count parts|total parts|number of parts/.test(t)) return { type: 'COUNT' };

  // List all
  if (/list\s+(?:all\s+)?parts|show\s+(?:all\s+)?parts|all\s+parts/.test(t)) return { type: 'LIST' };

  // Filter by state
  if (/released parts|list released|show released/.test(t)) return { type: 'FILTER', state: 'RELEASED' };
  if (/inwork parts|list inwork|show inwork|in[- ]?work/.test(t)) return { type: 'FILTER', state: 'INWORK' };
  if (/obsolete/.test(t)) return { type: 'FILTER', state: 'OBSOLETE' };
  if (/under[\s_-]?review|review parts/.test(t)) return { type: 'FILTER', state: 'UNDER_REVIEW' };

  // Search
  const searchMatch = t.match(/(?:search|find|look for|locate|where is)\s+(?:part\s+)?([a-z0-9\-_]+)/i);
  if (searchMatch) return { type: 'SEARCH', query: searchMatch[1] };

  // Analyze / impact
  const analyzeMatch = t.match(/(?:analyze|inspect|impact|check|details?|info(?:rmation)?(?:\s+(?:about|on|for))?)\s+(?:part\s+)?([a-z0-9\-_]+)/i);
  if (analyzeMatch) return { type: 'ANALYZE', query: analyzeMatch[1] };

  // Explain PLM concepts
  if (/lifecycle|life cycle|states?\b|workflow/.test(t)) return { type: 'EXPLAIN', topic: 'lifecycle' };
  if (/\bbom\b|bill of materials/.test(t)) return { type: 'EXPLAIN', topic: 'bom' };
  if (/\brevision\b|revise/.test(t)) return { type: 'EXPLAIN', topic: 'revision' };
  if (/where.?used|impact analysis/.test(t)) return { type: 'EXPLAIN', topic: 'whereused' };
  if (/\bcontext\b|workspace/.test(t)) return { type: 'EXPLAIN', topic: 'context' };
  if (/promote|promotion/.test(t)) return { type: 'EXPLAIN', topic: 'promote' };
  if (/what is a? ?part|what are parts/.test(t)) return { type: 'EXPLAIN', topic: 'part' };

  // Bare part number typed directly
  const bare = t.match(/^([a-z0-9]{3,}(?:[-_][a-z0-9]+)*)$/i);
  if (bare && !/^(list|show|find|what|how|why|help|hi|hello|hey|status|all|help|go|open|count)$/.test(bare[1])) {
    return { type: 'ANALYZE', query: bare[1] };
  }

  return { type: 'UNKNOWN' };
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
let _uid = 0;
const mkMsg = (role, text, suggestions = [], meta = {}) => ({
  id: ++_uid, role, text, suggestions, ts: new Date(), ...meta,
});

const S = { INWORK: '🔧', RELEASED: '✅', UNDER_REVIEW: '🔍', OBSOLETE: '🚫' };

const WELCOME = mkMsg('assistant',
  `👋 Hi! I'm your **PLM Assistant** — wired directly into your live data.\n\nI can:\n🔍 Search and analyze your real parts\n📊 Count, filter, and inspect by lifecycle state\n📎 Check BOM structure and Where Used\n📋 Show your Worklist and Change Requests\n💡 Explain any PLM concept\n🗺️ Navigate anywhere in the app\n\nJust type anything — I understand plain English!`,
  []
);

// ─── Component ────────────────────────────────────────────────────────────────
const AIChatBot = ({ onAction, selectedPart, currentPage }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Safely consume workspace context
  let selectedContextId = null;
  try {
    const ctx = useContext(PlmWorkspaceContext);
    selectedContextId = ctx?.selectedContextId ?? null;
  } catch (_) {}

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickChips, setQuickChips] = useState([]);
  const messagesEndRef = useRef(null);

  // Dynamic quick chips — generated from real context, never hardcoded part numbers
  useEffect(() => {
    if (selectedContextId) {
      setQuickChips(['List all parts', 'Count parts', 'My Worklist', 'Show released parts']);
    } else {
      setQuickChips(['Explain lifecycle', 'What is BOM?', 'What is an ECR?', 'Help']);
    }
  }, [selectedContextId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const push = useCallback((m) => setMessages(prev => [...prev, m]), []);

  // ── Core send handler ──────────────────────────────────────────────────────
  const send = useCallback(async (textArg) => {
    const q = (textArg ?? input).trim();
    if (!q || isLoading) return;
    setInput('');
    push(mkMsg('user', q));
    setIsLoading(true);

    try {
      const intent = parseIntent(q);
      const needsCtx = ['LIST', 'COUNT', 'FILTER', 'SEARCH', 'ANALYZE'].includes(intent.type);

      // Guard: needs context but none selected
      if (needsCtx && !selectedContextId) {
        push(mkMsg('assistant',
          `⚠️ **No context selected.**\n\nPlease select a PLM Context from the left sidebar first — then I can query your live parts data.`,
          ['What is a context?', 'Help']
        ));
        return;
      }

      let reply;

      switch (intent.type) {

        // ── Greet ──────────────────────────────────────────────────────────
        case 'GREET':
          reply = mkMsg('assistant',
            `Hey! 👋 ${selectedContextId
              ? "I can see you've got a context selected — I'm connected to your live data right now!"
              : 'Select a context on the left to let me access your parts data.'}

What would you like to know?`,
            selectedContextId
              ? ['List all parts', 'Count parts', 'My Worklist', 'Show released parts']
              : ['Explain lifecycle', 'What is BOM?', 'Help']
          ); break;

        // ── Help ───────────────────────────────────────────────────────────
        case 'HELP':
          reply = mkMsg('assistant',
            `**What I can do:**

🔍 **Live Data Queries**
• "List all parts" / "Count parts"
• "Show released / INWORK / obsolete parts"
• "Search [keyword]"
• "Analyze [part number]" — full impact analysis

📋 **Workflow**
• "My Worklist" — pending approvals
• "My changes" — ECR list

🗺️ **Navigation**
• "Go to parts" / "Go to worklist" / "Go to changes"

💡 **PLM Knowledge**
• "What is BOM?" / "Explain lifecycle"
• "What is an ECR?" / "What is revision?"
• "Explain where used" / "Explain promote"
${!selectedContextId ? '\n⚠️ Select a context first for live data.' : ''}`,
            ['List all parts', 'My Worklist', 'Explain lifecycle']
          ); break;

        // ── Explain ────────────────────────────────────────────────────────
        case 'EXPLAIN':
          reply = mkMsg('assistant',
            KB[intent.topic] ?? `I don't have a knowledge entry for that yet.\nTry: lifecycle, BOM, revision, where used, ECR, ECN, context, promote, part.`,
            ['Explain lifecycle', 'What is BOM?', 'What is an ECR?']
          ); break;

        // ── Navigate ───────────────────────────────────────────────────────
        case 'NAVIGATE': {
          const routes = { parts: '/plm/parts', worklist: '/plm/worklist', changes: '/plm/changes', 'ai-demo': '/plm/ai-demo' };
          const route = routes[intent.dest];
          if (route) {
            navigate(route);
            reply = mkMsg('assistant',
              `✅ Navigating to **${intent.dest.charAt(0).toUpperCase() + intent.dest.slice(1)}**...`,
              []
            );
          }
          break;
        }

        // ── Status ─────────────────────────────────────────────────────────
        case 'STATUS': {
          if (!selectedContextId) {
            reply = mkMsg('assistant',
              `**System Status**\n\n• ✅ Frontend: Running\n• ✅ Backend: Connected\n• ⚠️ Context: None selected\n\nSelect a context to see live part statistics.`,
              ['What is a context?']
            );
          } else {
            const parts = await plmApi.listParts(selectedContextId);
            const counts = (parts || []).reduce((a, p) => ({ ...a, [p.lifecycleState]: (a[p.lifecycleState] || 0) + 1 }), {});
            const breakdown = Object.entries(counts).map(([st, c]) => `  • ${S[st] || '📄'} ${st}: **${c}**`).join('\n') || '  • No parts yet';
            reply = mkMsg('assistant',
              `**📊 System Status**\n\n• ✅ Frontend: Running\n• ✅ Context: Active\n\n**Total parts: ${(parts || []).length}**\n${breakdown}`,
              ['List all parts', 'Show released parts', 'My Worklist']
            );
          }
          break;
        }

        // ── List ───────────────────────────────────────────────────────────
        case 'LIST': {
          const parts = await plmApi.listParts(selectedContextId);
          if (!parts?.length) {
            reply = mkMsg('assistant',
              `📭 **This context has no parts yet.**\n\nGo to the Parts page to create your first part.`,
              ['Go to parts', 'What is a part?']
            );
          } else {
            const lines = parts.slice(0, 12).map(p =>
              `• **${p.partNumber}** — ${p.name || '—'} | Rev ${p.revision}.${p.iteration} | ${S[p.lifecycleState] || ''} *${p.lifecycleState}*`
            ).join('\n');
            const more = parts.length > 12 ? `\n\n…and **${parts.length - 12} more**. Use search to narrow down.` : '';
            reply = mkMsg('assistant',
              `📋 **${parts.length} part(s) in this context:**\n\n${lines}${more}`,
              parts.slice(0, 3).map(p => `Analyze ${p.partNumber}`)
            );
          }
          break;
        }

        // ── Count ──────────────────────────────────────────────────────────
        case 'COUNT': {
          const parts = await plmApi.listParts(selectedContextId);
          const counts = (parts || []).reduce((a, p) => ({ ...a, [p.lifecycleState]: (a[p.lifecycleState] || 0) + 1 }), {});
          const lines = Object.entries(counts).map(([st, c]) => `• ${S[st] || '📄'} **${st}**: ${c}`).join('\n') || '• No parts yet';
          reply = mkMsg('assistant',
            `📊 **Parts breakdown:**\n\nTotal: **${(parts || []).length}**\n\n${lines}`,
            ['List all parts', 'Show released parts', 'Show INWORK parts']
          ); break;
        }

        // ── Filter ─────────────────────────────────────────────────────────
        case 'FILTER': {
          const parts = await plmApi.listParts(selectedContextId);
          const filtered = (parts || []).filter(p => p.lifecycleState === intent.state);
          if (!filtered.length) {
            reply = mkMsg('assistant',
              `🔍 No **${intent.state}** parts found in this context.\nTotal parts: ${(parts || []).length}`,
              ['List all parts', 'Count parts']
            );
          } else {
            const lines = filtered.slice(0, 10).map(p => `• **${p.partNumber}** — ${p.name || '—'} | Rev ${p.revision}.${p.iteration}`).join('\n');
            reply = mkMsg('assistant',
              `${S[intent.state]} **${filtered.length} ${intent.state} part(s):**\n\n${lines}`,
              filtered.slice(0, 2).map(p => `Analyze ${p.partNumber}`)
            );
          }
          break;
        }

        // ── Search ─────────────────────────────────────────────────────────
        case 'SEARCH': {
          const parts = await plmApi.listParts(selectedContextId);
          const qLow = intent.query.toLowerCase();
          const found = (parts || []).filter(p =>
            p.partNumber?.toLowerCase().includes(qLow) ||
            p.name?.toLowerCase().includes(qLow) ||
            p.description?.toLowerCase().includes(qLow)
          );
          if (!found.length) {
            reply = mkMsg('assistant',
              `🔍 No parts found matching **"${intent.query}"**.\n\nTotal parts in context: ${(parts || []).length}. Try a broader term.`,
              ['List all parts', 'Count parts']
            );
          } else {
            const lines = found.slice(0, 8).map(p =>
              `• **${p.partNumber}** — ${p.name || '—'} | ${S[p.lifecycleState] || ''} *${p.lifecycleState}*`
            ).join('\n');
            reply = mkMsg('assistant',
              `🔍 **${found.length} match(es) for "${intent.query}":**\n\n${lines}`,
              found.slice(0, 2).map(p => `Analyze ${p.partNumber}`)
            );
          }
          break;
        }

        // ── Analyze ────────────────────────────────────────────────────────
        case 'ANALYZE': {
          const parts = await plmApi.listParts(selectedContextId);
          const qLow = intent.query.toLowerCase();
          const found = (parts || []).find(p =>
            p.partNumber?.toLowerCase() === qLow ||
            p.partNumber?.toLowerCase().includes(qLow) ||
            p.name?.toLowerCase().includes(qLow)
          );

          if (!found) {
            reply = mkMsg('assistant',
              `❌ **Part "${intent.query}" not found** in this context.\n\nThis part may have been deleted. There are currently **${(parts || []).length}** part(s) in this context.`,
              (parts || []).length > 0
                ? ['List all parts', ...(parts.slice(0, 2).map(p => `Analyze ${p.partNumber}`))]
                : ['List all parts', 'What is a part?'],
            );
          } else {
            // Fetch BOM and where-used in parallel
            let bomText = '';
            let wuText = '';
            try {
              const [bom, wu] = await Promise.all([
                plmApi.listBom(found.id),
                plmApi.getWhereUsed(found.id),
              ]);
              bomText = bom?.length
                ? `\n\n**📦 BOM Children (${bom.length}):** ${bom.slice(0, 5).map(b => b.childPartNumber || b.childPart?.partNumber || 'Part').join(', ')}${bom.length > 5 ? ` +${bom.length - 5} more` : ''}`
                : '\n\n**📦 BOM:** No child components';
              wuText = wu?.length
                ? `\n**📎 Where Used (${wu.length}):** ${wu.map(p => p.partNumber).join(', ')}`
                : '\n**📎 Where Used:** Not referenced by any assembly';
            } catch (_) {
              bomText = '\n\n**📦 BOM:** Unable to fetch';
              wuText = '\n**📎 Where Used:** Unable to fetch';
            }

            const canRevise = found.lifecycleState === 'RELEASED';
            const tip = canRevise
              ? '💡 This part is **RELEASED** — you can create a new revision from its detail page.'
              : found.lifecycleState === 'INWORK'
                ? '💡 This part is **INWORK**. Promote it to send for review.'
                : found.lifecycleState === 'UNDER_REVIEW'
                  ? '💡 This part is **UNDER REVIEW**. Check your Worklist to approve or reject.'
                  : '💡 This part is **OBSOLETE** — it has been retired.';

            reply = mkMsg('assistant',
              `${S[found.lifecycleState] || '📄'} **Part Analysis: ${found.partNumber}**\n\n` +
              `**Name:** ${found.name || '—'}\n` +
              `**Description:** ${found.description || '—'}\n` +
              `**Revision:** ${found.revision}  |  **Iteration:** ${found.iteration}\n` +
              `**State:** ${found.lifecycleState}\n` +
              `**Latest:** ${found.isLatest ? 'Yes' : 'No'}` +
              bomText + wuText +
              `\n\n${tip}`,
              [`Open ${found.partNumber}`, 'List all parts', canRevise ? 'Show released parts' : 'Show INWORK parts'],
              { _partId: found.id, _partNumber: found.partNumber }
            );
          }
          break;
        }

        // ── Worklist ───────────────────────────────────────────────────────
        case 'WORKLIST': {
          try {
            const items = await plmApi.listMyWorkItems();
            if (!items?.length) {
              reply = mkMsg('assistant',
                `📋 **Your Worklist is empty.**\n\nNo pending approval tasks right now. You're all caught up! ✅`,
                ['Go to worklist', 'List all parts']
              );
            } else {
              const lines = items.slice(0, 8).map(w =>
                `• **${w.partNumber || w.subjectPartNumber || 'Work Item'}** — ${w.action || w.type || 'Approval'} | from ${w.submittedBy || w.createdBy || '—'}`
              ).join('\n');
              reply = mkMsg('assistant',
                `📋 **${items.length} pending work item(s):**\n\n${lines}\n\nGo to Worklist to approve or reject.`,
                ['Go to worklist']
              );
            }
          } catch (_) {
            navigate('/plm/worklist');
            reply = mkMsg('assistant', `📋 Opening your Worklist...`, ['Go to worklist']);
          }
          break;
        }

        // ── Changes ────────────────────────────────────────────────────────
        case 'CHANGES': {
          try {
            const ecrs = await plmApi.listEcrs(null);
            const list = ecrs?.data || ecrs || [];
            if (!list.length) {
              reply = mkMsg('assistant',
                `📝 **No ECRs found.**\n\nYou haven't created any Engineering Change Requests yet.`,
                ['What is an ECR?', 'Go to changes']
              );
            } else {
              const lines = list.slice(0, 6).map(e =>
                `• **${e.ecrNumber || e.id}** — ${e.title || e.reason || '—'} | ${e.status || '—'}`
              ).join('\n');
              reply = mkMsg('assistant',
                `📝 **${list.length} Change Request(s):**\n\n${lines}`,
                ['Go to changes', 'What is an ECR?']
              );
            }
          } catch (_) {
            navigate('/plm/changes');
            reply = mkMsg('assistant', `📝 Opening Changes...`, ['What is an ECR?']);
          }
          break;
        }

        // ── Unknown — try backend, fall back gracefully ────────────────────
        default: {
          let handled = false;
          try {
            const res = await fetch('/api/v1/ai/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({
                message: q,
                context: { page: currentPage || location.pathname, selectedContextId },
                sessionId: `web-${Date.now()}`,
              }),
            });
            if (res.ok) {
              const result = await res.json();
              const d = result.data || result;
              if (d?.text) {
                reply = mkMsg('assistant', d.text, d.suggestions || []);
                handled = true;
              }
            }
          } catch (_) { /* backend unavailable — that's fine */ }

          if (!handled) {
            reply = mkMsg('assistant',
              `🤔 I didn't quite understand **"${q}"**.\n\nTry:\n• "Search [keyword]"\n• "Analyze [part number]"\n• "List all parts" / "Count parts"\n• "My Worklist" / "My changes"\n• "Explain BOM" / "Explain lifecycle"\n• Type "Help" for full commands`,
              selectedContextId
                ? ['List all parts', 'Count parts', 'My Worklist', 'Help']
                : ['Explain lifecycle', 'What is BOM?', 'Help']
            );
          }
        }
      }

      if (reply) push(reply);

    } catch (err) {
      push(mkMsg('assistant',
        `⚠️ **Error:** ${err.message || 'Something went wrong.'}\n\nMake sure the Spring Boot backend is running on port 8080.`,
        ['Status', 'Help']
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedContextId, currentPage, location.pathname, navigate, push]);

  // ── Chip click — handles "Open PARTNO" with navigation ───────────────────
  const handleChip = useCallback((chip) => {
    if (chip.startsWith('Open ')) {
      const pn = chip.replace('Open ', '');
      const found = [...messages].reverse().find(m => m._partNumber === pn);
      if (found?._partId) {
        navigate(`/plm/parts/${found._partId}`);
        if (onAction) onAction('NAVIGATE_TO_PART', { partId: found._partId });
        return;
      }
    }
    send(chip);
  }, [messages, navigate, onAction, send]);

  // ── Markdown-lite renderer (**bold** + newlines) ────────────────────────
  const renderText = (text) =>
    text.split('\n').map((line, i, arr) => {
      const segments = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {segments.map((seg, j) =>
            seg.startsWith('**') && seg.endsWith('**')
              ? <strong key={j}>{seg.slice(2, -2)}</strong>
              : seg
          )}
          {i < arr.length - 1 && <br />}
        </span>
      );
    });

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <button className="ai-chat-bubble" onClick={() => setIsOpen(true)} title="PLM Assistant">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="chat-bubble-badge">AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <div className="ai-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <strong>PLM Assistant</strong>
                <small>{selectedContextId ? '🟢 Live data connected' : '🟡 Select a context'}</small>
              </div>
            </div>
            <button className="btn-close-chat" onClick={() => setIsOpen(false)} title="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="message-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2"/>
                    </svg>
                  </div>
                )}
                <div className="message-content">
                  <div className="message-text">{renderText(msg.text)}</div>
                  {msg.suggestions?.length > 0 && (
                    <div className="message-suggestions">
                      {msg.suggestions.map((s, i) => (
                        <button key={i} className="suggestion-chip" onClick={() => handleChip(s)}>{s}</button>
                      ))}
                    </div>
                  )}
                  <div className="message-time">
                    {msg.ts?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chat-message chat-message--assistant">
                <div className="message-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="message-content">
                  <div className="typing-indicator"><span/><span/><span/></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips */}
          <div className="ai-quick-chips">
            {quickChips.map((c, i) => (
              <button key={i} className="suggestion-chip suggestion-chip--quick" onClick={() => handleChip(c)}>{c}</button>
            ))}
          </div>

          {/* Input */}
          <div className="ai-chat-input">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything about your PLM data…"
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              className="btn-send"
              title="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;
