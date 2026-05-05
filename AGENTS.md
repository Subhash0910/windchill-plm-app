# AGENTS.md

## Project Identity

This repository is an **open-source, Windchill-inspired PLM learning workspace with AI**.

Primary goals:

- help learners understand enterprise PLM workflows
- showcase strong PLM + AI product thinking
- provide a public portfolio-quality implementation

This project is **not** positioned as a literal Windchill clone. Keep the workflow feel and information architecture strong, but avoid copied branding, assets, or pixel-identical imitation.

## Product Direction

When making changes, optimize for this order of priorities:

1. learning value
2. coherent enterprise-style UX
3. AI embedded in real workflows
4. public-demo quality and recruiter readability
5. open-source maintainability

If a change improves resemblance but hurts clarity, maintainability, or legal safety, do not take it.

## Architecture Truth

### Backend

The supported backend architecture is the multi-module Spring Boot project under `windchill-backend`:

- `backend-common`
- `backend-domain`
- `backend-repository`
- `backend-service`
- `backend-api`

Expected layering:

- controllers handle HTTP transport only
- services own workflow and business logic
- repositories own persistence
- domain/common hold shared models, enums, and reusable types

Do not reintroduce duplicate backend trees or parallel architectures.

### Frontend

The active frontend app lives under `windchill-frontend/src`.

Important structure:

- routing is owned by `src/routing/AppRoutes.jsx`
- shared PLM UI lives in `src/components/plm`
- page containers live under `src/pages`
- API access should go through shared service modules, not ad hoc fetch logic

Do not add stale alternate route configs or duplicate service layers.

## Core Domain Areas

The main product surface is organized around:

- contexts: Product, Project, Library
- managed objects: Part, Document
- workflow/change objects: ECR, ECO / Change Order, Promotion Request, Work Item
- support objects: Folder, Team Member, Notification, Audit Record

When adding features, fit them into this object model instead of introducing disconnected concepts.

## AI Guidance

AI in this repo has two intended modes:

- `learning_assist`: explain PLM concepts, page purpose, workflow meaning, and next steps
- `process_insight`: analyze impact, risk, scope, and recommended actions

AI should feel embedded in the workflow. Prefer tying AI to parts, changes, worklist, lifecycle, BOM, and where-used rather than building isolated demo-only experiences.

All AI output should be:

- explainable
- advisory, not absolute
- domain-aware
- useful to both learners and reviewers

## UX Guidance

The UI should feel like a coherent PLM system, not a collection of unrelated pages.

Preserve and strengthen:

- persistent shell
- navigator and context switching
- object-first detail pages
- breadcrumbs
- lifecycle visibility
- related objects, audit, attachments, and workflow actions close to the object they belong to

Keep the product visually distinct from PTC branding even when the workflow feel is familiar.

## Docs and Positioning Rules

Public messaging should consistently describe the project as:

- Windchill-inspired
- learning-focused
- AI-enhanced
- open source

Avoid wording like:

- "open-source Windchill"
- "Windchill clone"
- anything implying affiliation with PTC

Do not add proprietary client details, internal screenshots, or confidential workflow knowledge from employer projects.

## Config and Security Rules

- Prefer environment-driven config for secrets and deployment-sensitive values.
- Never hardcode production credentials or real secrets.
- Keep `.env.example` safe for public git history.
- Production-sensitive endpoints and tooling should stay locked down by default.

## Quality Expectations

Before closing meaningful changes:

- run backend validation when backend code changes
- run frontend build when frontend code changes
- update docs when architecture, setup, or positioning changes

If you discover pre-existing failures, call them out clearly instead of silently ignoring them.

## Current Cleanup Baseline

This repo is in the middle of being cleaned into a public-alpha shape.

That means agents should prefer:

- consolidating duplicate logic
- removing stale structures after verifying they are unused
- unifying contracts and naming
- improving onboarding and product story

And should avoid:

- adding new parallel abstractions
- reviving deleted legacy trees
- introducing demo-only shortcuts that weaken the public-alpha direction
