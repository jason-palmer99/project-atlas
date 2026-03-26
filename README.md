# Project Atlas

> *In Greek mythology, Atlas bears the weight of the world on his shoulders — holding everything in place so others can navigate it. Project Atlas does the same for your software estate: it carries the full picture so your teams always know where they stand.*

Project Atlas is a centralized software catalog that correlates telemetry from multiple sources with governance and risk artifacts to produce a single, authoritative answer to three questions every organization struggles to answer consistently:

- **What software is actually running?** — discovered from endpoint agents, network tools, MDM platforms, and security tools
- **What is sanctioned?** — verified through formal governance processes (QNAs, vendor risk assessments, security scans)
- **What evidence exists, what is missing, and what is about to expire?** — tracked continuously so compliance gaps surface before they become incidents

## Why Atlas exists

Modern software estates are ungoverned by default. Procurement, IT operations, security, and risk teams each maintain their own view — a spreadsheet here, a ticket queue there — and none of them agree. The result is a perpetual cycle of manual reconciliation, missed renewals, shadow IT that goes undetected, and audit findings that could have been avoided.

Atlas breaks that cycle by acting as a **correlation engine**. It ingests raw telemetry from wherever software usage is observable, normalizes it into canonical software records, and continuously evaluates each record against its attached governance evidence. The output is a live catalog with derived compliance status — not a point-in-time snapshot that ages immediately, but a system that updates as your evidence does.

### Intended impact

| Problem | How Atlas addresses it |
|---------|------------------------|
| Shadow IT goes undetected | Every observed title without a SANCTIONED decision surfaces as UNSANCTIONED_RUNNING |
| Governance evidence expires silently | Evidence expiration warnings fire 90 days ahead; status degrades automatically |
| Audit prep is manual and slow | Decision history is append-only and fully attributed — ready for auditors on demand |
| No single source of truth | One catalog, multiple telemetry feeds — observations linked to canonical titles via match records |
| Risk assessments live in silos | GovernanceEvidence links QNAs and vendor risk assessments directly to the software record they cover |

## Getting Started

Follow these steps from a fresh clone to a running UI in your browser.

### Prerequisites

| Requirement | Minimum Version | Install |
|-------------|----------------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| pnpm | 9+ | [pnpm.io](https://pnpm.io/) |
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |

> **Note:** Docker Desktop must be running before you continue.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

The defaults in `.env.example` work out of the box for local development — no edits required.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

Verify the container is healthy:

```bash
docker ps --filter name=atlas-postgres --format "table {{.Names}}\t{{.Status}}"
```

You should see `atlas-postgres` with a status that includes **(healthy)**.

### 4. Run database migrations

```bash
pnpm --filter @atlas/api prisma migrate dev
```

This creates the database schema. On subsequent runs Prisma will apply any new migrations automatically.

### 5. Start the development servers

```bash
pnpm dev
```

Turborepo starts both the API and the web frontend in parallel. Wait until you see output similar to:

```
@atlas/api:dev  — Nest application successfully started
@atlas/web:dev  — Local: http://localhost:5173/
```

### 6. Open Atlas in the browser

Navigate to **http://localhost:5173** — you should see the Atlas catalog page.

### Services (Running)

| Service | URL | Description |
|---------|-----|-------------|
| Web UI | http://localhost:5173 | React + Vite frontend |
| API | http://localhost:3000 | NestJS REST API |
| PostgreSQL | localhost:5432 | Database (Docker) |

### Dev Scripts

The `scripts/` folder contains PowerShell scripts that automate the full lifecycle — loading `.env`, starting Docker, running migrations, building, and clearing stale port conflicts:

```powershell
.\scripts\dev-start.ps1          # Full start: Docker → migrations → build → pnpm dev
.\scripts\dev-stop.ps1           # Kill API + web processes (add -IncludeDb to also stop PostgreSQL)
.\scripts\dev-restart.ps1        # Stop then start (add -SkipBuild to skip the build step)
```

### Stopping everything

```powershell
.\scripts\dev-stop.ps1 -IncludeDb   # stops dev servers and PostgreSQL
```

Or manually:

```bash
# Ctrl+C in the terminal running pnpm dev, then:
docker compose down          # stops PostgreSQL (data is preserved in a Docker volume)
```

To also wipe the database volume:

```bash
docker compose down -v
```

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
scripts/               PowerShell dev scripts (start, stop, restart)
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
