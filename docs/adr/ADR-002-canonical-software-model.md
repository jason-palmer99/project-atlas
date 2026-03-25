# ADR-002: Canonical Software Model — Separating Observations from Catalog Records

## Status

Accepted

## Context

Project Atlas ingests software telemetry from multiple sources (endpoint agents, discovery tools, CSV imports). Each source reports software differently — varying title formats, vendor names, version strings, and metadata completeness.

We need a data model that:
- Preserves raw source data for auditability
- Produces a single canonical view per software title
- Supports confidence-scored matching between raw and canonical records
- Allows manual correction without losing source provenance

## Decision

Separate **SoftwareObservation** (raw telemetry) from **SoftwareTitle** (canonical catalog record), linked through **MatchRecord**.

- **SoftwareObservation** stores the raw data exactly as received from source systems. It is immutable after creation (except for `lastSeenAt` updates).
- **SoftwareTitle** represents the single authoritative record for a piece of software in the catalog.
- **MatchRecord** tracks which observations map to which canonical titles, including the match method, confidence score, and review status.

This three-entity pattern ensures:
1. Raw telemetry is never modified or lost
2. Multiple observations can map to one canonical title
3. Match quality is explicitly tracked and reviewable
4. Low-confidence matches enter a review queue

## Consequences

**Benefits:**
- Full provenance: every catalog record traces back to its source observations
- Multi-source correlation: the same software from different sources converges to one canonical record
- Reviewability: confidence scores and review status make matching transparent
- Extensibility: new sources add observations without changing the canonical model

**Drawbacks:**
- More complex queries (joins through MatchRecord)
- Normalization and matching logic must be maintained
- Storage grows with observation volume (10,000+ titles × multiple observations per title)

**Mitigations:**
- PostgreSQL handles this scale easily with proper indexes
- MatchRecord indexes on `observationId` and `softwareTitleId` keep joins fast
- Normalization rules are centralized in `packages/domain` for consistency

## Alternatives Considered

### Single merged table
Store normalized + raw data in one table. Rejected because it loses provenance, makes multi-source correlation difficult, and conflates raw facts with editorial decisions.

### Event-sourced observations
Store every telemetry event as an immutable event. Considered but deferred — the current model with `firstSeenAt`/`lastSeenAt` provides sufficient freshness tracking for V1 without event store complexity.
