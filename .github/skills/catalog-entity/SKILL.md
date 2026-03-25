---
name: catalog-entity
description: "Add a new domain entity end-to-end in Project Atlas. Use when creating a new entity type, adding a Prisma model, building a NestJS module, or extending the domain model. Covers the full stack from domain type to API endpoint to tests."
---

# Catalog Entity Skill

Add a new domain entity to Project Atlas across all layers: domain type → Prisma model → migration → NestJS module → tests.

## When to Use
- Adding a new entity to the catalog domain model
- Extending the data model with a new table/type
- Building a full-stack CRUD feature for a new entity

## Procedure

1. **Define the domain type** in `packages/domain/src/types/`
   - Create interface with all fields
   - Add any new enums
   - Export from `packages/domain/src/index.ts`

2. **Add the Prisma model** in `apps/api/prisma/schema.prisma`
   - Follow conventions: UUID id, createdAt/updatedAt, UPPER_SNAKE enums
   - Define relations to existing models
   - Add indexes on filtered fields

3. **Create and run migration**
   - `pnpm --filter @atlas/api prisma migrate dev --name add-{entity}-table`

4. **Scaffold the NestJS module** in `apps/api/src/{entity}/`
   - Module, controller, service, DTOs
   - Follow Controller → Service → Prisma pattern
   - Register in `app.module.ts`

5. **Write tests**
   - Unit tests for any business rules
   - Integration tests for API endpoints

6. **Update documentation**
   - Add entity to `docs/architecture/domain-model.md`
   - Create ADR if the entity represents an architectural decision

## Key Rules
- Domain types in packages/domain must remain framework-agnostic
- Prisma models must include createdAt/updatedAt
- All fields that accept user input must be validated via DTOs
- Foreign keys follow `{entityName}Id` naming convention

## References
- [Domain Model](../../docs/architecture/domain-model.md)
- [Canonical Software Model ADR](../../docs/adr/ADR-002-canonical-software-model.md)

> **Note**: This skill will be expanded with templates and example code once the first entity (SoftwareTitle) is fully implemented in Phase 2.
