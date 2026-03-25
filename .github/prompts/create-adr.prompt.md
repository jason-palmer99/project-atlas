---
description: "Generate an Architecture Decision Record (ADR) following the Project Atlas template. Use when creating a new ADR."
---

# Create ADR

Generate an Architecture Decision Record for Project Atlas.

## Inputs

- **ADR Number**: The next sequential number (check `docs/adr/` for the latest)
- **Title**: Short descriptive title for the decision
- **Context**: What problem or choice are we facing?

## Instructions

1. Read the existing ADRs in `docs/adr/` to determine the next number
2. Read `.github/instructions/adr.instructions.md` for the format template
3. Create the file at `docs/adr/ADR-{NNN}-{kebab-case-title}.md`
4. Follow this structure:
   - **Status**: Accepted (unless explicitly told otherwise)
   - **Context**: Explain the forces, constraints, and why a decision is needed
   - **Decision**: State what we decided and key details of the approach
   - **Consequences**: Benefits, drawbacks, and mitigations
   - **Alternatives Considered**: At least 1-2 alternatives with reasons for rejection
5. Keep language concise and direct. Write for a technical audience.

## Constraints

- Reference the Project Atlas domain model and architecture where relevant
- Align with existing ADRs — don't contradict accepted decisions
- Include concrete details, not vague platitudes
