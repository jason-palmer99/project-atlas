# ADR-004: Pluggable Source Adapter Contract

## Status

Accepted

## Context

Project Atlas must ingest telemetry from multiple source systems: endpoint agents, software discovery tools, CSV/manual imports, and governance systems. Each source has different formats, protocols, and update frequencies.

We need an ingestion architecture that:
- Supports adding new sources without modifying core logic
- Validates incoming data consistently
- Tracks ingestion status per source
- Handles errors gracefully per source without affecting others

## Decision

Define a **SourceAdapter interface** in `packages/ingestion-sdk` that all source implementations must conform to.

```typescript
interface SourceAdapter {
  readonly sourceId: string;
  readonly sourceName: string;

  validate(data: unknown): ValidationResult;
  ingest(data: unknown): Promise<IngestionResult>;
  getMetadata(): SourceMetadata;
}
```

Key aspects:
- Each adapter declares its `sourceId` for provenance tracking
- `validate()` checks data before ingestion (schema, required fields, format)
- `ingest()` performs the actual import, creating SoftwareObservation records
- `getMetadata()` returns source-specific metadata (freshness, capabilities)
- The first adapter will be a **CSV adapter** for the Alpha milestone

Adapters are registered with the ingestion service in `apps/api`. The API endpoint accepts a source identifier and routes to the appropriate adapter.

## Consequences

**Benefits:**
- New sources are added by implementing the interface — no core changes needed
- Validation is per-source, handling format differences cleanly
- Source provenance is tracked on every observation via `sourceSystem` field
- Ingestion status and errors are tracked per source independently
- Testing is straightforward — each adapter is independently testable

**Drawbacks:**
- Interface design must anticipate future source patterns
- File-based (CSV) and API-based sources have different trigger models
- Adapter registration is manual in V1

**Mitigations:**
- Keep the interface minimal; extend with optional methods as needed
- CSV adapter handles the file-upload pattern; API adapters will use a pull/webhook pattern
- Auto-discovery of adapters can be added if the number of sources grows

## Alternatives Considered

### Direct integration per source
Write source-specific ingestion code without a shared contract. Rejected because it leads to inconsistent validation, duplicated error handling, and no standard way to add new sources.

### Event-driven ingestion (message queue)
Sources publish to a message queue, workers consume. Considered but deferred — adds infrastructure complexity (message broker) that isn't justified for V1. The adapter contract is compatible with future event-driven extension.

### ETL framework (e.g., Apache Airflow)
Use a full ETL orchestration tool. Rejected for V1 — too heavy for the initial scope. The adapter interface provides the extensibility needed, and orchestration can be layered on later if scheduling becomes complex.
