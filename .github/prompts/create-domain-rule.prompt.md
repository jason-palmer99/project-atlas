---
description: "Add a new business rule to the rules engine with an accompanying unit test. Use when creating status derivation, evidence validation, or matching rules."
---

# Create Domain Rule

Add a new business rule function to the Project Atlas domain or rules-engine package.

## Inputs

- **Rule name**: Descriptive name (e.g., deriveStatus, computeEvidenceGaps, shouldAutoApproveMatch)
- **Package**: Where it belongs — `packages/domain/src/rules/` or `packages/rules-engine/src/`
- **Description**: What the rule computes and when it applies

## Instructions

1. Read `packages/domain/src/index.ts` for available types and enums
2. Read existing rules in `packages/domain/src/rules/` or `packages/rules-engine/src/` for patterns
3. Create the rule function:

### Rule Function
- Pure function: explicit inputs → explicit outputs
- No side effects (no DB, no HTTP, no file I/O)
- Deterministic: same inputs always produce same outputs
- Include JSDoc with:
  - Description of what the rule computes
  - Parameter descriptions
  - Return value description
  - Example usage

### Unit Test
- Co-located test file: `{rule-name}.spec.ts`
- Test all enum outcomes (e.g., all 5 CatalogDecisionType values for status derivation)
- Test boundary conditions and edge cases
- Test with minimal valid inputs
- Test with missing/null optional fields

4. Export the new rule from the package's `index.ts`

## Constraints

- NO framework imports — rules must be framework-agnostic
- Take explicit typed inputs — no `any`, no untyped objects
- Return explicit typed outputs — prefer discriminated unions or typed result objects
- Follow the Project Atlas status derivation rules documented in `docs/architecture/domain-model.md`
