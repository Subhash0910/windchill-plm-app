# Architecture

## Active Stack

- Frontend: React + Vite
- Backend: Spring Boot 3.2, Java 17, multi-module Maven
- Data: MySQL + Redis
- Delivery: Docker Compose for local and hosted demo environments

## Supported Backend Structure

The supported backend architecture is the multi-module structure under `windchill-backend`:

- `backend-common`
- `backend-domain`
- `backend-repository`
- `backend-service`
- `backend-api`

Layering should remain:

- controllers handle transport and HTTP concerns
- services own business rules and workflow logic
- repositories own persistence
- domain/common define reusable models and enums

## Frontend Structure

The frontend is organized around:

- an application shell
- route-driven page containers
- shared PLM components
- a centralized API layer
- context/auth state providers

The main runtime route tree is owned by `src/routing/AppRoutes.jsx`. Stale route configs should not be treated as active architecture.

## Core Domain Model

### Contexts

- Product
- Project
- Library

### Managed Objects

- Part
- Document

### Workflow / Change Objects

- Promotion Request
- Work Item
- ECR
- ECO / Change Order

### Supporting Objects

- Folder
- Context Member
- Notification
- Audit Record

## UX Architecture

The application should feel like an enterprise PLM workspace:

- persistent top utility bar
- left navigator and context switcher
- folder browsing where relevant
- object-centric detail pages
- history, related objects, attachments, lifecycle, and actions kept close together

## AI Architecture

AI is treated as two complementary product modes:

- Learning Copilot: explains PLM concepts, pages, and next actions
- Process Intelligence: performs impact and risk analysis tied to real objects and workflows

The long-term goal is to keep AI embedded in normal product flows rather than isolating it as a standalone demo page.
