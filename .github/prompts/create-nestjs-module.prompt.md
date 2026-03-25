---
description: "Scaffold a complete NestJS module for a domain entity in apps/api. Creates module, controller, service, DTOs, and test file."
---

# Create NestJS Module

Scaffold a full NestJS module for a Project Atlas domain entity.

## Inputs

- **Entity name**: The domain entity (e.g., software-titles, observations, governance-evidence)
- **CRUD operations**: Which operations to include (default: list, get, create, update)

## Instructions

1. Read `.github/instructions/nestjs-module.instructions.md` for conventions
2. Read `packages/domain/src/index.ts` for the entity type and related enums
3. Read `apps/api/src/prisma/prisma.service.ts` (or similar) for the Prisma service pattern
4. Create the following files under `apps/api/src/{entity-name}/`:

### {entity-name}.module.ts
- Import and register controller and service
- Import PrismaModule if not global

### {entity-name}.controller.ts
- REST endpoints following the Controller → Service pattern
- GET / (list with pagination: offset, limit query params)
- GET /:id (single record)
- POST / (create)
- PATCH /:id (update, if applicable)
- Use appropriate NestJS decorators and HTTP status codes

### {entity-name}.service.ts
- Inject PrismaService
- Implement methods for each CRUD operation
- Use Prisma client for database queries
- Call domain rule functions from `@atlas/domain` where applicable

### dto/create-{entity}.dto.ts and dto/update-{entity}.dto.ts
- Use class-validator decorators for validation
- Match field types from the domain model
- Mark optional fields with @IsOptional()

### dto/{entity}-query.dto.ts
- Pagination params: offset, limit
- Filter params specific to the entity

### {entity-name}.controller.spec.ts
- Basic test setup with Test module
- Test each endpoint returns expected status codes

## Constraints

- Follow the Controller → Service → Prisma pattern exactly
- Import domain types from `@atlas/domain`
- Use NestJS built-in exceptions for error handling
- Pagination returns `{ data, total, offset, limit }`
- Register the new module in `app.module.ts`
