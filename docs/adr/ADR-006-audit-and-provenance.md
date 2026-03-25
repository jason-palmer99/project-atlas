# ADR-006: Audit Trail and Data Provenance

## Status

Accepted

## Context

Project Atlas is a governance and risk tool. Users need to trust that:
- Every catalog decision can be traced to its inputs
- Every observation can be traced to its source system
- Every status change has a history
- Evidence linkage is transparent and verifiable

Without provenance, the catalog is a black box that stakeholders won't trust.

## Decision

Build audit and provenance into the data model from the start, not as an afterthought.

### Provenance Tracking

Every entity records its origin:
- **SoftwareObservation**: `sourceSystem` identifies which telemetry source produced the record
- **MatchRecord**: `matchMethod` records how the match was determined (exact, fuzzy, vendor_product, manual)
- **GovernanceEvidence**: `referenceId` and `referenceUrl` link to external evidence systems
- **CatalogDecision**: `decidedBy` records the user or system rule, `reason` explains why

### Timestamp Discipline

All entities include:
- `createdAt` — when the record was created (immutable)
- `updatedAt` — when the record was last modified (where applicable)
- Domain-specific timestamps: `firstSeenAt`/`lastSeenAt` (observations), `decidedAt` (decisions), `effectiveDate`/`expirationDate` (evidence)

### Append-Only Decisions

`CatalogDecision` records are **append-only**. When a status changes:
1. A new `CatalogDecision` is inserted with the new status, reason, and timestamp
2. The previous decision remains in the history
3. The current decision is the most recent by `decidedAt`

This provides a complete audit trail of every status transition.

### Manual Override Tracking

When a human overrides a computed decision:
- `isManualOverride = true` on the `CatalogDecision`
- `decidedBy` records the reviewer's identity
- `reason` explains the override rationale

## Consequences

**Benefits:**
- Full traceability from UI display → decision → evidence → observation → source
- Stakeholders can audit any catalog entry end-to-end
- Override history prevents "who changed this and why" questions
- No data is lost through overwrites

**Drawbacks:**
- More storage than a mutable-status approach (decision history accumulates)
- Queries for "current status" need to find the latest decision record
- All entities need consistent timestamp fields

**Mitigations:**
- Decision volume is low (status changes infrequently per title) — storage is negligible
- Index on `(softwareTitleId, decidedAt DESC)` makes latest-decision queries fast
- Prisma schema enforces timestamp fields consistently
- A `status` field on `SoftwareTitle` is maintained as a denormalized cache of the current decision for query convenience

## Alternatives Considered

### Separate audit log table
Use a generic audit_log table with JSON payloads. Rejected because it decouples audit data from the entities it describes, making queries harder and provenance less discoverable.

### Event sourcing
Store all state changes as events and derive current state. Considered but deferred — adds significant infrastructure complexity. The append-only decision pattern provides sufficient auditability for V1.

### Mutable status with no history
Store only the current status on `SoftwareTitle`. Rejected because it eliminates the ability to explain how a title reached its current state, which undermines governance trust.
