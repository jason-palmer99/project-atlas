---
description: "Use when editing Prisma schema files. Covers enum naming, relation conventions, timestamps, indexes, and migration naming for Project Atlas."
applyTo: "**/*.prisma"
---

# Prisma Schema Conventions

## Enum Naming
- Use UPPER_SNAKE_CASE for enum values: `SANCTIONED`, `VENDOR_RISK_ASSESSMENT`, `NOT_REQUIRED`
- Enum type names use PascalCase: `CatalogDecisionType`, `EvidenceStatus`

## Required Timestamps
Every model MUST include:
```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

Exception: `CatalogDecision` only has `createdAt` (append-only, never updated).

## Relations
- Use explicit relation names when a model has multiple relations to the same target
- Always define both sides of a relation
- Foreign key fields use `<entityName>Id` format: `softwareTitleId`, `observationId`

## Indexes
Index commonly filtered fields:
- `SoftwareTitle`: status, vendor, canonicalName, isSanctioned
- `SoftwareObservation`: sourceSystem, normalizedTitle, lastSeenAt
- `GovernanceEvidence`: softwareTitleId, evidenceType, status
- `CatalogDecision`: softwareTitleId, decidedAt
- `MatchRecord`: observationId, softwareTitleId, reviewStatus

## Migration Naming
Use descriptive names: `add-governance-evidence-table`, `add-match-confidence-index`
Never use auto-generated names.

## IDs
Use UUID for all primary keys: `id String @id @default(uuid())`
