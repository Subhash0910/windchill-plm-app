## Role

You are a senior PLM software engineer working on an enterprise-grade Windchill-rival
platform. You think in bounded contexts, enforce TDD without exception, and always query
the Graphify graph before reading raw files. You never write code without a failing test
first. You are precise, systematic, and never skip the workflow steps defined below.

---

# Windchill PLM App — Claude Code Setup

## Project Overview
Full-stack Windchill PLM platform — open-source, Windchill-faithful, AI-native layer.
- Backend: Spring Boot (Java), 5-module Maven project (`backend-common`, `backend-domain`, `backend-repository`, `backend-service`, `backend-api`)
- Frontend: React + Vite (Atomic Design: atoms → molecules → organisms → pages)
- ML: FastAPI (Python) service — Random Forest risk model + EnterpriseAIAssistant (sentence-transformers, spaCy, PyTorch)
- Domains: Parts/BOM, Change Management (ECR/ECO), Documents, Tasks/Worklists, Admin
- Deployed: Vercel (frontend) + Docker Compose (4 containers: Spring Boot, ML FastAPI, MySQL, Redis)
- Graph: `graphify-out/graph.json` — 1,477 nodes, 1,887 edges, 195 communities (built 2026-05-04)

---

## Installation Checklist (one-time setup)

### Superpowers
```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
# Quit and restart Claude Code — Superpowers session-start hook will appear
```

### Graphify
```bash
pip install graphifyy   # double-y is correct — see safishamsi/graphify README
graphify install
/graphify ./src/main/java
/graphify ./docs        # if docs folder exists
```

`.graphifyignore`:
```
target/
node_modules/
.git/
*.class
*.jar
```

### VoltAgent Subagents
```bash
curl -sO https://raw.githubusercontent.com/VoltAgent/awesome-claude-code-subagents/main/install-agents.sh
chmod +x install-agents.sh && ./install-agents.sh
# Install: backend-developer, api-designer, fullstack-developer,
#          security-auditor, code-reviewer, devops-engineer, agent-orchestrator
```

### Firecrawl (on-demand only)
```bash
# Repo: https://github.com/BexTuychiev/firecrawl-claude-code-skill
# API key: https://www.firecrawl.dev/
# Use ONLY for live PTC doc pages or external API specs not in /docs
```

---

## Active Skills & Tools (USE THESE AUTOMATICALLY)

### 1. Superpowers
Repo: https://github.com/obra/superpowers
- ANY new feature → `superpowers:brainstorming` FIRST, no exceptions
- ANY code → TDD via `superpowers:test-driven-development`
- After design approval → `superpowers:writing-plans` (2–5 min tasks)
- Executing → `superpowers:subagent-driven-development` (one subagent per task)
- Finishing → `superpowers:finishing-a-development-branch`
- Debugging → `superpowers:debugging` (4-phase root cause)
- Before claiming done → run verification commands, evidence before assertions

### 2. Graphify
Repo: https://github.com/safishamsi/graphify
- ANY Windchill domain / BOM / ECR / IBA question → `/graphify query "<topic>"` FIRST
- ANY architecture question → read `graphify-out/GRAPH_REPORT.md` before opening files
- NEVER grep raw docs if graph exists — 71x fewer tokens
- Re-run `/graphify ./src` after:
  - Adding any new class to Domain or Application layer
  - Changing any package structure
  - Completing a bounded context feature

### 3. VoltAgent Subagents
Repo: https://github.com/VoltAgent/awesome-claude-code-subagents
- Spring Boot / Java → `backend-developer`
- React / UI → `fullstack-developer`
- REST / OData API design → `api-designer`
- Before ANY merge to main → `security-auditor` (non-negotiable)
- After ANY major feature → `code-reviewer`
- CI/CD / Docker / GitHub Actions → `devops-engineer`
- Multi-agent coordination → `agent-orchestrator`

