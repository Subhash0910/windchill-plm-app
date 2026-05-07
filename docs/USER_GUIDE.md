# User Guide — PLM Learning Workspace

This guide is for anyone who just logged in and wants to understand what the platform does and how to use it. No PLM background required.

---

## What Am I Looking At?

You're inside a simulated **Product Lifecycle Management (PLM)** system. PLM software is what manufacturing companies use to track:

- Every **part** that goes into a product (screws, circuit boards, fuselage panels — anything)
- The **BOM (Bill of Materials)** — a structured list of all parts in an assembly and how they relate
- **Change Management** — the formal process of proposing, approving, and executing changes to parts or assemblies
- **Documents** — specifications, CAD drawings, test reports attached to parts
- **Team workflows** — who approved what, when, and why

Real-world PLM systems (Windchill, Teamcenter, Enovia) cost tens of thousands per seat. This workspace gives you a free, full-featured simulation.

---

## Interface Overview

```
┌──────────────────────────────────────────────────────┐
│  W  PLM Learning Workspace  [Search ⌘K]  🔔 ? 🌙  A │  ← Header
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │  Main Content Area                        │
│          │                                           │
│ [Parts]  │  Parts table, BOM tree, ECR detail,       │
│ [Changes]│  document viewer, worklist, etc.          │
│ [Docs]   │                                           │
│ [Worklist│                                           │
│          │                                     [AI] │
└──────────┴───────────────────────────────────────────┘
```

| Area | What it does |
|---|---|
| **Header** | Search, notifications, dark/light toggle, profile, and the `?` tour button |
| **Sidebar** | Navigate between all PLM modules |
| **Main area** | The current page (parts table, detail views, change forms, etc.) |
| **AI button** | Floating bottom-right — your PLM AI assistant |

---

## Navigation

The sidebar is organized into functional areas:

| Sidebar section | What you'll find |
|---|---|
| **Parts & BOM** | All parts in the system, BOM trees, part detail pages, IBA attributes |
| **Change Management** | ECRs, Change Orders, Change Notices, Change Tasks |
| **Documents** | WTDocuments with lifecycle and part links |
| **Worklist** | Your pending actions — approvals, reviews, task completions |
| **Notifications** | System alerts and workflow notifications |
| **Library / Products / Projects** | Windchill-style context containers |
| **Admin** | User management, customization tools (ADMIN role only) |

---

## Core Workflows

### 1. Exploring Parts

1. Go to **Parts** in the sidebar
2. The table shows all parts with their lifecycle state, revision, and number
3. Click any part to open its **detail page**
4. On the detail page you can see:
   - **BOM tab** — all child parts in a tree
   - **Where Used** — which assemblies contain this part
   - **Attributes (IBA)** — custom attributes on this version
   - **Documents** — attached specs and drawings
   - **Lifecycle** — current state with available state transitions

### 2. The Change Management Loop

This is the heart of PLM. Here's how a change works:

```
Engineer notices a problem / improvement
         ↓
   Create an ECR (Engineering Change Request)
   - Describe the change
   - Attach affected parts
   - Assign approvers
         ↓
   Approvers review in their Worklist
   - Approve or reject
         ↓
   ECR approved → Promote to ECO (Change Order)
   - Affected parts get new revisions
   - BOM updates tracked
         ↓
   ECN (Change Notice) generated
   - Notifies stakeholders of the completed change
```

**Try it:**
1. Go to **Changes** → **New ECR**
2. Fill in the title and description
3. Add an affected part
4. Submit it
5. Go to your **Worklist** — you'll see the approval task
6. Approve it from the worklist
7. The ECR state advances and you can promote it to an ECO

### 3. Documents

1. Go to **Documents** in the sidebar
2. Create a new document with a title and lifecycle state
3. Link it to a part on the part's detail page
4. Documents follow the same lifecycle model as parts (INWORK → RELEASED)

### 4. Worklist

Your Worklist is like your PLM inbox. Whenever someone assigns you an approval, review, or action item, it lands here.

- Click a work item to open the related object
- Use the action buttons to approve, reject, or complete
- Completed items move out of your worklist

---

## Search

Press **⌘K** (Mac) or **Ctrl+K** (Windows) from anywhere to open global search. You can search:
- Part numbers and names
- Document titles
- ECR/ECO numbers

---

## AI Assistant

Click the floating button in the bottom-right corner. You can ask it:

- "Find part PN-001"
- "Run impact analysis on ECR-0042"
- "What is a BOM?"
- "What lifecycle state should I use for a released part?"
- "Show me all change orders from last month"

The assistant understands PLM context and can navigate the app on your behalf for some actions.

---

## Roles and Permissions

| Role | What they can do |
|---|---|
| **VIEWER** | Read-only — view parts, documents, changes |
| **ENGINEER** | Create and edit parts, documents, change requests |
| **MANAGER** | Approve change requests, manage team assignments |
| **ADMIN** | All of the above + user management + system customization |

The default `admin` / `admin123` login has the ADMIN role.

---

## Lifecycle States

All PLM objects (parts, documents, ECRs) follow a lifecycle:

```
INWORK → UNDERREVIEW → RELEASED → OBSOLETE
```

| State | Meaning |
|---|---|
| **INWORK** | Being actively edited. Not yet ready for review. |
| **UNDERREVIEW** | Submitted for approval. Cannot be edited. |
| **RELEASED** | Approved and locked. This is the "build from" state. |
| **OBSOLETE** | Retired. Still visible for history but no longer active. |

A change order is required to modify a RELEASED part — you can't just edit it directly. That's the control that makes PLM valuable.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `⌘K` | Open global search |
| `Esc` | Close modals, dismiss search, skip tour |

---

## Getting Lost?

- Click the **?** button in the header to replay the onboarding tour
- Ask the **AI assistant** any question
- Visit **Admin → System** (`/plm/admin/system`) for PLM reference documentation
