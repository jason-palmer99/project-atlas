---
description: "Use when writing Architecture Decision Records (ADRs). Covers the standard ADR format, numbering convention, and when to create a new ADR."
applyTo: "docs/adr/**/*.md"
---

# ADR Format

## File Naming
`ADR-NNN-short-description.md` — zero-padded three-digit number, kebab-case description.

Example: `ADR-007-database-selection.md`

## Template

```markdown
# ADR-NNN: Title

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-NNN]

## Context

What is the issue we're seeing? What forces are at play?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or harder because of this change?

**Benefits:**
- ...

**Drawbacks:**
- ...

**Mitigations:**
- ...

## Alternatives Considered

### Alternative 1
Why it was rejected.

### Alternative 2
Why it was rejected.
```

## When to Create an ADR

Create a new ADR when:
- Choosing between multiple viable technical approaches
- Making a decision that affects multiple packages or services
- Establishing a pattern that future code should follow
- Changing a previous architectural decision (supersede the old ADR)

Do NOT create an ADR for:
- Routine implementation choices
- Bug fixes
- Minor refactors within established patterns