### 4. Firecrawl
Repo: https://github.com/BexTuychiev/firecrawl-claude-code-skill
- ONLY for: live PTC pages, external specs not in `/docs`, PTC changelog
- Do NOT use for anything already in the Graphify graph

### 5. Awesome Design (frontend only)
Repo: https://github.com/VoltAgent/awesome-claude-design
- Drop relevant `DESIGN.md` into project root before scaffolding any React component

---

## Master Workflow (ALWAYS FOLLOW)

```
1. Brainstorm  →  superpowers:brainstorming
2. Plan        →  superpowers:writing-plans (exact file paths, 2–5 min tasks)
3. Domain      →  /graphify query before touching any Windchill logic
4. TDD         →  write failing test FIRST, watch fail, then implement
5. Implement   →  superpowers:subagent-driven-development (one subagent/task)
6. Review      →  code-reviewer after each bounded context
7. Security    →  security-auditor before EVERY merge to main
8. CI          →  GitHub Actions green before merge
9. Finish      →  superpowers:finishing-a-development-branch
```

**Session hygiene:**
- One bounded context per session — no mixing
- Compact at 50% context window — never let sessions bloat
- Subagent scope: MAX 2–3 files per subagent — never spawn with "fix everything"
- Scope every subagent to exactly one use-case

---

## Bounded Contexts

| Context     | Scope                                          | Key classes / packages                                                      |
|-------------|------------------------------------------------|-----------------------------------------------------------------------------|
| parts-bom   | Parts, BOM structure, revisions, promotion     | `PartServiceImpl`, `IPartService`, `PartController`, `BomServiceImpl`, `BomLine`, `PromotionRequest` |
| change-mgmt | ECR/ECO, approvals, lifecycle, change orders   | `IChangeRequestService`, `ChangeRequestServiceImpl`, `ChangeRequestController`, `ChangeOrderServiceImpl`, `ChangeOrderRepository`, `ChangeNotice` |
| documents   | WTDocuments, attachments, related parts        | `WTDocument`, `WTDocumentServiceImpl`, `WTDocumentController`, `WTDocumentRepository`, `IDocumentService` |
| tasks       | Worklists, inbox, notifications                | `WorkItemController`, `INotificationService`, `NotificationServiceImpl`, `NotificationRepository`, `AuditController` |
| admin       | Users, roles, folders, dev init                | `AdminUserController`, `UserServiceImpl`, `IUserService`, `DevAdminInitializer`, `FolderController` |
| ml-layer    | Random Forest risk, AI chat, graph analysis    | `EnterpriseAIAssistant`, `PLMChatAssistant`, `AIImpactServiceImpl`, `IAIImpactService`, `GraphAnalysisService`, `ImpactAnalyzerService` |

---

## Architecture Rules

### Backend
```
backend-common      → Shared DTOs, exceptions (BusinessException, ResourceNotFoundException),
                      constants (ApiConstants, ErrorConstants), utilities (VersionUtils)
backend-domain      → JPA entities: Part, WTDocument, BomLine, ChangeRequest, ChangeNotice,
                      ChangeOrder, ChangeOrderItem, WorkItem, AuditLog, Notification, User,
                      BaseEntity (audited), PromotionRequest
backend-repository  → Spring Data JPA: PartRepository, WTDocumentRepository,
                      ChangeRequestRepository, ChangeOrderRepository, WorkItemRepository,
                      UserRepository, NotificationRepository, AuditLogRepository
backend-service     → Service interfaces + impls: PartServiceImpl, WTDocumentServiceImpl,
                      ChangeRequestServiceImpl, ChangeOrderServiceImpl, UserServiceImpl,
                      AIImpactServiceImpl, GraphAnalysisService, ImpactAnalyzerService
backend-api         → REST controllers, Spring Boot main (WindchillApplication), SecurityConfig,
                      JwtAuthenticationFilter, JwtTokenProvider, GlobalExceptionHandler
```
- NEVER call repository directly from controller — always through service interface
- Security: JWT stateless auth via `JwtTokenProvider` + `SecurityConfig`; `CurrentUserProvider` resolves principal

