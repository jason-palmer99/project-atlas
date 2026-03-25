# Project Atlas — Domain Model

## Overview

The domain model separates concerns into five core entities:

1. **SoftwareTitle** — canonical catalog records
2. **SoftwareObservation** — raw telemetry from source systems
3. **GovernanceEvidence** — supporting artifacts (QNA, risk assessments)
4. **CatalogDecision** — derived status shown to users
5. **MatchRecord** — mapping from observations to canonical titles

This separation ensures that observed telemetry facts, canonical records, governance evidence, and derived decisions remain independently manageable and auditable.

## Entity Relationship Diagram

```
SoftwareObservation ──┐
                      │ many-to-one (via MatchRecord)
                      ▼
               MatchRecord ──────► SoftwareTitle
                                       │
                          ┌────────────┼────────────┐
                          │            │            │
                          ▼            ▼            ▼
                GovernanceEvidence  CatalogDecision  (SoftwareObservation via MatchRecord)
```

- A **SoftwareTitle** has many **GovernanceEvidence** records
- A **SoftwareTitle** has many **CatalogDecision** records (history)
- A **SoftwareTitle** has many **MatchRecord** entries
- A **SoftwareObservation** has many **MatchRecord** entries
- A **MatchRecord** links one observation to one title

## Entities

### 1. SoftwareTitle

Represents the canonical software entry in the catalog.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `canonicalName` | string | Normalized display name |
| `vendor` | string | Software vendor/publisher |
| `productFamily` | string \| null | Product family grouping |
| `category` | string \| null | Software category (e.g., browser, IDE, security) |
| `description` | string \| null | Human-readable description |
| `status` | SoftwareTitleStatus | Current derived status |
| `isSanctioned` | boolean | Whether the title is currently sanctioned |
| `createdAt` | DateTime | Record creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

### 2. SoftwareObservation

Represents telemetry collected from a source system. This is raw, unmodified data.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `rawTitle` | string | Original title as reported by source |
| `normalizedTitle` | string \| null | Title after normalization processing |
| `vendor` | string \| null | Vendor as reported by source |
| `version` | string \| null | Version as reported by source |
| `sourceSystem` | string | Identifier of the telemetry source |
| `deviceId` | string \| null | Device where software was observed |
| `department` | string \| null | Department or organizational unit |
| `firstSeenAt` | DateTime | First observation timestamp |
| `lastSeenAt` | DateTime | Most recent observation timestamp |
| `confidenceScore` | float \| null | Normalization confidence (0.0–1.0) |
| `createdAt` | DateTime | Record creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

### 3. GovernanceEvidence

Represents supporting artifacts tied to a software title.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `softwareTitleId` | UUID | FK → SoftwareTitle |
| `evidenceType` | EvidenceType | Type of evidence |
| `referenceId` | string \| null | External system reference ID |
| `referenceUrl` | string \| null | Link to evidence document |
| `status` | EvidenceStatus | Current evidence status |
| `owner` | string \| null | Responsible party |
| `effectiveDate` | DateTime \| null | When evidence became effective |
| `expirationDate` | DateTime \| null | When evidence expires |
| `createdAt` | DateTime | Record creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

### 4. CatalogDecision

Represents the derived status decision shown to users. Decisions are append-only to preserve history.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `softwareTitleId` | UUID | FK → SoftwareTitle |
| `decision` | CatalogDecisionType | Derived decision |
| `reason` | string | Human-readable explanation |
| `decidedBy` | string | User or system that made the decision |
| `decidedAt` | DateTime | When the decision was made |
| `isManualOverride` | boolean | Whether this overrides computed status |
| `createdAt` | DateTime | Record creation timestamp |

### 5. MatchRecord

Tracks the mapping from a telemetry observation to a canonical software title.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `observationId` | UUID | FK → SoftwareObservation |
| `softwareTitleId` | UUID | FK → SoftwareTitle |
| `matchMethod` | MatchMethod | How the match was determined |
| `confidenceScore` | float | Match confidence (0.0–1.0) |
| `reviewStatus` | ReviewStatus | Manual review state |
| `reviewedBy` | string \| null | Reviewer identity |
| `reviewedAt` | DateTime \| null | When review occurred |
| `createdAt` | DateTime | Record creation timestamp |
| `updatedAt` | DateTime | Last modification timestamp |

## Enums

### SoftwareTitleStatus

| Value | Description |
|-------|-------------|
| `ACTIVE` | Title is active in the catalog |
| `RETIRED` | Title has been retired |
| `UNDER_REVIEW` | Title is being evaluated |

### CatalogDecisionType

| Value | Description |
|-------|-------------|
| `SANCTIONED` | Approved for use; all required evidence present |
| `UNSANCTIONED_RUNNING` | Observed in telemetry but not approved |
| `PENDING_GOVERNANCE` | Known but missing required evidence |
| `BLOCKED` | Explicitly blocked from use |
| `RETIRED` | No longer supported or allowed |

### EvidenceType

| Value | Description |
|-------|-------------|
| `QNA` | Quality Needs Assessment |
| `VENDOR_RISK_ASSESSMENT` | Vendor risk evaluation |
| `SOFTWARE_RISK_ASSESSMENT` | Software-specific risk evaluation |
| `SECURITY_SCAN` | Security scan results |

### EvidenceStatus

| Value | Description |
|-------|-------------|
| `ACTIVE` | Evidence is current and valid |
| `EXPIRED` | Evidence has passed its expiration date |
| `PENDING` | Evidence is being gathered |
| `REVOKED` | Evidence has been invalidated |

### MatchMethod

| Value | Description |
|-------|-------------|
| `EXACT` | Exact string match |
| `FUZZY` | Fuzzy/similarity match |
| `VENDOR_PRODUCT` | Matched on vendor + product family |
| `MANUAL` | Manually assigned by a reviewer |

### ReviewStatus

| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting human review |
| `APPROVED` | Match confirmed by reviewer |
| `REJECTED` | Match rejected by reviewer |
| `NOT_REQUIRED` | High-confidence match; no review needed |

## Business Rules

### Status Derivation

#### SANCTIONED
A title is sanctioned when:
- A canonical software record exists
- All required governance evidence exists (QNA + vendor risk assessment)
- No blocking conditions are active

#### UNSANCTIONED_RUNNING
A title is unsanctioned but running when:
- Telemetry shows usage or installation
- No sanctioned catalog decision exists

#### PENDING_GOVERNANCE
A title is pending governance when:
- The software is known or observed
- One or more required evidence items are missing

#### BLOCKED
A title is blocked when:
- Required evidence is missing and policy requires it, OR
- A manual review explicitly blocks use

#### RETIRED
A title is retired when:
- An explicit decision marks it as no longer supported

### Evidence Requirements

For a title to be **SANCTIONED**, the following evidence must be present and `ACTIVE`:
- At least one `QNA`
- At least one `VENDOR_RISK_ASSESSMENT`

### Match Confidence Thresholds

| Score Range | Action |
|-------------|--------|
| 0.9–1.0 | Auto-approve match; `reviewStatus` = `NOT_REQUIRED` |
| 0.7–0.89 | Queue for review; `reviewStatus` = `PENDING` |
| < 0.7 | Queue for review with low-confidence flag |
