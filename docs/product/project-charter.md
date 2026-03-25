# Project Atlas — Project Charter

## Purpose

Project Atlas is a centralized software catalog platform that collects telemetry from multiple sources and correlates it with governance and risk artifacts. It provides a trusted, searchable, and explainable view of all software running in the organization.

## V1 Goals

Users should be able to see:

- Which software is **sanctioned**
- Which software is **unsanctioned but running**
- Which software titles have a corresponding **Quality Needs Assessment (QNA)**
- Which software titles have a corresponding **vendor risk assessment**
- Which software titles have **missing governance evidence**

## Core V1 User Questions

1. What software is currently running in the organization?
2. Which software titles are approved and sanctioned?
3. Which software titles are running but not sanctioned?
4. Which software titles have a QNA on file?
5. Which software titles have a vendor risk assessment on file?
6. Which software titles are missing required evidence?

## Personas

### Cybersecurity Analyst
Needs to identify unsanctioned software that is actively running so they can prioritize review and remediation.

### Governance Stakeholder
Needs to identify software titles missing a QNA so they can close compliance gaps.

### Risk Stakeholder
Needs to filter software by vendor risk assessment status to identify unmanaged exposure.

### Catalog Administrator
Needs to manually review low-confidence matches so the catalog remains trustworthy and accurate.

### Engineer
Needs to see source provenance for each software record to understand where evidence came from.

## Success Metrics

| Metric | Description |
|--------|-------------|
| Catalog coverage | Percentage of observed software mapped to canonical titles |
| Unmatched observation rate | Percentage of telemetry observations without a catalog match |
| Evidence completeness rate | Percentage of catalog titles with all required governance evidence |
| Telemetry freshness | Time since last successful ingestion per source |
| Time to identify unsanctioned software | Duration from first observation to surfacing in catalog |
| Manual review queue size | Number of low-confidence matches awaiting human review |

## In Scope (V1)

- Multi-source telemetry ingestion
- Canonical software title normalization
- Catalog record creation and maintenance
- Governance evidence linkage (QNA, vendor risk assessments)
- Status classification rules (sanctioned, unsanctioned, pending, blocked)
- Search and filtering UI
- Audit trail for status changes
- Manual review queue for ambiguous matches

## Out of Scope (V1)

- Procurement workflows
- License optimization
- Full CMDB replacement
- Predictive analytics
- Broad workflow automation outside catalog creation
- Complex approvals beyond basic status logic

## Alpha Milestone

Deliver one end-to-end slice:

1. Ingest one telemetry source (CSV)
2. Normalize observed titles
3. Create canonical software records
4. Attach at least one type of governance evidence
5. Show software status in the UI

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript (full-stack) |
| API | NestJS |
| Database | PostgreSQL |
| ORM | Prisma |
| Frontend | React + Vite |
| Monorepo | Turborepo + pnpm workspaces |
| Local infra | Docker Desktop (PostgreSQL) |

## Related Documents

- [Domain Model](../architecture/domain-model.md)
- [Context Diagram](../architecture/context-diagram.md)
- [ADR Index](../adr/)
