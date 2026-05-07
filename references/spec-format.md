# Spec Format

Xiro writes scenario documents in this order:

```text
project.md -> spec.md -> phases/{N}-{slug}/requirements.md -> phases/{N}-{slug}/design.md -> phases/{N}-{slug}/slices.md -> gold-tests.md
```

Feature-root files are `project.md`, `spec.md`, `gold-tests.md`, and `shared.md`. Phase files are never flat at the feature root.

Use these concrete templates when creating documents:

- `templates/spec.md`
- `templates/requirements.md`
- `templates/design.md`
- `templates/slices.md`

## `spec.md`

Purpose: top-level feature source of truth.

Required structure:

```markdown
# Spec: {feature}

## Summary
- Goal:
- Scope mode:
- Non-goals:
- Active modules:
- Critical constraints:
- Phase outline:
- Gold-test candidates:

## Problem

## Users and Must-Work Journeys

## Non-Goals

## Module Matrix

## Critical Constraints

## Phase Plan

## Gold-Test Candidates
```

Rules:

- Keep the summary short and stable.
- Phase names should be user-visible milestones.
- Do not plan skipped modules.
- Do not omit active modules.

## `requirements.md`

Purpose: phase-scoped BDD scenarios.

Path: `.xiro/{feature}/phases/{N}-{slug}/requirements.md`

Each scenario uses:

```markdown
### Scenario S1: {title}

**Goal**: {why this behavior matters}
**Actors**: {who}

**GIVEN**
- {precondition}

**WHEN**
- {trigger}

**THEN**
- S1.T1 {observable outcome}
- S1.T2 {observable outcome}
```

Rules:

- `GIVEN` is preconditions.
- `WHEN` is one trigger.
- `THEN` is observable outcome.
- Every `THEN` gets a stable ID.
- Oversized `THEN`s are split before implementation.

## `design.md`

Purpose: technical approach for the phase.

Path: `.xiro/{feature}/phases/{N}-{slug}/design.md`

Required structure:

```markdown
# Design: Phase N — {name}

## Spec Summary

## Overview

## Scenario Mapping

## Interfaces and Data Flow

## State and Failure Handling

## Verification Strategy
```

Rules:

- Map design choices to scenarios.
- Do not invent scope not present in `project.md` or `spec.md`.
- Include mock/real boundaries when fixtures or providers are involved.

## `slices.md`

Purpose: implementation contract for Coder workers.

Path: `.xiro/{feature}/phases/{N}-{slug}/slices.md`

This is not a tester-only document. It tells Coders what to build and how completion will be proven.

Required opening:

```markdown
# Implementation Slices: Phase N — {name}

Coder workers implement code and tests until these acceptance proofs pass. Do not only run verification.
```

Slice shape:

```markdown
- [ ] S1.T1 {short outcome}
  - Scenario: S1
  - Build outcome: {what must exist after implementation}
  - Repo: auto
  - Depends: none
  - Surface: web-ui | api | cli | worker | data | deployment
  - Scope Mode: usable-local
  - Activated Module: UI verification
  - Evidence Class: local-integration
  - Mock Allowed: no
  - Real Path Required: yes
  - Boundary Claim: {what this evidence may claim}
  - Current repo assumptions to inspect:
    1. {file, package, route, or existing behavior to verify before editing}
  - Implementation guidance:
    1. {target behavior, not a blind patch recipe}
  - Acceptance assertions:
    - {observable assertion}
  - Acceptance Proof: `{command}` exits 0
  - Evidence: `.xiro/{feature}/evidence/phase-N/slices/S1.T1/verify.log`
```

Rules:

- Use build-outcome language instead of verification-only goal language.
- Include repo assumptions so Coders inspect before editing.
- Guidance is a target, not a blind patch recipe.
- Acceptance proof must be executable or explicitly manual.
- Evidence class must match the claim.

## `gold-tests.md`

Purpose: end-to-end business acceptance.

Gold tests must state:

- Business journey
- Scope mode
- Evidence class
- Steps
- Expected outcome
- Acceptance proof

Gold tests are add-only by default.
