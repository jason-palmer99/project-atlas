---
description: "Scaffold a new SourceAdapter implementation for the ingestion SDK. Use when adding a new telemetry source."
---

# Create Source Adapter

Scaffold a new SourceAdapter implementation for Project Atlas telemetry ingestion.

## Inputs

- **Adapter name**: Name of the source (e.g., csv, intune, sccm, servicenow)
- **Data format**: How data arrives (file upload, API pull, webhook)

## Instructions

1. Read `packages/ingestion-sdk/src/adapter.ts` for the SourceAdapter interface
2. Read an existing adapter (e.g., `csv-adapter.ts`) as a reference implementation
3. Create the following files:

### packages/ingestion-sdk/src/adapters/{name}-adapter.ts
- Implement the `SourceAdapter` interface
- Define `sourceId` and `sourceName` as readonly properties
- Implement `validate()`: check data format, required fields, return `ValidationResult`
- Implement `ingest()`: parse data, create SoftwareObservation-shaped records, return `IngestionResult`
- Implement `getMetadata()`: return source capabilities and configuration

### packages/ingestion-sdk/src/adapters/{name}-adapter.spec.ts
- Test validation with valid and invalid inputs
- Test ingestion with sample data
- Test edge cases: empty data, malformed records, duplicate handling

4. Export the new adapter from `packages/ingestion-sdk/src/index.ts`

## Constraints

- Follow the existing adapter patterns exactly
- All observations must include `sourceSystem` matching the adapter's `sourceId`
- Validate data before ingestion — never persist invalid records
- Handle errors gracefully — return error details in `IngestionResult`, don't throw
- Import types only from `@atlas/domain`
