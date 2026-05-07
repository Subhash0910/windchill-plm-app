# Windchill PLM — Open Source

An enterprise-grade, Windchill-inspired PLM platform built with Spring Boot, React, and FastAPI. Clone it, deploy it in one command, and experience the same workflows — parts, BOM, ECR/ECO, change orders, worklists, IBA attributes, and AI-assisted impact analysis — that engineers use in production Windchill environments.

Not affiliated with or endorsed by PTC. Built to close the gap for engineers, students, and teams who need a realistic PLM environment without a PTC license.

## Why This Exists

Windchill is hard to access unless you are inside a project or company that licenses it. That leaves engineers, students, and job seekers without a realistic environment to practice:

- part lifecycle and revision behavior
- BOM and where-used impact analysis
- folders, contexts, and team-based access
- ECR and ECO change workflows
- auditability, notifications, and worklist actions

This project closes that gap with a fully deployable PLM environment and an AI layer for impact analysis and risk scoring.

## What Is Implemented

### PLM Core
- Parts with lifecycle states (INWORK → UNDERREVIEW → RELEASED → OBSOLETE), revisions, iterations
- BOM tree with multi-level expand, child part enrichment, and where-used
- IBA (Instance-Based Attributes) — Windchill-style soft attributes per part version
- Part substitutes and alternates with rank ordering
- Documents (WTDocument) with part associations
- Products, Projects, Library contexts

### Change Management
- Engineering Change Requests (ECR) with approver workflow
- Change Orders (ECO) with affected parts, change notices (ECN)
- Change Tasks with assignee and status tracking

### Worklist and Audit
- Worklist driven by work item assignments
- Notification center with unread badge
- Full audit log

### Action Model Registry (Customization)
- Database-driven action registry replacing Windchill's `site_actionmodels.xml`
- Dynamic toolbar loaded from registry — PRIMARY / SECONDARY / OVERFLOW sections
- Per-action: object type, processor class + method, HTTP endpoint, role gate, lifecycle state gate
- One-click XML export in Windchill `site_actionmodels.xml` format
- Full admin UI at `/plm/admin/actions` — register, edit, toggle, preview XML

### AI Layer
- Random Forest risk model (FastAPI + scikit-learn) scoring ECR impact
- AI impact analysis surface on Part Detail and Changes pages
- NLP-based search

### Infrastructure
- Spring Boot 3.2 multi-module Maven (`backend-common`, `backend-domain`, `backend-repository`, `backend-service`, `backend-api`)
- Flyway migrations for production, H2 demo mode for Render free tier
- JWT stateless auth with role-based access (VIEWER / ENGINEER / MANAGER / ADMIN)
- Docker Compose: 4 containers (Spring Boot, MySQL 8, Redis 7, FastAPI ML)
- Vercel frontend deployment + Render backend deployment (render.yaml included)

## Quick Start

```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app
cp .env.example .env          # Windows: copy .env.example .env
docker-compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000) — login with `admin` / `admin123`.

See [QUICK_START.md](./QUICK_START.md) for manual setup and troubleshooting.

## Repository Guide

| File / Folder | Purpose |
|---|---|
| `windchill-backend/` | Spring Boot 5-module Maven backend |
| `windchill-frontend/` | React + Vite frontend (Atomic Design) |
| `ml-service/` | FastAPI risk model + AI assistant |
| `docker-compose.yml` | Full local stack |
| `render.yaml` | Render.com deployment config |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Docker, Vercel + Railway, HTTPS, security checklist |
| [QUICK_START.md](./QUICK_START.md) | 3-command clone-to-running guide |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Backend module and frontend layer map |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [ROADMAP.md](./ROADMAP.md) | Planned features |

## Important Notes

- This project is open source and public-facing. Do not add proprietary PTC logic, screenshots, or confidential workflow details.
- Keep the product clearly positioned as Windchill-inspired rather than a clone.
- The multi-module backend under `windchill-backend/backend-*` is the supported architecture — do not call repositories from controllers.

## Disclaimer

Windchill is a registered trademark of PTC Inc. This project is an independent, open-source PLM platform inspired by Windchill's information architecture. It is not affiliated with, endorsed by, or sponsored by PTC.
