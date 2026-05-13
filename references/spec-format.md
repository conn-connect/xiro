# Spec Format

Xiro writes scenario documents in this order:

```text
project.md -> brief.md -> spec.md -> plan.md -> phase docs -> agent/*.json -> gold-tests.md -> state.md
```

Feature-root human files include `project.md`, `brief.md`, `spec.md`, `plan.md`, `state.md`, `decisions.md`, `gold-tests.md`, and `shared.md`. Worker execution contracts live under `agent/`. Phase files are never flat at the feature root.

Use these concrete templates when creating documents:

- `templates/brief.md`
- `templates/decisions.md`
- `templates/spec.md`
- `templates/plan.md`
- `templates/requirements.md`
- `templates/design.md`
- `templates/slices.md`
- `templates/agents.json`
- `templates/slices.json`
- `templates/evidence.json`
- `templates/events.jsonl`
- `templates/state.md`

## `/xiro spec` Generation Order

`/xiro spec` creates planning, scenario, and execution-contract artifacts only. It must not implement product behavior or automatically run the generated contracts.

1. Run the spec-readiness gate.
2. Generate or refresh `brief.md` if needed.
3. Generate `spec.md`.
4. Generate human-readable `plan.md`.
5. Generate phase `requirements.md` and `design.md`.
6. Generate `agent/slices.json`.
7. Generate `agent/agents.json` if missing.
8. Initialize `agent/evidence.json`.
9. Generate optional `slices.md` projections for readability.
10. Generate `gold-tests.md`.
11. Update `state.md` as `planned but not implemented`.

`plan.md` is not a projection of `agent/slices.json`. It is the human-readable completion plan. `agent/slices.json` is the worker execution contract derived from intent and design authority.

## `/xiro spec` Boundary

Allowed outputs:

- refresh `brief.md`
- `spec.md`
- `plan.md`
- phase `requirements.md` and `design.md`
- optional phase `slices.md` projections
- `agent/agents.json`
- `agent/slices.json`
- `agent/evidence.json`
- optional `agent/events.jsonl`
- `gold-tests.md`
- updated `state.md`

Forbidden outputs:

- app directories
- package files
- product code
- implementation tests
- routes
- database schemas
- runtime config
- package installation
- server startup
- Coder or Tester worker execution
- acceptance proof execution as a completion claim

After `/xiro spec`, stop. It may recommend `/xiro run <feature>` as the next command, but it must not run it.

## `brief.md`

Purpose: concise human-readable goal and scope.

Required structure:

```markdown
# Brief: {feature}

## Goal
## Scope
## Users
## Must-Work Journeys
## Key Decisions
## Key Risks
## Read Next
```

Rules:

- Keep it short enough for a user to reorient quickly.
- Do not include implementation minutiae.
- Use it as an intent summary, not the intent source and not evidence.

## `spec.md`

Purpose: top-level scenario and scope specification derived from the project contract and latest explicit user instruction.

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

## `plan.md`

Purpose: human-readable phase plan and test plan.

Required structure:

```markdown
# Plan: {feature}

## Current Goal
## Phase Plan
## Test Plan
## Decisions Needed
## Agent Contract Status
```

Rules:

- Explain user-visible outcomes.
- Separate blocking and non-blocking decisions.
- Do not claim implementation or test success.
- Do not duplicate the full worker contract.

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

## `agent/slices.json`

Purpose: canonical worker execution contract.

Path: `.xiro/{feature}/agent/slices.json`

Required concepts:

- contract version
- source authority files
- generation hashes or timestamps for stale-contract detection
- slice id and stable `THEN` id
- owner role
- dependencies
- surface and reachability
- scope mode and activated module
- evidence class
- mock boundary and real-path requirement
- boundary claim
- build outcome
- repo assumptions to inspect
- implementation guidance
- acceptance assertions
- acceptance proof
- evidence artifact path

Rules:

- Use build-outcome language instead of verification-only goal language.
- Include repo assumptions so Coders inspect before editing.
- Guidance is a target, not a blind patch recipe.
- Acceptance proof must be executable or explicitly manual.
- Evidence class must match the claim.
- Regenerate or revise when intent or design authority changes.

## `slices.md`

Purpose: optional readable projection of `agent/slices.json`.

Path: `.xiro/{feature}/phases/{N}-{slug}/slices.md`

This is not the primary human control surface. It must not become the progress dashboard. Use `state.md` for status and `agent/slices.json` for worker execution.

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

- Keep it aligned with `agent/slices.json`.
- Use it only for readability.
- Do not use it to override intent authority, design authority, execution authority, or raw evidence.

## `state.md`

Purpose: primary human status and claim review document.

Required structure:

```markdown
# Xiro State: {feature}

## Current Claim
## Current Work
## Evidence Status
## Warnings
## User Decision Required
## Recent Events
```

Rules:

- Lead with what can and cannot honestly be claimed.
- Include strongest evidence class achieved.
- Separate blocking and non-blocking user decisions.
- Set `Safe to continue automatically` to `no` if a blocking decision exists.
- After `/xiro spec`, say contracts are generated but no implementation, proof, or runtime reachability has been verified.

## `agent/evidence.json`

Purpose: index of evidence artifacts.

Rules:

- It is not evidence by itself.
- Each entry must point to raw artifacts under `evidence/`.
- Missing raw artifacts mean the claim is unproven.

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
