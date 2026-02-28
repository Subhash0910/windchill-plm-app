import { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { plmApi } from '../../services/plmApi';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import './AIChatBot.css';

// ── PLM Knowledge Base ────────────────────────────────────────────────────────
const KB = {
  lifecycle: `In PLM, a part moves through these lifecycle states:\n\n🔧 **INWORK** — Actively being designed. Default state when created.\n🔍 **UNDER_REVIEW** — Submitted for approval via work item.\n✅ **RELEASED** — Approved and production-ready. Cannot be directly edited.\n🚫 **OBSOLETE** — Retired. No longer in active use.\n\nOnly RELEASED parts can be **revised** to start a new revision cycle.`,
  bom: `A **Bill of Materials (BOM)** is a structured list of all components that make up a product assembly.\n\nIn this app:\n• Open any part → go to the **Structure** tab\n• Add child parts using the BOM Editor\n• Each BOM line links a parent part to a child part\n• BOM drives **Where Used** analysis — critical for change impact`,
  revision: `**Revision** tracks the letter version (A, B, C…) of a part design. **Iteration** tracks the number within that revision.\n\nRules:\n• A part starts at Rev A, Iter 1\n• A new Revision (A → B) is only allowed when the part is **RELEASED**\n• Revising creates a brand-new INWORK copy while the released version is preserved`,
  whereused: `**Where Used** shows all parent assemblies that reference a specific part via BOM lines.\n\nCritical for **impact analysis** — before changing a part, check Where Used to understand what assemblies will be affected.`,
  ecr: `An **ECR (Engineering Change Request)** is a formal request to change a part.\n\nWorkflow: Create ECR → Submit → Reviewers approve/reject → If approved, ECN issued → Parts revised and released.`,
  ecn: `An **ECN (Engineering Change Notice)** is the approved authorization to implement a design change. It follows an approved ECR.`,
  context: `A **PLM Context** is a workspace/project container. Everything (parts, folders, team) lives inside a context. Switch contexts using the left sidebar.`,
  worklist: `Your **Worklist** contains all pending approval tasks assigned to you. Approve or reject each item to move parts through the lifecycle.`,
  part: `A **Part** in PLM is a managed component. It has a Part Number, Name, Revision, Iteration, Lifecycle State, BOM Structure, and Audit History.`,
  promote: `**Promoting** a part moves it to the next lifecycle state:\n• INWORK → UNDER_REVIEW (submits for approval)\n• UNDER_REVIEW → RELEASED (requires Worklist approval)\n\nYou can promote from the part detail page, or just say **"promote [partNumber]"** here.`,
  impact: `**Impact Analysis** uses AI to calculate the risk score, BOM depth, affected assemblies, and conflicting changes for a given part modification.\n\nSay **"run impact on [partNumber]"** to trigger the analysis directly from chat.`,
};

// ── Intent Parser ─────────────────────────────────────────────────────────────
const parseIntent = (text) => {
  const t = text.toLowerCase().trim();

  if (/^(hi|hello|hey|yo|sup|hola)\b/.test(t)) return { type: 'GREET' };
  if (/\bhelp\b|what can you|capabilities|what do you|commands/.test(t)) return { type: 'HELP' };
  if (/status|overview|summary|system|dashboard/.test(t)) return { type: 'STATUS' };

  // Worklist
  if (/worklist|my tasks|pending approval|assigned to me|work items/.test(t)) return { type: 'WORKLIST' };

  // Approve / Reject task
  const approvMatch = t.match(/approve\s+(?:task\s+)?(?:my\s+first|#?(\d+)|first)?\s*(?:task)?/i);
  if (approvMatch && t.includes('approv')) return { type: 'APPROVE_TASK', id: approvMatch[1] || null };
  const rejectMatch = t.match(/reject\s+(?:task\s+)?(?:#?(\d+))?/i);
  if (rejectMatch && t.includes('reject')) return { type: 'REJECT_TASK', id: rejectMatch[1] || null };

  // Changes / ECR
  if (/my changes|list ecr|show ecr|open ecr|change requests/.test(t)) return { type: 'CHANGES' };
  if (/\becr\b|engineering change request/.test(t)) return { type: 'EXPLAIN', topic: 'ecr' };
  if (/\becn\b|engineering change notice/.test(t)) return { type: 'EXPLAIN', topic: 'ecn' };

  // Promote a part
  const promoteMatch = t.match(/promote\s+(?:part\s+)?([a-z0-9\-_]+)/i);
  if (promoteMatch) return { type: 'PROMOTE', query: promoteMatch[1] };

  // Revise a part
  const reviseMatch = t.match(/revise\s+(?:part\s+)?([a-z0-9\-_]+)/i);
  if (reviseMatch) return { type: 'REVISE', query: reviseMatch[1] };

  // ✅ FIX: Impact Analysis — correctly skip 'on'/'for' before part number
  // Matches: "run impact on P001", "run impact P001", "impact analysis on P001", "impact on P001"
  const impactMatch = t.match(/(?:run\s+impact|impact(?:\s+analysis)?)\s+(?:on\s+|for\s+)?(?:part\s+)?([a-z0-9\-_]+)/i);
  if (impactMatch && !['on', 'for', 'the', 'a', 'an'].includes(impactMatch[1].toLowerCase())) {
    return { type: 'IMPACT', query: impactMatch[1] };
  }

  // BOM view
  const bomMatch = t.match(/(?:bom|structure|children|child parts?)\s+(?:of\s+|for\s+)?(?:part\s+)?([a-z0-9\-_]+)/i);
  if (bomMatch && bomMatch[1]) return { type: 'BOM_VIEW', query: bomMatch[1] };

  // Where used
  const wuMatch = t.match(/(?:where.?used|used\s+in|parent.?assemblies?)\s+(?:of\s+|for\s+)?(?:part\s+)?([a-z0-9\-_]+)/i);
  if (wuMatch && wuMatch[1]) return { type: 'WHERE_USED', query: wuMatch[1] };

  // Navigation
  if (/go to parts|open parts page|navigate.*parts/.test(t)) return { type: 'NAVIGATE', dest: 'parts' };
  if (/go to worklist|open worklist|navigate.*worklist/.test(t)) return { type: 'NAVIGATE', dest: 'worklist' };
  if (/go to changes|open changes|navigate.*changes/.test(t)) return { type: 'NAVIGATE', dest: 'changes' };
  if (/go to ai demo|open ai demo|ai demo/.test(t)) return { type: 'NAVIGATE', dest: 'ai-demo' };

  // Part counts / filters
  if (/how many|count parts|total parts|number of parts/.test(t)) return { type: 'COUNT' };
  if (/list\s+(?:all\s+)?parts|show\s+(?:all\s+)?parts|all\s+parts/.test(t)) return { type: 'LIST' };
  if (/released parts|list released|show released/.test(t)) return { type: 'FILTER', state: 'RELEASED' };
  if (/inwork parts|list inwork|show inwork|in[- ]?work/.test(t)) return { type: 'FILTER', state: 'INWORK' };
  if (/obsolete/.test(t)) return { type: 'FILTER', state: 'OBSOLETE' };
  if (/under[\s_-]?review|review parts/.test(t)) return { type: 'FILTER', state: 'UNDER_REVIEW' };

  // Search
  const searchMatch = t.match(/(?:search|find|look for|locate|where is)\s+(?:part\s+)?([a-z0-9\-_]+)/i);
  if (searchMatch) return { type: 'SEARCH', query: searchMatch[1] };

  // Analyze
  const analyzeMatch = t.match(/(?:analyze|inspect|check|details?|info(?:rmation)?(?:\s+(?:about|on|for))?)\s+(?:part\s+)?([a-z0-9\-_]+)/i);
  if (analyzeMatch && !['on', 'for', 'about'].includes(analyzeMatch[1].toLowerCase())) {
    return { type: 'ANALYZE', query: analyzeMatch[1] };
  }

  // Explain PLM concepts
  if (/lifecycle|life cycle|states?\b|workflow/.test(t)) return { type: 'EXPLAIN', topic: 'lifecycle' };
  if (/\bbom\b|bill of materials/.test(t)) return { type: 'EXPLAIN', topic: 'bom' };
  if (/\brevision\b|revise/.test(t)) return { type: 'EXPLAIN', topic: 'revision' };
  if (/where.?used|impact analysis/.test(t)) return { type: 'EXPLAIN', topic: 'whereused' };
  if (/\bcontext\b|workspace/.test(t)) return { type: 'EXPLAIN', topic: 'context' };
  if (/promote|promotion/.test(t)) return { type: 'EXPLAIN', topic: 'promote' };
  if (/impact|risk analysis/.test(t)) return { type: 'EXPLAIN', topic: 'impact' };
  if (/what is a? ?part|what are parts/.test(t)) return { type: 'EXPLAIN', topic: 'part' };

  // Bare part number typed directly
  const bare = t.match(/^([a-z0-9]{2,}(?:[-_][a-z0-9]+)*)$/i);
  if (bare && !/^(list|show|find|what|how|why|help|hi|hello|hey|status|all|go|open|count|approve|reject|on|for|the|it|this|that)$/.test(bare[1])) {
    return { type: 'ANALYZE', query: bare[1] };
  }

  // Memory follow-ups: "impact on it", "promote it"
  const followUp = t.match(/(?:impact|promote|revise|bom|where.?used|analyze)\s+(it|this|that|the part)$/i);
  if (followUp) return { type: 'FOLLOWUP', action: t.split(' ')[0] };

  return { type: 'UNKNOWN' };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
let _uid = 0;
const mkMsg = (role, text, suggestions = [], meta = {}) => ({
  id: ++_uid, role, text, suggestions, ts: new Date(), ...meta,
});

const S = { INWORK: '🔧', RELEASED: '✅', UNDER_REVIEW: '🔍', OBSOLETE: '🚫' };

const WELCOME = mkMsg('assistant',
  `👋 Hi! I'm your **PLM Assistant** — wired into your live data.\n\nI can:\n🔍 Search, analyze & inspect your real parts\n📊 Count, filter by lifecycle state\n📎 Check BOM & Where Used\n📋 Show Worklist, approve/reject tasks\n🔥 Run AI Impact Analysis from chat\n⚡ Promote or Revise parts directly from here\n💡 Explain any PLM concept\n\nJust type anything — I understand plain English!`,
  []
);

const findPart = (parts, query) => {
  const q = query.toLowerCase();
  return (parts || []).find(p =>
    p.partNumber?.toLowerCase() === q ||
    p.partNumber?.toLowerCase().includes(q) ||
    p.name?.toLowerCase().includes(q)
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
const AIChatBot = ({ onAction, selectedPart, currentPage }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [memory, setMemory] = useState({ lastPart: null, lastQuery: null, lastIntent: null });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (memory.lastPart) {
      setQuickChips([
        `Analyze ${memory.lastPart.partNumber}`,
        `Run impact on ${memory.lastPart.partNumber}`,
        memory.lastPart.lifecycleState === 'INWORK'
          ? `Promote ${memory.lastPart.partNumber}`
          : `BOM of ${memory.lastPart.partNumber}`,
        `Where used ${memory.lastPart.partNumber}`,
      ]);
    } else if (selectedContextId) {
      setQuickChips(['List all parts', 'Count parts', 'My Worklist', 'Show released parts']);
    } else {
      setQuickChips(['Explain lifecycle', 'What is BOM?', 'What is an ECR?', 'Help']);
    }
  }, [memory.lastPart, selectedContextId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const push = useCallback((m) => setMessages(prev => [...prev, m]), []);

  const send = useCallback(async (textArg) => {
    const q = (textArg ?? input).trim();
    if (!q || isLoading) return;
    setInput('');
    push(mkMsg('user', q));
    setIsLoading(true);

    try {
      let intent = parseIntent(q);

      // Resolve follow-ups using memory
      if (intent.type === 'FOLLOWUP' && memory.lastPart) {
        const action = intent.action;
        if (action === 'impact') intent = { type: 'IMPACT', query: memory.lastPart.partNumber };
        else if (action === 'promote') intent = { type: 'PROMOTE', query: memory.lastPart.partNumber };
        else if (action === 'revise') intent = { type: 'REVISE', query: memory.lastPart.partNumber };
        else if (action === 'bom') intent = { type: 'BOM_VIEW', query: memory.lastPart.partNumber };
        else intent = { type: 'ANALYZE', query: memory.lastPart.partNumber };
      }

      const needsCtx = ['LIST', 'COUNT', 'FILTER', 'SEARCH', 'ANALYZE', 'PROMOTE', 'REVISE', 'BOM_VIEW', 'WHERE_USED', 'IMPACT'].includes(intent.type);

      if (needsCtx && !selectedContextId) {
        push(mkMsg('assistant',
          `⚠️ **No context selected.**\n\nPlease select a PLM Context from the left sidebar first.`,
          ['What is a context?', 'Help']
        ));
        return;
      }

      let parts = null;
      if (needsCtx) parts = await plmApi.listParts(selectedContextId);

      let reply;

      switch (intent.type) {

        case 'GREET':
          reply = mkMsg('assistant',
            `Hey! 👋 ${selectedContextId ? "Context is active — I'm connected to your live data!" : 'Select a context on the left to access your parts data.'}

What would you like to know?`,
            selectedContextId
              ? ['List all parts', 'Count parts', 'My Worklist', 'Show released parts']
              : ['Explain lifecycle', 'What is BOM?', 'Help']
          ); break;

        case 'HELP':
          reply = mkMsg('assistant',
            `**What I can do:**

🔍 **Live Data**
• "List all parts" / "Count parts"
• "Show released / INWORK / obsolete parts"
• "Search [keyword]" / "Analyze [partNumber]"
• "BOM of [partNumber]" / "Where used [partNumber]"

⚡ **Actions**
• "Promote [partNumber]" — submits for approval
• "Revise [partNumber]" — creates new revision
• "Run impact on [partNumber]" — AI impact analysis
• "Approve my first task" / "Reject task [id]"

📋 **Workflow**
• "My Worklist" / "My changes"

🗺️ **Navigation**
• "Go to parts / worklist / changes / ai demo"

💡 **Knowledge**
• "Explain lifecycle" / "What is BOM?" / "What is ECR?"
${!selectedContextId ? '\n⚠️ Select a context first for live data.' : ''}`,
            ['List all parts', 'My Worklist', 'Explain lifecycle']
          ); break;

        case 'EXPLAIN':
          reply = mkMsg('assistant',
            KB[intent.topic] ?? `I don't have a knowledge entry for that yet.\nTry: lifecycle, BOM, revision, where used, ECR, ECN, context, promote, impact, part.`,
            ['Explain lifecycle', 'What is BOM?', 'What is an ECR?']
          ); break;

        case 'NAVIGATE': {
          const routes = { parts: '/plm/parts', worklist: '/plm/worklist', changes: '/plm/changes', 'ai-demo': '/plm/ai-demo' };
          const route = routes[intent.dest];
          if (route) {
            navigate(route);
            reply = mkMsg('assistant', `✅ Navigating to **${intent.dest.charAt(0).toUpperCase() + intent.dest.slice(1)}**...`, []);
          }
          break;
        }

        case 'STATUS': {
          if (!selectedContextId) {
            reply = mkMsg('assistant',
              `**System Status**\n\n• ✅ Frontend: Running\n• ⚠️ Context: None selected`,
              ['What is a context?']
            );
          } else {
            const p = await plmApi.listParts(selectedContextId);
            const counts = (p || []).reduce((a, x) => ({ ...a, [x.lifecycleState]: (a[x.lifecycleState] || 0) + 1 }), {});
            const breakdown = Object.entries(counts).map(([st, c]) => `  • ${S[st] || '📄'} ${st}: **${c}**`).join('\n') || '  • No parts yet';
            reply = mkMsg('assistant',
              `**📊 System Status**\n\n• ✅ Frontend: Running\n• ✅ Context: Active\n\n**Total parts: ${(p || []).length}**\n${breakdown}`,
              ['List all parts', 'Show released parts', 'My Worklist']
            );
          }
          break;
        }

        case 'LIST': {
          if (!parts?.length) {
            reply = mkMsg('assistant',
              `🔭 **This context has no parts yet.**\n\nGo to the Parts page to create your first part.`,
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

        case 'COUNT': {
          const counts = (parts || []).reduce((a, p) => ({ ...a, [p.lifecycleState]: (a[p.lifecycleState] || 0) + 1 }), {});
          const lines = Object.entries(counts).map(([st, c]) => `• ${S[st] || '📄'} **${st}**: ${c}`).join('\n') || '• No parts yet';
          reply = mkMsg('assistant',
            `📊 **Parts breakdown:**\n\nTotal: **${(parts || []).length}**\n\n${lines}`,
            ['List all parts', 'Show released parts', 'Show INWORK parts']
          ); break;
        }

        case 'FILTER': {
          const filtered = (parts || []).filter(p => p.lifecycleState === intent.state);
          if (!filtered.length) {
            reply = mkMsg('assistant',
              `🔍 No **${intent.state}** parts in this context.\nTotal: ${(parts || []).length}`,
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

        case 'SEARCH': {
          const qLow = intent.query.toLowerCase();
          const found = (parts || []).filter(p =>
            p.partNumber?.toLowerCase().includes(qLow) ||
            p.name?.toLowerCase().includes(qLow) ||
            p.description?.toLowerCase().includes(qLow)
          );
          if (!found.length) {
            reply = mkMsg('assistant',
              `🔍 No parts found matching **"${intent.query}"**.\nTotal parts: ${(parts || []).length}.`,
              ['List all parts', 'Count parts']
            );
          } else {
            const lines = found.slice(0, 8).map(p =>
              `• **${p.partNumber}** — ${p.name || '—'} | ${S[p.lifecycleState] || ''} *${p.lifecycleState}*`
            ).join('\n');
            if (found[0]) setMemory(m => ({ ...m, lastPart: found[0] }));
            reply = mkMsg('assistant',
              `🔍 **${found.length} match(es) for "${intent.query}":**\n\n${lines}`,
              found.slice(0, 2).map(p => `Analyze ${p.partNumber}`)
            );
          }
          break;
        }

        case 'ANALYZE': {
          const found = findPart(parts, intent.query);
          if (!found) {
            reply = mkMsg('assistant',
              `❌ **Part "${intent.query}" not found** in this context.\nThere are **${(parts || []).length}** part(s) here.`,
              (parts || []).length > 0
                ? ['List all parts', ...parts.slice(0, 2).map(p => `Analyze ${p.partNumber}`)]
                : ['List all parts', 'What is a part?']
            );
          } else {
            setMemory(m => ({ ...m, lastPart: found }));
            let bomText = '', wuText = '';
            try {
              const [bom, wu] = await Promise.all([plmApi.listBom(found.id), plmApi.getWhereUsed(found.id)]);
              bomText = bom?.length
                ? `\n\n**📦 BOM Children (${bom.length}):** ${bom.slice(0, 5).map(b => b.childPartNumber || b.childPart?.partNumber || 'Part').join(', ')}${bom.length > 5 ? ` +${bom.length - 5} more` : ''}`
                : '\n\n**📦 BOM:** No child components';
              wuText = wu?.length
                ? `\n**📎 Where Used (${wu.length}):** ${wu.map(p => p.partNumber).join(', ')}`
                : '\n**📎 Where Used:** Not referenced by any assembly';
            } catch (_) {
              bomText = '\n\n**📦 BOM:** Unable to fetch'; wuText = '';
            }
            const tip = found.lifecycleState === 'INWORK'
              ? `💡 INWORK — say **"Promote ${found.partNumber}"** to submit for approval.`
              : found.lifecycleState === 'UNDER_REVIEW'
                ? '💡 UNDER REVIEW — check Worklist to approve or reject.'
                : found.lifecycleState === 'RELEASED'
                  ? `💡 RELEASED — say **"Revise ${found.partNumber}"** to create a new revision.`
                  : '💡 OBSOLETE — this part has been retired.';

            reply = mkMsg('assistant',
              `${S[found.lifecycleState] || '📄'} **Part Analysis: ${found.partNumber}**\n\n` +
              `**Name:** ${found.name || '—'}\n` +
              `**Description:** ${found.description || '—'}\n` +
              `**Revision:** ${found.revision}  |  **Iteration:** ${found.iteration}\n` +
              `**State:** ${found.lifecycleState}\n` +
              `**Latest:** ${found.isLatest ? 'Yes' : 'No'}` +
              bomText + wuText + `\n\n${tip}`,
              [
                `Run impact on ${found.partNumber}`,
                found.lifecycleState === 'INWORK' ? `Promote ${found.partNumber}` : found.lifecycleState === 'RELEASED' ? `Revise ${found.partNumber}` : 'List all parts',
                `Where used ${found.partNumber}`,
              ],
              { _partId: found.id, _partNumber: found.partNumber }
            );
          }
          break;
        }

        case 'BOM_VIEW': {
          const found = findPart(parts, intent.query);
          if (!found) {
            reply = mkMsg('assistant', `❌ Part **"${intent.query}"** not found.`, ['List all parts']);
          } else {
            setMemory(m => ({ ...m, lastPart: found }));
            const bom = await plmApi.listBom(found.id);
            if (!bom?.length) {
              reply = mkMsg('assistant',
                `📦 **BOM of ${found.partNumber}**\n\nNo child components — this is a leaf component.`,
                [`Analyze ${found.partNumber}`, `Where used ${found.partNumber}`]
              );
            } else {
              const lines = bom.map((b, i) => `${i + 1}. **${b.childPartNumber || b.childPart?.partNumber || 'Part'}** — Qty: ${b.quantity || 1}`).join('\n');
              reply = mkMsg('assistant',
                `📦 **BOM of ${found.partNumber} (${bom.length} children):**\n\n${lines}`,
                [`Analyze ${found.partNumber}`, `Where used ${found.partNumber}`, `Run impact on ${found.partNumber}`]
              );
            }
          }
          break;
        }

        case 'WHERE_USED': {
          const found = findPart(parts, intent.query);
          if (!found) {
            reply = mkMsg('assistant', `❌ Part **"${intent.query}"** not found.`, ['List all parts']);
          } else {
            setMemory(m => ({ ...m, lastPart: found }));
            const wu = await plmApi.getWhereUsed(found.id);
            if (!wu?.length) {
              reply = mkMsg('assistant',
                `📎 **Where Used: ${found.partNumber}**\n\nNot referenced by any parent assembly. Safe to modify without upstream impact.`,
                [`Analyze ${found.partNumber}`, `Run impact on ${found.partNumber}`]
              );
            } else {
              const lines = wu.map(p => `• **${p.partNumber}** — ${p.name || '—'} | ${S[p.lifecycleState] || ''} *${p.lifecycleState}*`).join('\n');
              reply = mkMsg('assistant',
                `📎 **Where Used: ${found.partNumber} — ${wu.length} parent(s):**\n\n${lines}\n\n⚠️ Changing this part affects **${wu.length}** assembly(ies). Consider running impact analysis.`,
                [`Run impact on ${found.partNumber}`, `Analyze ${found.partNumber}`]
              );
            }
          }
          break;
        }

        case 'IMPACT': {
          const found = findPart(parts, intent.query);
          if (!found) {
            reply = mkMsg('assistant', `❌ Part **"${intent.query}"** not found.`, ['List all parts']);
          } else {
            setMemory(m => ({ ...m, lastPart: found }));
            const isAiDemoPage = location.pathname.includes('/ai-demo');
            if (onAction) {
              if (!isAiDemoPage) {
                sessionStorage.setItem('pendingAiAction', JSON.stringify({
                  action: 'RUN_IMPACT_ANALYSIS',
                  params: { part_number: found.partNumber, part_id: found.id, change_type: 'DESIGN_CHANGE' }
                }));
                navigate('/plm/ai-demo');
              }
              onAction('RUN_IMPACT_ANALYSIS', {
                part_number: found.partNumber,
                part_id: found.id,
                change_type: 'DESIGN_CHANGE'
              });
            }
            reply = mkMsg('assistant',
              `⚡ **Running AI Impact Analysis for ${found.partNumber}...**\n\n${isAiDemoPage ? 'Check the analysis panel above ↑' : 'Navigating to AI Demo and launching analysis...'}\n\nThe analysis shows:\n• Risk Score (0-10)\n• BOM Depth\n• Affected parent assemblies\n• Suggested actions`,
              [`Analyze ${found.partNumber}`, `Where used ${found.partNumber}`]
            );
          }
          break;
        }

        case 'PROMOTE': {
          const found = findPart(parts, intent.query);
          if (!found) {
            reply = mkMsg('assistant', `❌ Part **"${intent.query}"** not found.`, ['List all parts']);
          } else if (found.lifecycleState === 'RELEASED') {
            reply = mkMsg('assistant',
              `✅ **${found.partNumber}** is already RELEASED.\n\nSay **"Revise ${found.partNumber}"** to create a new revision.`,
              [`Revise ${found.partNumber}`, `Analyze ${found.partNumber}`]
            );
          } else if (found.lifecycleState === 'OBSOLETE') {
            reply = mkMsg('assistant', `🚫 **${found.partNumber}** is OBSOLETE and cannot be promoted.`, ['List all parts']);
          } else if (found.lifecycleState === 'UNDER_REVIEW') {
            reply = mkMsg('assistant',
              `🔍 **${found.partNumber}** is already UNDER REVIEW.\n\nCheck your Worklist to approve or reject it.`,
              ['Go to worklist', `Analyze ${found.partNumber}`]
            );
          } else {
            setMemory(m => ({ ...m, lastPart: found }));
            try {
              // ✅ FIX: call without target param — backend auto-promotes to next state
              await plmApi.promotePart(found.id);
              reply = mkMsg('assistant',
                `✅ **${found.partNumber}** promoted to **UNDER_REVIEW**!\n\nA work item has been created. Reviewers can now approve or reject it from the Worklist.`,
                ['Go to worklist', `Analyze ${found.partNumber}`]
              );
            } catch (err) {
              reply = mkMsg('assistant',
                `⚠️ Promote failed: ${err?.response?.data?.message || err.message}\n\nYou can promote manually from the part detail page.`,
                [`Analyze ${found.partNumber}`, 'Go to parts']
              );
            }
          }
          break;
        }

        case 'REVISE': {
          const found = findPart(parts, intent.query);
          if (!found) {
            reply = mkMsg('assistant', `❌ Part **"${intent.query}"** not found.`, ['List all parts']);
          } else if (found.lifecycleState !== 'RELEASED') {
            reply = mkMsg('assistant',
              `⚠️ **${found.partNumber}** cannot be revised. It must be **RELEASED** first.\n\nCurrent state: **${found.lifecycleState}**`,
              [`Analyze ${found.partNumber}`, found.lifecycleState === 'INWORK' ? `Promote ${found.partNumber}` : 'List all parts']
            );
          } else {
            setMemory(m => ({ ...m, lastPart: found }));
            try {
              const newPart = await plmApi.revisePart(found.id);
              reply = mkMsg('assistant',
                `✅ **New revision created for ${found.partNumber}!**\n\nNew part: **${newPart?.partNumber || found.partNumber + ' (new rev)'}** | State: INWORK\n\nYou can now edit the new revision independently.`,
                ['Go to parts', 'List all parts']
              );
            } catch (err) {
              reply = mkMsg('assistant',
                `⚠️ Revise failed: ${err?.response?.data?.message || err.message}\n\nYou can revise from the part detail page.`,
                [`Analyze ${found.partNumber}`, 'Go to parts']
              );
            }
          }
          break;
        }

        case 'WORKLIST': {
          try {
            const items = await plmApi.listMyWorkItems();
            if (!items?.length) {
              reply = mkMsg('assistant',
                `📋 **Your Worklist is empty.**\n\nNo pending approval tasks. You're all caught up! ✅`,
                ['Go to worklist', 'List all parts']
              );
            } else {
              const lines = items.slice(0, 8).map(w =>
                `• **${w.partNumber || w.subjectPartNumber || 'Work Item'}** [ID: ${w.id}] — ${w.action || w.type || 'Approval'}`
              ).join('\n');
              reply = mkMsg('assistant',
                `📋 **${items.length} pending work item(s):**\n\n${lines}\n\nSay **"Approve my first task"** or **"Reject task [ID]"** to act.`,
                ['Approve my first task', 'Go to worklist']
              );
            }
          } catch (_) {
            navigate('/plm/worklist');
            reply = mkMsg('assistant', `📋 Opening your Worklist...`, []);
          }
          break;
        }

        case 'APPROVE_TASK': {
          try {
            const items = await plmApi.listMyWorkItems();
            if (!items?.length) {
              reply = mkMsg('assistant', `📋 **Your Worklist is empty** — no tasks to approve.`, ['Go to worklist']);
            } else {
              const task = intent.id
                ? items.find(i => String(i.id) === String(intent.id)) || items[0]
                : items[0];
              await plmApi.approveWorkItem(task.id, 'Approved via PLM Assistant');
              reply = mkMsg('assistant',
                `✅ **Task approved!**\n\n**${task.partNumber || task.subjectPartNumber || 'Work Item'}** [ID: ${task.id}] has been approved.\n\nThe part will now move to the next lifecycle state.`,
                ['My Worklist', 'List all parts']
              );
            }
          } catch (err) {
            reply = mkMsg('assistant',
              `⚠️ Approval failed: ${err?.response?.data?.message || err.message}\n\nTry from the Worklist page directly.`,
              ['Go to worklist']
            );
          }
          break;
        }

        case 'REJECT_TASK': {
          try {
            const items = await plmApi.listMyWorkItems();
            if (!items?.length) {
              reply = mkMsg('assistant', `📋 **Your Worklist is empty** — no tasks to reject.`, ['Go to worklist']);
            } else {
              const task = intent.id
                ? items.find(i => String(i.id) === String(intent.id)) || items[0]
                : items[0];
              await plmApi.rejectWorkItem(task.id, 'Rejected via PLM Assistant');
              reply = mkMsg('assistant',
                `🔁 **Task rejected.**\n\n**${task.partNumber || task.subjectPartNumber || 'Work Item'}** [ID: ${task.id}] sent back to INWORK.`,
                ['My Worklist', 'List all parts']
              );
            }
          } catch (err) {
            reply = mkMsg('assistant',
              `⚠️ Reject failed: ${err?.response?.data?.message || err.message}\n\nTry from the Worklist page.`,
              ['Go to worklist']
            );
          }
          break;
        }

        case 'CHANGES': {
          try {
            const ecrs = await plmApi.listEcrs(null);
            const list = ecrs?.data || ecrs || [];
            if (!list.length) {
              reply = mkMsg('assistant',
                `📝 **No ECRs found.**\n\nNo Engineering Change Requests yet.`,
                ['What is an ECR?', 'Go to changes']
              );
            } else {
              const lines = list.slice(0, 6).map(e =>
                `• **${e.ecrNumber || e.id}** — ${e.title || e.reason || '—'} | **${e.status || '—'}**`
              ).join('\n');
              reply = mkMsg('assistant',
                `📝 **${list.length} Change Request(s):**\n\n${lines}`,
                ['Go to changes', 'What is an ECR?']
              );
            }
          } catch (_) {
            navigate('/plm/changes');
            reply = mkMsg('assistant', `📝 Opening Changes...`, []);
          }
          break;
        }

        default: {
          // Memory context: vague "it/this/that" references
          if (memory.lastPart && /\b(it|this|that|the part)\b/.test(q.toLowerCase())) {
            reply = mkMsg('assistant',
              `💬 I think you're asking about **${memory.lastPart.partNumber}**. What would you like to do?`,
              [
                `Analyze ${memory.lastPart.partNumber}`,
                `Run impact on ${memory.lastPart.partNumber}`,
                memory.lastPart.lifecycleState === 'INWORK' ? `Promote ${memory.lastPart.partNumber}` : `BOM of ${memory.lastPart.partNumber}`,
                `Where used ${memory.lastPart.partNumber}`,
              ]
            );
            break;
          }

          // Try backend
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
                context: { page: currentPage || location.pathname, selectedContextId, lastPart: memory.lastPart?.partNumber || null },
                sessionId: `web-${Date.now()}`,
              }),
            });
            if (res.ok) {
              const result = await res.json();
              const d = result.data || result;
              if (d?.text) { reply = mkMsg('assistant', d.text, d.suggestions || []); handled = true; }
            }
          } catch (_) {}

          if (!handled) {
            reply = mkMsg('assistant',
              `🤔 I didn't understand **"${q}"**.\n\nTry:\n• "Analyze [partNumber]" / "Search [keyword]"\n• "Promote [partNumber]" / "Run impact on [partNumber]"\n• "My Worklist" / "My changes"\n• "Explain BOM" / "Explain lifecycle"\n• Type **"Help"** for full command list`,
              selectedContextId
                ? ['List all parts', 'Count parts', 'My Worklist', 'Help']
                : ['Explain lifecycle', 'What is BOM?', 'Help']
            );
          }
        }
      }

      if (reply) push(reply);
      setMemory(m => ({ ...m, lastQuery: q, lastIntent: intent }));

    } catch (err) {
      push(mkMsg('assistant',
        `⚠️ **Error:** ${err.message || 'Something went wrong.'}\n\nMake sure the Spring Boot backend is running on port 8080.`,
        ['Status', 'Help']
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedContextId, currentPage, location.pathname, navigate, push, memory, onAction]);

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
      {!isOpen && (
        <button className="ai-chat-bubble" onClick={() => setIsOpen(true)} title="PLM Assistant">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="chat-bubble-badge">AI</span>
        </button>
      )}

      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <div className="ai-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <strong>PLM Assistant</strong>
                <small>
                  {selectedContextId ? '🟢 Live' : '🟡 No context'}
                  {memory.lastPart ? ` · ${memory.lastPart.partNumber}` : ''}
                </small>
              </div>
            </div>
            <button className="btn-close-chat" onClick={() => setIsOpen(false)} title="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

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

          <div className="ai-quick-chips">
            {quickChips.map((c, i) => (
              <button key={i} className="suggestion-chip suggestion-chip--quick" onClick={() => handleChip(c)}>{c}</button>
            ))}
          </div>

          <div className="ai-chat-input">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={memory.lastPart ? `Talking about ${memory.lastPart.partNumber}…` : 'Ask anything about your PLM data…'}
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
