# Implementation Slices: Phase {N} — {name}

{In the user's active language: readable projection of `agent/slices.json`.}

{In the user's active language: coder workers implement code and tests until these acceptance proofs pass. Do not only run verification. `agent/slices.json` is the canonical worker execution contract; `state.md` is the primary human progress document. This file is not a runnable execution contract by itself.}

## Spec Summary

> {In the user's active language: copy the `spec.md` summary here.}

## Verification Environment

| Purpose | Command | Expected |
| --- | --- | --- |
| {In the user's active language: purpose} | `{command}` | exits 0 |

## Scenario Progress

| Scenario | THEN slices | Status |
| --- | --- | --- |
| S1 | S1.T1, S1.T2 | 0/2 complete |

## Implementation Slices

- [ ] **S1.T1**: {In the user's active language: short observable outcome}
  - Scenario: S1
  - Build outcome: {In the user's active language: what must exist after implementation}
  - Repo: `auto`
  - Depends: none
  - Surface: {web-ui/api/cli/worker/data/deployment}
  - Reachability: {In the user's active language: UI/API/tool registry/orchestrator/CLI/service entrypoint that invokes this behavior}
  - Scope Mode: `{scope}`
  - Activated Module: {module}
  - Evidence Class: {class}
  - Mock Allowed: {yes/no/only for contract}
  - Real Path Required: {yes/no}
  - Boundary Claim: {In the user's active language: what this evidence may honestly claim}
  - Current repo assumptions to inspect:
    1. {In the user's active language: existing file, command, route, package, or behavior to inspect before editing}
  - Implementation guidance:
    1. {In the user's active language: target behavior; adapt to repo reality while preserving acceptance intent}
  - Acceptance assertions:
    - {In the user's active language: observable assertion}
  - Acceptance Proof: `{command}` exits 0
  - Evidence: `.xiro/{feature}/evidence/phase-{N}/slices/S1.T1/verify.log`

- [ ] **S1.T2**: {In the user's active language: short observable outcome}
  - Scenario: S1
  - Build outcome: {In the user's active language: what must exist after implementation}
  - Repo: `auto`
  - Depends: S1.T1
  - Surface: {surface}
  - Reachability: {In the user's active language: runtime entrypoint that invokes this behavior}
  - Scope Mode: `{scope}`
  - Activated Module: {module}
  - Evidence Class: {class}
  - Mock Allowed: {yes/no/only for contract}
  - Real Path Required: {yes/no}
  - Boundary Claim: {In the user's active language: what this evidence may honestly claim}
  - Current repo assumptions to inspect:
    1. {In the user's active language: inspect before editing}
  - Implementation guidance:
    1. {In the user's active language: target behavior}
  - Acceptance assertions:
    - {In the user's active language: observable assertion}
  - Acceptance Proof: `{command}` exits 0
  - Evidence: `.xiro/{feature}/evidence/phase-{N}/slices/S1.T2/verify.log`
