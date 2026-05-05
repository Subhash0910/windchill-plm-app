# Contributing

Thanks for helping improve the PLM Learning Workspace.

## Before You Start

- keep the product positioned as a Windchill-inspired learning platform
- avoid copying proprietary screenshots, language, assets, or internal-only workflow details
- prefer changes that improve coherence, learning value, and explainability

## Local Setup

1. Copy `.env.example` to `.env`.
2. Start dependencies with Docker Compose or run MySQL and Redis locally.
3. Run the backend from `windchill-backend/backend-api`.
4. Run the frontend from `windchill-frontend`.

## Contribution Priorities

- product clarity and onboarding
- PLM workflow realism
- AI learning experience
- architecture cleanup and consistency
- tests and developer experience

## Pull Request Guidelines

- explain the user-facing problem and the change made
- mention affected workflow areas such as parts, documents, changes, AI, or navigation
- include screenshots for UI changes when possible
- call out any API contract or seed-data changes

## Quality Expectations

- keep backend logic in services, not controllers
- use the shared frontend service layer instead of ad hoc fetch logic when possible
- prefer additive cleanup over hidden behavioral changes
- document new environment variables and setup changes
