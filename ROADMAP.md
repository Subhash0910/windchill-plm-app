# Public Alpha Roadmap

## Goal

Ship a public alpha that feels like a serious, explorable PLM learning workspace with embedded AI.

## Phase 1: Cleanup and Positioning

- clean root-level repo clutter and duplicate legacy structures
- standardize backend and frontend architecture around the active code paths
- rewrite public docs, setup instructions, and product messaging
- move config to safer environment-driven defaults

## Phase 2: UX Coherence

- unify dashboard, shell, navigation, and object page patterns
- standardize object headers, tabs, tables, status badges, and action areas
- improve onboarding for learners, recruiters, and internal stakeholders

## Phase 3: Core PLM Journeys

- parts and lifecycle
- documents and revision visibility
- BOM and where-used
- ECR submission, review, and ECO progression
- notifications, audit, and worklist actions

## Phase 4: AI Differentiation

- ✅ learning copilot for page-aware explanations and guided flows
- ✅ process intelligence for impact, risk, and recommended next actions
- ✅ conflict detection — active ECR cross-referencing in AIImpactService + GraphAnalysisService
- ✅ compliance checking — lifecycle rules engine (OBSOLETE on RELEASED, ECN cascade)
- ✅ explainable AI responses embedded in real workflows (ImpactPreview wired into PartDetailPage)
- ✅ ML service containerized and wired into docker-compose
- [ ] Agentic Change Assistant — LangChain4j + Ollama + Neo4j loop
- [ ] LLM-powered impact explanations (Ollama llama3.2)

## Phase 5: Public Alpha Readiness

- stable seed data
- clean hosted demo
- ✅ CI for backend build/test (JaCoCo 70% gate), frontend build, ML pytest
- ✅ Docker build job for all 3 images (backend, frontend, ml-service)
- screenshots, contribution docs, issue templates, and roadmap transparency
