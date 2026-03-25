---
description: "Use when writing domain types, enums, interfaces, or business rule functions in the domain package. Enforces framework-agnostic, pure function patterns."
applyTo: "packages/domain/**/*.ts"
---

# Domain Package Conventions

## Framework Agnostic
- NO framework imports: no NestJS, no Prisma, no React, no Express
- NO ORM decorators or database-specific types
- This package must be usable from any runtime context

## Types and Enums
- Export all entity interfaces: `SoftwareTitle`, `SoftwareObservation`, `GovernanceEvidence`, `CatalogDecision`, `MatchRecord`
- Use explicit TypeScript enums for all status and type fields
- Enum values use UPPER_SNAKE_CASE

## Business Rules
- Implement as pure functions: explicit inputs → explicit outputs
- No side effects (no database calls, no HTTP, no file I/O)
- Must be deterministic: same inputs always produce same outputs
- Every rule function should be independently unit-testable

## Provenance
- Never omit provenance fields from interfaces: `sourceSystem`, `decidedBy`, `matchMethod`
- Timestamps are always present: `createdAt`, `updatedAt`

## Exports
- Export everything from a central `index.ts`
- Group exports by concern: types, enums, rules, normalization
