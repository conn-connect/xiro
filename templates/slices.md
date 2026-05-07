# Implementation Slices: Phase {N} — {name}

Coder workers implement code and tests until these acceptance proofs pass. Do not only run verification.

## Spec Summary

> Copy the `spec.md` summary here.

## Verification Environment

| Purpose | Command | Expected |
| --- | --- | --- |
| {purpose} | `{command}` | exits 0 |

## Scenario Progress

| Scenario | THEN slices | Status |
| --- | --- | --- |
| S1 | S1.T1, S1.T2 | 0/2 complete |

## Implementation Slices

- [ ] **S1.T1**: {short observable outcome}
  - Scenario: S1
  - Build outcome: {what must exist after implementation}
  - Repo: `auto`
  - Depends: none
  - Surface: {web-ui/api/cli/worker/data/deployment}
  - Reachability: {UI/API/tool registry/orchestrator/CLI/service entrypoint that invokes this behavior}
  - Scope Mode: `{scope}`
  - Activated Module: {module}
  - Evidence Class: {class}
  - Mock Allowed: {yes/no/only for contract}
  - Real Path Required: {yes/no}
  - Boundary Claim: {what this evidence may honestly claim}
  - Current repo assumptions to inspect:
    1. {existing file, command, route, package, or behavior to inspect before editing}
  - Implementation guidance:
    1. {target behavior; adapt to repo reality while preserving acceptance intent}
  - Acceptance assertions:
    - {observable assertion}
  - Acceptance Proof: `{command}` exits 0
  - Evidence: `.xiro/{feature}/evidence/phase-{N}/slices/S1.T1/verify.log`

- [ ] **S1.T2**: {short observable outcome}
  - Scenario: S1
  - Build outcome: {what must exist after implementation}
  - Repo: `auto`
  - Depends: S1.T1
  - Surface: {surface}
  - Reachability: {runtime entrypoint that invokes this behavior}
  - Scope Mode: `{scope}`
  - Activated Module: {module}
  - Evidence Class: {class}
  - Mock Allowed: {yes/no/only for contract}
  - Real Path Required: {yes/no}
  - Boundary Claim: {what this evidence may honestly claim}
  - Current repo assumptions to inspect:
    1. {inspect before editing}
  - Implementation guidance:
    1. {target behavior}
  - Acceptance assertions:
    - {observable assertion}
  - Acceptance Proof: `{command}` exits 0
  - Evidence: `.xiro/{feature}/evidence/phase-{N}/slices/S1.T2/verify.log`
