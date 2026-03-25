# Project Atlas — Context Diagram

## System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SOURCES                                   │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Endpoint     │  │  Discovery   │  │  CSV/Manual  │  │  Governance  │   │
│  │  Telemetry    │  │  Tools       │  │  Import      │  │  Systems     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                  │                  │           │
└─────────┼──────────────────┼──────────────────┼──────────────────┼───────────┘
          │                  │                  │                  │
          ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INGESTION LAYER                                      │
│                                                                             │
│  Source adapters validate and import raw data into SoftwareObservation      │
│  records. Each adapter conforms to the SourceAdapter contract.              │
│                                                                             │
│  Responsibilities:                                                          │
│  • Validate incoming data                                                   │
│  • Create SoftwareObservation records                                       │
│  • Track ingestion status and freshness                                     │
│  • Handle deduplication (firstSeenAt / lastSeenAt)                          │
│                                                                             │
│  Package: packages/ingestion-sdk                                            │
│  Service: services/ingest-worker (future extraction)                        │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NORMALIZATION LAYER                                    │
│                                                                             │
│  Processes raw titles and vendors into canonical forms.                     │
│                                                                             │
│  Responsibilities:                                                          │
│  • Title cleaning (case, whitespace, punctuation)                           │
│  • Vendor normalization                                                     │
│  • Version normalization                                                    │
│  • Duplicate detection                                                      │
│  • Confidence scoring                                                       │
│                                                                             │
│  Package: packages/domain (normalization rules)                             │
│  Service: services/matcher-worker (future extraction)                       │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CORRELATION LAYER                                      │
│                                                                             │
│  Links observations to canonical SoftwareTitle records via MatchRecord.     │
│  Links SoftwareTitle records to GovernanceEvidence.                         │
│                                                                             │
│  Responsibilities:                                                          │
│  • Match observations → canonical titles (exact, fuzzy, vendor+product)     │
│  • Attach QNA references                                                    │
│  • Attach vendor risk assessments                                           │
│  • Compute missing evidence                                                 │
│  • Flag exceptions and low-confidence matches                               │
│                                                                             │
│  Package: packages/domain (matching + evidence rules)                       │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DECISION LAYER                                        │
│                                                                             │
│  Applies rules to compute catalog status (CatalogDecision).                │
│                                                                             │
│  Responsibilities:                                                          │
│  • Derive SANCTIONED / UNSANCTIONED_RUNNING / PENDING_GOVERNANCE / BLOCKED │
│  • Explain decision outcome via reason field                                │
│  • Support manual override history                                          │
│  • Preserve decision audit trail (append-only)                              │
│                                                                             │
│  Package: packages/rules-engine                                             │
│  Service: services/policy-worker (future extraction)                        │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API LAYER                                          │
│                                                                             │
│  NestJS REST API exposing catalog data.                                     │
│                                                                             │
│  Key endpoints:                                                             │
│  • GET/POST /software-titles — list, create, update catalog entries         │
│  • GET /software-titles/:id — detail with evidence and decisions            │
│  • GET/POST /observations — telemetry records                               │
│  • POST /ingestion — trigger ingestion from source                          │
│  • GET/POST /governance-evidence — evidence CRUD                            │
│  • GET /matches/review-queue — low-confidence matches                       │
│  • POST /matches/:id/review — accept/reject match                          │
│                                                                             │
│  App: apps/api                                                              │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UI LAYER                                          │
│                                                                             │
│  React + Vite single-page application.                                      │
│                                                                             │
│  Key views:                                                                 │
│  • Catalog list — searchable, filterable table of software titles           │
│  • Detail page — title info, observations, evidence, decision history       │
│  • Review queue — low-confidence matches for manual review                  │
│  • Filters — sanctioned, unsanctioned, missing QNA, missing risk assess.   │
│                                                                             │
│  App: apps/web                                                              │
│  Package: packages/ui-components (shared presentational components)         │
└─────────────────────────────────────────────────────────────────────────────┘

## Data Flow Summary

1. **Ingest**: Source adapters pull/receive telemetry → SoftwareObservation records
2. **Normalize**: Raw titles cleaned, vendors normalized, confidence scored
3. **Match**: Observations matched to SoftwareTitle via MatchRecord
4. **Correlate**: GovernanceEvidence linked to SoftwareTitle
5. **Decide**: Rules engine computes CatalogDecision from evidence + observations
6. **Serve**: API exposes catalog data with filtering and search
7. **Display**: UI renders catalog list, detail, and review views

## Infrastructure (Local Development)

```
┌──────────────────────────────────────────┐
│           Docker Desktop                  │
│  ┌────────────────────────────────────┐  │
│  │  PostgreSQL 16                      │  │
│  │  Port: 5432                         │  │
│  │  Volume: atlas-postgres-data        │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
          ▲                    ▲
          │                    │
   ┌──────┴──────┐     ┌──────┴──────┐
   │  apps/api   │     │  apps/web   │
   │  (NestJS)   │     │  (Vite)     │
   │  Port: 3000 │     │  Port: 5173 │
   └─────────────┘     └─────────────┘
   Runs on host         Runs on host
```

## Package Boundaries

| Package/App | Responsibility | Dependencies |
|-------------|---------------|--------------|
| `packages/domain` | Entities, enums, types, normalization, business rules | None (framework-agnostic) |
| `packages/rules-engine` | Status derivation logic | `packages/domain` |
| `packages/ingestion-sdk` | Source adapter contract and implementations | `packages/domain` |
| `packages/ui-components` | Shared presentational React components | None |
| `apps/api` | NestJS REST API, Prisma persistence | `packages/domain`, `packages/rules-engine`, `packages/ingestion-sdk` |
| `apps/web` | React + Vite UI | `packages/domain`, `packages/ui-components` |
| `services/*` | Future worker extraction targets | `packages/domain` |
