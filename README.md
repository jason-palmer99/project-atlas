# Project Atlas

A centralized software catalog that correlates multi-source telemetry with governance and risk artifacts. It answers: what software is running, what is sanctioned, and what governance evidence exists or is missing.

## Quick Start

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Setup

```bash
cp .env.example .env
docker compose up -d          # Start PostgreSQL
pnpm install
pnpm --filter @atlas/api prisma migrate dev
pnpm dev                      # Start API + web via Turborepo
```

### Services

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:3000 | NestJS REST API |
| Web | http://localhost:5173 | React + Vite UI |
| PostgreSQL | localhost:5432 | Database (Docker) |

## Architecture

```
External Sources → Ingestion → Normalization → Correlation → Decision → API → UI
```

See [Context Diagram](docs/architecture/context-diagram.md) for details.

### Domain Model

Five core entities: **SoftwareTitle** (canonical catalog), **SoftwareObservation** (raw telemetry), **GovernanceEvidence** (QNAs, risk assessments), **CatalogDecision** (derived status), **MatchRecord** (observation-to-title mapping).

See [Domain Model](docs/architecture/domain-model.md) for full field definitions and business rules.

## Repository Structure

```
apps/api/              NestJS REST API with Prisma
apps/web/              React + Vite frontend
packages/domain/       Framework-agnostic entities, enums, types, business rules
packages/rules-engine/ Status derivation logic
packages/ingestion-sdk/ Source adapter contract and implementations
packages/ui-components/ Shared React presentational components
services/              Future worker extraction targets
docs/                  Architecture docs, ADRs, product docs
infra/                 Infrastructure as code
data-contracts/        Schema definitions
tests/                 Cross-cutting test suites
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript (full-stack) |
| API | NestJS |
| Database | PostgreSQL |
| ORM | Prisma |
| Frontend | React + Vite |
| Monorepo | Turborepo + pnpm workspaces |
| Local Infra | Docker Desktop |

## Documentation

- [Project Charter](docs/product/project-charter.md)
- [Domain Model](docs/architecture/domain-model.md)
- [Context Diagram](docs/architecture/context-diagram.md)
- [ADR-001: Monorepo and Boundaries](docs/adr/ADR-001-monorepo-and-boundaries.md)
- [ADR-002: Canonical Software Model](docs/adr/ADR-002-canonical-software-model.md)
- [ADR-003: Rules-Based Decision Engine](docs/adr/ADR-003-rules-based-decision-engine.md)
- [ADR-004: Source Adapter Contract](docs/adr/ADR-004-source-adapter-contract.md)
- [ADR-005: Auth and Authorization](docs/adr/ADR-005-auth-and-authorization.md)
- [ADR-006: Audit and Provenance](docs/adr/ADR-006-audit-and-provenance.md)