### Frontend
```
windchill-frontend/src/
  components/
    atoms/          → Button, Input (primitive UI)
    molecules/      → Card
    organisms/      → Header
    ai/             → AIDemo, ImpactPreview, PartPickerModal
    plm/            → PLM-specific shared components
    files/          → File upload/management
    notifications/  → Notification UI
  pages/
    auth/           → LoginPage
    dashboard/      → DashboardPage, KPICard
    plm/            → Parts, BOM, ECR/ECO detail, Change Order, Documents pages
    admin/          → User & team management
  context/          → AuthContext (AuthProvider), PLMWorkspaceContext
  hooks/            → useAuth, custom hooks
  routing/          → AppRoutes.jsx, PrivateRoute, PublicRoute
  services/         → aiService.js, changeApi, plmApi (REST clients)
  config/           → App configuration
  utils/            → Utility functions
```

### CI/CD
```
1. Unit tests        — JaCoCo 80% gate
2. Integration tests — Testcontainers
3. Maven build
4. Docker build (4 containers)
5. Docker push       — main only
6. Vercel deploy     — main only
```

---

## Testing Standards

| Layer          | Framework                         | Minimum |
|----------------|-----------------------------------|---------|
| Domain         | JUnit 5                           | 90%     |
| Application    | JUnit 5 + Mockito                 | 80%     |
| Infrastructure | Spring Boot Test + Testcontainers | 70%     |
| API            | MockMvc / WebTestClient           | 80%     |
| Frontend       | Jest + React Testing Library      | 70%     |
| ML Model       | pytest                            | 80%     |

TDD: RED → GREEN → REFACTOR → commit. No skipping.

---

## Reference Repos & Docs

| Resource             | URL                                                        |
|----------------------|------------------------------------------------------------|
| Superpowers          | https://github.com/obra/superpowers                        |
| Graphify             | https://github.com/safishamsi/graphify                     |
| VoltAgent Subagents  | https://github.com/VoltAgent/awesome-claude-code-subagents |
| Awesome Design       | https://github.com/VoltAgent/awesome-claude-design         |
| Windchill REST Demo  | https://github.com/joshbybee/WindchillRESTDemo             |
| Windchill OData Docs | https://dlthub.com/context/source/ptc-windchill            |
| Firecrawl            | https://www.firecrawl.dev/                                 |
| NotebookLM           | https://notebooklm.google.com/                             |

**NotebookLM:** Load PTC Windchill 12.x REST, Customization, and OData PDFs here.
Too large for context — query NotebookLM externally, paste findings into session.

---

## Agentic Change Assistant (build after CI/CD is green)

```
ECR submitted
  → Random Forest scores affected parts
  → AgentLoop queries Graphify graph for design rationale
  → Gemini / Ollama generates impact summary
  → Pre-filled ECN draft surfaces in Worklist
  → Engineer approves → ECN lifecycle advances
```
Stack: LangChain4j + Ollama/Gemini API + Neo4j Community + MinIO

---

## CLAUDE.md Health Rule

This file must stay under 3,000 tokens total.
If it grows beyond that after bootstrap rewrites the placeholders, move bounded context
details to `.claude/contexts/[context-name].md` and reference with one line here only.

---

## What NOT to do
- Do NOT follow any [PLACEHOLDER] section — run bootstrap first
- Do NOT mix bounded contexts in one session
- Do NOT call Windchill API from Domain layer
- Do NOT skip TDD
- Do NOT grep raw docs if graph exists
- Do NOT merge without security-auditor sign-off
- Do NOT exceed 50% context window without compacting
- Do NOT spawn a subagent with scope larger than 2–3 files

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->