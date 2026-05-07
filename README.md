# Open PLM Workspace

> A free, open-source PLM learning platform inspired by Windchill — built so engineers, students, and job-seekers can experience real PLM workflows before entering (or evaluating) an enterprise environment.

> **Disclaimer:** Windchill is a registered trademark of PTC Inc. This project is independent, non-commercial, and not affiliated with or endorsed by PTC.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

## What Is PLM?

Product Lifecycle Management (PLM) is the software discipline that manufacturers use to manage a product from concept through production and retirement. It tracks every **part**, every **revision**, every **change approval**, and every **document** associated with a product — ensuring teams never build from the wrong version.

If you've heard of Windchill, Teamcenter, Enovia, or Aras — this is that category. Enterprise PLM systems typically cost tens of thousands of dollars per seat and require dedicated infrastructure to run. This project gives you a full, deployable simulation for free.

---

## Why This Exists

Windchill is hard to access unless you're inside a company that licenses it. That leaves engineers, students, and job-seekers without a realistic environment to practice:

- part lifecycle and revision behavior
- BOM structure and where-used impact analysis
- folders, contexts, and team-based access control
- ECR and ECO change workflows end-to-end
- auditability, notifications, and worklist-driven approvals

This project closes that gap with a fully deployable PLM environment and an AI layer for impact analysis and risk scoring.

---

## What Is Implemented

### PLM Core
| Feature | What it does |
|---|---|
| **Parts & Lifecycle** | Parts with lifecycle states (INWORK → UNDERREVIEW → RELEASED → OBSOLETE), revisions (A, B, C…), and iterations |
| **BOM** | Multi-level bill of materials, child part enrichment, where-used query |
| **IBA Attributes** | Windchill-style soft attributes per part version (Instance-Based Attributes) |
| **Part Substitutes** | Alternate and substitute parts with rank ordering |
| **Documents** | WTDocument with lifecycle, part associations, and file attachments |
| **Products / Projects / Library** | Windchill-style context containers |

### Change Management
| Feature | What it does |
|---|---|
| **ECR** | Engineering Change Request — propose a change, attach affected parts, route for multi-approver sign-off |
| **ECO** | Change Order — promoted from an approved ECR, updates the BOM |
| **ECN** | Change Notice — notification artifact generated when a change order is executed |
| **Change Tasks** | Individual task assignments within a change order |

### Worklist & Collaboration
- Worklist driven by work-item assignments (approve, review, complete)
- Notification center with unread badge and bell indicator
- Full audit log with user, action, and timestamp
- Team management and role-based access (VIEWER / ENGINEER / MANAGER / ADMIN)

### Customization Layer
| Feature | Admin route |
|---|---|
| **Action Model Registry** | `/plm/admin/actions` — database-driven toolbar replacing Windchill's `site_actionmodels.xml` |
| **Lifecycle Designer** | `/plm/admin/lifecycle` — visual lifecycle state and transition editor |
| **Type Registry** | `/plm/admin/types` — register custom object types with metadata |
| **System Reference** | `/plm/admin/system` — Windchill terminology, concepts, and platform info |

See [docs/CUSTOMIZATION_GUIDE.md](./docs/CUSTOMIZATION_GUIDE.md) for the full customization walkthrough.

### AI Layer
- Random Forest risk model (FastAPI + scikit-learn) scoring ECR impact from 0–100
- AI impact analysis surface on Part Detail and Changes pages
- PLM-aware chat assistant — ask it to find parts, run impact analysis, or explain any PLM concept
- NLP-based search integration

### Infrastructure
- Spring Boot 3.2 multi-module Maven (`backend-common`, `backend-domain`, `backend-repository`, `backend-service`, `backend-api`)
- Flyway migrations for production; H2 demo mode for Render free tier
- JWT stateless auth with role-based access
- Docker Compose: 4 containers (Spring Boot, MySQL 8, Redis 7, FastAPI ML)
- Vercel (frontend) + Render (backend) deployment configs included

---

## Quick Start (Developer)

```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app
cp .env.example .env          # Windows: copy .env.example .env
docker-compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000) — login with `admin` / `admin123`.

See [QUICK_START.md](./QUICK_START.md) for manual setup and troubleshooting.

---

## Quick Start (Learner — I just want to explore)

1. **Log in** with `admin` / `admin123`
2. An **onboarding tour** will launch automatically on your first visit — follow it to learn the layout
3. **Try the full change loop:**
   - Create a Part at `/plm/parts`
   - Submit an ECR (Engineering Change Request) at `/plm/changes`
   - Approve it in your Worklist at `/plm/worklist`
   - Promote it to a Change Order
4. **Ask the AI assistant** (floating button, bottom-right) any PLM question

See [docs/USER_GUIDE.md](./docs/USER_GUIDE.md) for a full guided walkthrough.

---

## Repository Structure

| Path | Purpose |
|---|---|
| `windchill-backend/` | Spring Boot 5-module Maven backend |
| `windchill-frontend/` | React + Vite frontend (Atomic Design) |
| `ml-service/` | FastAPI risk model + AI assistant |
| `docker-compose.yml` | Full local stack (4 containers) |
| `render.yaml` | Render.com backend deployment config |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Docker, Vercel + Render, HTTPS, security checklist |
| [QUICK_START.md](./QUICK_START.md) | 3-command clone-to-running guide |
| [docs/USER_GUIDE.md](./docs/USER_GUIDE.md) | Guided walkthrough for learners |
| [docs/CUSTOMIZATION_GUIDE.md](./docs/CUSTOMIZATION_GUIDE.md) | How to customize actions, lifecycles, and types |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Backend module and frontend layer map |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [ROADMAP.md](./ROADMAP.md) | Planned features |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Pull requests are welcome — please keep the project positioned as a **learning platform**, not a Windchill clone, and do not include any proprietary PTC assets.

---

## License

[MIT](./LICENSE) — free to use, modify, and deploy.

---

## Disclaimer

Windchill is a registered trademark of PTC Inc. This is an independent, non-commercial, open-source project inspired by Windchill's information architecture. It is not affiliated with, endorsed by, or sponsored by PTC in any way. No PTC source code or proprietary assets are used.
