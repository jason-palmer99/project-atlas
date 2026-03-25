# Project Atlas — Copilot Instructions

## Project Overview

Project Atlas is a centralized software catalog that correlates multi-source telemetry with governance and risk artifacts. It answers: what software is running, what is sanctioned, and what governance evidence exists.

## Tech Stack

- **Language**: TypeScript (full-stack)
- **API**: NestJS (apps/api)
- **Database**: PostgreSQL (Docker Desktop locally)
- **ORM**: Prisma
- **Frontend**: React + Vite (apps/web)
- **Monorepo**: Turborepo + pnpm workspaces

## Repository Structure

```
apps/api          — NestJS REST API with Prisma
apps/web          — React + Vite frontend
packages/domain   — Framework-agnostic entities, enums, types, business rules
packages/rules-engine    — Status derivation logic
packages/ingestion-sdk   — Source adapter contract and implementations
packages/ui-components   — Shared React presentational components
services/*        — Future worker extraction targets
docs/             — Architecture docs, ADRs, product docs
```

## Domain Model (5 Entities)

1. **SoftwareTitle** — canonical catalog record (id, canonicalName, vendor, productFamily, category, status, isSanctioned)
2. **SoftwareObservation** — raw telemetry from sources (rawTitle, normalizedTitle, vendor, version, sourceSystem, deviceId, firstSeenAt, lastSeenAt)
3. **GovernanceEvidence** — QNA, risk assessments linked to titles (evidenceType, referenceId, referenceUrl, status, effectiveDate, expirationDate)
4. **CatalogDecision** — derived status decisions, append-only (decision, reason, decidedBy, isManualOverride)
5. **MatchRecord** — observation-to-title mapping (matchMethod, confidenceScore, reviewStatus)

## Key Enums

- **CatalogDecisionType**: SANCTIONED, UNSANCTIONED_RUNNING, PENDING_GOVERNANCE, BLOCKED, RETIRED
- **EvidenceType**: QNA, VENDOR_RISK_ASSESSMENT, SOFTWARE_RISK_ASSESSMENT, SECURITY_SCAN
- **EvidenceStatus**: ACTIVE, EXPIRED, PENDING, REVOKED
- **MatchMethod**: EXACT, FUZZY, VENDOR_PRODUCT, MANUAL
- **ReviewStatus**: PENDING, APPROVED, REJECTED, NOT_REQUIRED

## Core Design Principles

- **Separate observations from catalog titles from evidence from decisions** — these are distinct concerns
- Raw telemetry is never modified after creation (except lastSeenAt)
- CatalogDecision records are append-only (preserve full audit trail)
- Every record tracks provenance (sourceSystem, decidedBy, matchMethod)
- Business rules are pure functions — deterministic, testable, no side effects

## Status Derivation Rules

- **SANCTIONED**: canonical record exists + QNA (ACTIVE) + vendor risk assessment (ACTIVE) + no blocking conditions
- **UNSANCTIONED_RUNNING**: telemetry shows usage + no SANCTIONED decision
- **PENDING_GOVERNANCE**: software known + missing required evidence
- **BLOCKED**: missing evidence with blocking policy, or explicit manual block
- **RETIRED**: explicit decision marks title as unsupported

## Code Conventions

### General
- Prefer clear and explicit code over clever abstractions
- Keep domain models framework-agnostic (no ORM decorators in packages/domain)
- Use explicit enums for all status and type fields
- Record timestamps and source system identifiers consistently
- Write tests alongside core business logic

### NestJS (apps/api)
- One module per domain entity (software-titles, observations, governance-evidence, catalog-decisions, matches)
- Controller → Service → Prisma pattern
- Use class-validator decorators on DTOs
- Use NestJS built-in exceptions (NotFoundException, BadRequestException)
- Pagination via limit/offset query parameters

### Prisma
- Enum names use UPPER_SNAKE_CASE
- All models include createdAt and updatedAt timestamps
- Index commonly filtered fields (status, vendor, canonicalName, softwareTitleId)
- Migration names describe the change (e.g., add-governance-evidence-table)

### React (apps/web)
- Functional components with hooks
- Typed API client for all backend calls
- No inline styles — use CSS modules or a consistent styling approach

### packages/domain
- No framework imports (no NestJS, no Prisma, no React)
- Export pure types, enums, interfaces, and rule functions
- Business rule functions take explicit inputs and return explicit outputs

## What NOT to Do

- Don't merge raw telemetry into canonical records — keep them separate
- Don't overwrite CatalogDecision records — append new ones
- Don't skip provenance fields (sourceSystem, decidedBy, matchMethod)
- Don't put business rules in controllers — they belong in packages/domain or packages/rules-engine
- Don't add infrastructure complexity beyond what V1 requires
