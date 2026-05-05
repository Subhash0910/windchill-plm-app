# PLM Learning Workspace

Open-source, Windchill-inspired PLM software for learning enterprise product data workflows with embedded AI guidance.

This project is built to do three things well:

- help learners practice realistic PLM concepts without needing access to a client environment
- demonstrate domain depth in parts, BOM, documents, lifecycle, and engineering change workflows
- show how AI can support both training and decision support inside a PLM-style workspace

The product is intentionally inspired by enterprise Windchill-style information architecture, but it is positioned as an original learning platform. It is not affiliated with or endorsed by PTC.

## Why This Exists

Windchill is hard to learn unless you are already inside a project or organization that uses it. That leaves many engineers, students, and job seekers without a realistic environment to practice:

- part lifecycle and revision behavior
- BOM and where-used impact analysis
- folders, contexts, and team-based access
- ECR and ECO style change workflows
- auditability, notifications, and worklist actions

This workspace closes that gap with a public, explorable PLM environment and an AI layer that can both teach and assist.

## Current Product Direction

The current alpha direction is:

- learning platform first
- portfolio-quality AI + PLM showcase second
- open-source community project third

That means the app should feel coherent, enterprise-like, and instructive before it tries to be feature-complete.

## Product Pillars

### 1. Windchill-Inspired Workflow

The experience is designed around familiar PLM patterns:

- contexts for products, projects, and libraries
- managed parts and documents
- lifecycle states and promotion flows
- BOM and where-used navigation
- engineering change requests and orders
- worklist-driven approvals

### 2. AI Learning Copilot

The AI layer should help users understand:

- what a page or object represents
- why a lifecycle transition matters
- when to use an ECR, ECO, or promotion
- how BOM depth and where-used affect risk

### 3. AI Change Intelligence

The AI layer also supports operational workflows through:

- change impact analysis
- risk scoring
- explainable recommendations
- guided next actions

## Implemented Areas

The repo already contains a solid PLM foundation:

- React frontend with a persistent PLM shell and navigator
- Spring Boot multi-module backend
- contexts, folders, parts, BOM, and where-used
- documents, notifications, worklist, and audit
- ECR / ECO-oriented change flows
- AI chat and AI impact analysis surfaces
- Docker-based local deployment

## What Public Alpha Must Feel Like

Public alpha should be good enough that:

- a learner can sign in and complete a realistic PLM walkthrough
- a recruiter can understand the product in under five minutes
- a stakeholder can see AI applied in a domain-relevant way

That is why the current implementation work is focused on:

- codebase cleanup and architecture consolidation
- safer public positioning and legal-safe resemblance
- stronger onboarding and guided experience
- embedded AI instead of isolated demo-only AI
- cleaner docs, setup, and contribution paths

## Quick Start

### Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.9+
- Docker Desktop or a local MySQL + Redis setup

### Local Run with Docker

```bash
git clone https://github.com/Subhash0910/windchill-plm-app.git
cd windchill-plm-app
cp .env.example .env
docker-compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000).

### Local Run Without Docker

Backend:

```bash
cd windchill-backend
mvn clean package -pl backend-api -am
mvn spring-boot:run -pl backend-api
```

Frontend:

```bash
cd windchill-frontend
npm install
npm run build
```

For full setup details, see [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md).

## Repository Guide

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - active application architecture
- [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) - local, Docker, and hosted setup notes
- [ROADMAP.md](./ROADMAP.md) - public alpha roadmap
- [CONTRIBUTING.md](./CONTRIBUTING.md) - contribution workflow

## Important Notes

- This project is open source and public-facing. Do not add proprietary client logic, screenshots, or confidential workflow details.
- Keep the product clearly positioned as Windchill-inspired rather than a clone.
- The multi-module backend under `windchill-backend/backend-*` is the supported backend architecture.

## Disclaimer

Windchill is a registered trademark of PTC Inc. This project is an independent, educational, Windchill-inspired PLM learning workspace and is not affiliated with, endorsed by, or sponsored by PTC.
