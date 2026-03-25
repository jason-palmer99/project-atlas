# ADR-001: Monorepo Structure and Service Boundaries

## Status

Accepted

## Context

Project Atlas is a multi-layer system with ingestion, normalization, correlation, decision, API, and UI components. We need to decide how to organize the codebase and manage dependencies between components.

Options considered:
- Polyrepo: separate repositories per component
- Monorepo with Turborepo + pnpm workspaces
- Monorepo with Nx

The team is small, iteration speed matters, and all components share the same TypeScript language and domain model.

## Decision

Use a **Turborepo monorepo with pnpm workspaces**.

Structure:
- `apps/` — deployable applications (API, web)
- `packages/` — shared libraries (domain, rules-engine, ingestion-sdk, ui-components)
- `services/` — future worker services extracted from the API
- `docs/` — documentation, ADRs, architecture
- `infra/` — infrastructure as code
- `data-contracts/` — schema definitions
- `tests/` — cross-cutting test suites (contract, integration, e2e)

Package boundaries:
- `packages/domain` is framework-agnostic and has no external dependencies
- `packages/rules-engine` depends only on `packages/domain`
- `packages/ingestion-sdk` depends only on `packages/domain`
- `apps/api` depends on domain, rules-engine, and ingestion-sdk
- `apps/web` depends on domain and ui-components
- `services/*` are reserved for future worker extraction; logic initially lives in `apps/api`

## Consequences

**Benefits:**
- Single source of truth for domain types across API and UI
- Atomic changes across packages and applications
- Shared tooling (ESLint, TypeScript, Prettier) configured once
- Turborepo caching speeds up builds and CI
- Easy refactoring of package boundaries as architecture evolves

**Drawbacks:**
- Repository size grows over time
- CI must handle workspace-aware builds
- Developers need familiarity with pnpm workspaces

**Mitigations:**
- Turborepo's task caching minimizes CI impact
- Clear package boundaries prevent coupling
- Workers can be extracted to separate deployments when needed without changing the repo structure

## Alternatives Considered

### Polyrepo
Rejected because it introduces coordination overhead for shared types, requires publishing/versioning the domain package, and slows iteration for a small team.

### Nx
Viable alternative but heavier. Turborepo is simpler to configure for our current needs and sufficient for the expected workspace size. Can migrate if Nx features become necessary.
