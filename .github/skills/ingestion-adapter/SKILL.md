---
name: ingestion-adapter
description: "Create a new telemetry source adapter for Project Atlas. Use when adding a new data source, building an ingestion adapter, or implementing the SourceAdapter interface. Covers validation, ingestion, testing, and registration."
---

# Ingestion Adapter Skill

Create a complete telemetry source adapter for Project Atlas following the SourceAdapter contract.

## When to Use
- Adding a new telemetry data source (CSV, API, webhook, etc.)
- Implementing the SourceAdapter interface
- Extending the ingestion pipeline with a new source

## Procedure

1. **Review the contract**: Read `packages/ingestion-sdk/src/adapter.ts` for the SourceAdapter interface
2. **Study an example**: Read the CSV adapter in `packages/ingestion-sdk/src/adapters/csv-adapter.ts`
3. **Create the adapter**: Implement all interface methods (validate, ingest, getMetadata)
4. **Write tests**: Cover valid input, invalid input, edge cases, and dedup behavior
5. **Register**: Export from `packages/ingestion-sdk/src/index.ts` and register in the API ingestion module
6. **Document**: Add source-specific notes to `data-contracts/source-schemas/`

## Key Rules
- All observations must set `sourceSystem` to the adapter's `sourceId`
- Validate before persisting — never store invalid records
- Handle errors gracefully — return them in IngestionResult, don't throw
- Track firstSeenAt/lastSeenAt for deduplication

## References
- [Source Adapter ADR](../../docs/adr/ADR-004-source-adapter-contract.md)
- [Domain Model](../../docs/architecture/domain-model.md) — SoftwareObservation entity

> **Note**: This skill will be expanded with reference templates and scripts once the SourceAdapter interface is implemented in Phase 3.
