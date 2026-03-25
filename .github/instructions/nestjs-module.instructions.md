---
description: "Use when writing NestJS controllers, services, modules, or DTOs in the API app. Covers module structure, validation, Prisma injection, pagination, error handling, and swagger decorators."
applyTo: "apps/api/src/**/*.ts"
---

# NestJS Module Conventions

## Module Structure
One module per domain entity:
```
src/<entity>/
  <entity>.module.ts      — Module definition
  <entity>.controller.ts  — HTTP endpoints
  <entity>.service.ts     — Business logic + Prisma queries
  dto/
    create-<entity>.dto.ts
    update-<entity>.dto.ts
    <entity>-query.dto.ts  — Pagination/filter params
```

## Controller → Service → Prisma Pattern
- Controllers handle HTTP concerns only (params, query, body, response codes)
- Services contain business logic and Prisma calls
- Never import PrismaClient directly in controllers

## DTOs and Validation
- Use `class-validator` decorators on all DTOs: `@IsString()`, `@IsUUID()`, `@IsEnum()`, `@IsOptional()`
- Use `class-transformer` with `@Transform()` for type coercion
- Enable `ValidationPipe` globally with `whitelist: true` and `transform: true`

## Pagination
Use limit/offset query parameters:
```typescript
@IsOptional() @IsInt() @Min(0) offset?: number = 0;
@IsOptional() @IsInt() @Min(1) @Max(100) limit?: number = 20;
```

Return format: `{ data: T[], total: number, offset: number, limit: number }`

## Error Handling
- Use NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, `ConflictException`
- Never throw raw errors or return manual error objects
- Let the global exception filter handle formatting

## Domain Rules
- Business rules belong in `packages/domain` or `packages/rules-engine`, NOT in controllers or services
- Services call rule functions from those packages and act on results
