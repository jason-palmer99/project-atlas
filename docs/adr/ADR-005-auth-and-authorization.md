# ADR-005: Authentication and Authorization Approach

## Status

Accepted

## Context

Project Atlas exposes a REST API and web UI that provide access to software catalog data, governance evidence, and status decisions. This data includes information about organizational software usage, risk assessments, and compliance status.

We need an authentication and authorization approach that:
- Does not block Alpha delivery with premature complexity
- Has a clear path to production-grade security
- Protects sensitive governance and risk data
- Supports role-based access when needed

## Decision

### Alpha Phase (V1 initial)

- **No authentication enforced** for local development
- API endpoints are open on `localhost`
- A placeholder auth middleware is present but disabled by default
- Environment variable `AUTH_ENABLED=false` controls this

### Post-Alpha (V1 production)

- API key authentication as the first production auth mechanism
- API keys scoped per client/service
- Keys stored as hashed values in the database
- Rate limiting on API endpoints

### Future (V1+)

- Role-Based Access Control (RBAC) with the following suggested roles:

| Role | Permissions |
|------|------------|
| `catalog-viewer` | Read catalog, search, filter |
| `catalog-admin` | Create/update titles, manage evidence |
| `reviewer` | Review matches, approve/reject |
| `ingestion-service` | Submit telemetry observations |
| `system-admin` | Full access, manage users and roles |

- Integration with organizational identity provider (e.g., Microsoft Entra ID)
- JWT-based token validation
- Per-endpoint authorization decorators in NestJS

## Consequences

**Benefits:**
- Alpha development is unblocked — no auth overhead during initial build
- Clear upgrade path from open → API keys → RBAC → identity provider
- Placeholder middleware means auth can be enabled without code restructuring
- Role definitions are documented early for future implementation

**Drawbacks:**
- Alpha is not production-secure (acceptable for local-only development)
- API key management is manual
- RBAC implementation deferred

**Mitigations:**
- Alpha runs exclusively on localhost via Docker Desktop
- `.env` configuration makes enabling auth a single toggle
- NestJS Guards make auth easy to add per-route when ready

## Alternatives Considered

### Full RBAC from day one
Build complete role-based access control before shipping. Rejected because it delays Alpha delivery significantly and roles require real usage patterns to define correctly.

### OAuth2/OIDC immediately
Integrate with an identity provider from the start. Deferred because it requires infrastructure (IdP configuration, token endpoints) that isn't needed for local development. The NestJS Passport ecosystem makes this straightforward to add later.
