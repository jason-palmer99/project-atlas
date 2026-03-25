# ADR-003: Rules-Based Decision Engine

## Status

Accepted

## Context

Project Atlas must derive a status for each software title (SANCTIONED, UNSANCTIONED_RUNNING, PENDING_GOVERNANCE, BLOCKED, RETIRED). This status drives the primary user-facing views and is the core value of the catalog.

We need a decision approach that is:
- Transparent and explainable to stakeholders
- Auditable with a clear decision trail
- Simple enough for V1 while extensible for future complexity
- Testable with deterministic outcomes

## Decision

Use a **transparent, rule-based decision engine** implemented as pure functions in `packages/rules-engine`.

Rules:
- **SANCTIONED**: Canonical record exists + all required evidence (QNA + vendor risk assessment) is ACTIVE + no blocking conditions
- **UNSANCTIONED_RUNNING**: Telemetry shows usage + no SANCTIONED decision exists
- **PENDING_GOVERNANCE**: Software is known + one or more required evidence items are missing
- **BLOCKED**: Required evidence missing with blocking policy, or explicit manual block
- **RETIRED**: Explicit decision marks the title as no longer supported

Each decision produces a `CatalogDecision` record with:
- The `decision` enum value
- A `reason` string explaining why
- `decidedBy` identifying the system rule or manual reviewer
- `isManualOverride` flag to distinguish computed vs human decisions

Decisions are **append-only** — new decisions don't delete old ones, preserving full history.

## Consequences

**Benefits:**
- Every decision has a human-readable reason
- Rules are pure functions — fully unit-testable with deterministic inputs/outputs
- Stakeholders can understand and challenge any decision
- Audit trail is built into the model
- Manual overrides are tracked alongside computed decisions

**Drawbacks:**
- Rules must be maintained as policy evolves
- Complex edge cases may need special handling
- No ML-based matching or scoring in V1

**Mitigations:**
- Rules are centralized in one package, easy to find and update
- Override mechanism handles edge cases until rules catch up
- ML-based scoring can be added later as a scoring input to rules, not a replacement

## Alternatives Considered

### ML-based classification
Use machine learning to classify software status. Rejected for V1 because it's a black box — stakeholders need to understand and trust decisions. ML may complement rules in the future as a confidence signal.

### Workflow engine (e.g., state machines)
Use a formal state machine for status transitions. Considered but deferred — V1 rules are simple enough that pure functions suffice. If transition logic grows complex, a state machine can wrap the existing rules.

### External rules engine
Use a third-party rules engine (e.g., Drools, json-rules-engine). Rejected because it adds operational dependency and the V1 rule set is small enough that TypeScript functions are sufficient.
