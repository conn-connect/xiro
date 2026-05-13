---
name: xiro
description: |
  Scenario-driven development workflow that turns a rough product idea into a scoped
  project contract, BDD scenarios, implementation slices, acceptance proofs, and
  gold tests. Use when the user asks for xiro, scenario-driven development,
  spec-driven implementation, gold tests, or phase-based feature delivery.
metadata:
  short-description: Scenario-driven project planning and verified implementation
---

# Xiro

Xiro helps turn a rough product idea into a clear build contract, testable user journeys, and implementation slices that can be verified honestly.

The main session is the MC/orchestrator: interview the user, keep scope honest, resolve slices, spawn workers/subagents, review evidence, and explain progress. During `/xiro run`, it does not write application code or implementation tests directly.

## Core Loop

```text
new -> spec -> execute -> verify -> review -> salvage when needed
```

## Commands

| Command | Action |
| --- | --- |
| `/xiro new` | Guided interview in the current folder -> `.xiro/{feature}/project.md`, `brief.md`, and initial `state.md` |
| `/xiro spec [name]` | Convert the project contract into human plan docs, agent execution contracts, phase docs, and gold tests |
| `/xiro list` | List active xiro features in the current workspace |
| `/xiro run [feature] [slice]` | Implement the next ready slice or a selected slice |
| `/xiro status <feature>` | Show detailed scenario, slice, and evidence status |
| `/xiro test [feature] [name]` | Run acceptance proofs or gold tests for a feature |
| `/xiro salvage <feature>` | Diagnose drift or bloated output and propose a smaller human restart surface without mutating existing docs |

## Phase Boundaries

Xiro commands are phase-bound. A command may create only artifacts for its own phase and must not automatically advance to the next Xiro phase.

If the active phase is `/xiro new` or `/xiro spec` and the user says "implement the plan", interpret that as "create the artifacts for the current Xiro phase only." Do not proceed to `/xiro spec`, `/xiro run`, product scaffolding, or product implementation unless the user explicitly asks for that next Xiro command after the current phase artifacts exist.

If a phase boundary is crossed, stop with `BLOCKED: xiro phase boundary violation`.

## Document Model

Xiro separates the human control surface from worker execution. Human-facing files are the primary readable control surface. Agent JSON files are canonical only for worker execution, not product intent.

```text
.xiro/{feature}/
├── project.md
├── brief.md
├── spec.md
├── plan.md
├── state.md
├── decisions.md
├── gold-tests.md
├── shared.md
├── agent/
│   ├── agents.json
│   ├── slices.json
│   ├── evidence.json
│   └── events.jsonl
├── phases/
│   ├── 0-{phase-slug}/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── slices.md
│   └── 1-{phase-slug}/
│       ├── requirements.md
│       ├── design.md
│       └── slices.md
├── evidence/
│   ├── phase-0/slices/
│   ├── phase-1/slices/
│   └── gold/
└── salvage/
    └── {timestamp}/
        ├── salvage-report.md
        ├── proposed-brief.md
        ├── proposed-plan.md
        └── proposed-state.md
```

Use phase `0` when a real pre-foundation phase exists, such as a design/prototype shell, discovery harness, migration baseline, or other intentionally first executable phase. Otherwise start at phase `1`. Do not place phase `requirements.md`, `design.md`, or `slices.md` flat at the feature root.

## Authority Model

Xiro uses domain-specific authority, not a single global source of truth.

### Intent Authority

The source of truth for what should be built:

1. Latest explicit user instruction.
2. `project.md`.
3. `spec.md`.
4. `phases/{N}-{slug}/requirements.md`.

`brief.md` is a human-readable projection of intent. It must not override or weaken the intent authority.

### Design Authority

The source of truth for how it should be built:

1. `phases/{N}-{slug}/design.md`.
2. Design sections in `spec.md`.
3. Recorded decisions.

`plan.md` is a human-readable roadmap. It must not introduce design decisions that are absent from design authority.

### Execution Authority

The source of truth for what workers execute:

1. `agent/slices.json`.
2. `agent/agents.json`.

`agent/*.json` is canonical only for worker execution. It must not override intent or design authority.

### Claim Authority

The source of truth for what can honestly be claimed:

1. Raw evidence artifacts under `evidence/`.
2. Tester results.
3. `state.md`.
4. The No Upclaim Rule.

`state.md` is the human claim ledger and an orchestration gate. It must not weaken scope, remove active modules, alter acceptance criteria, or upgrade evidence claims. If `state.md` says execution is not safe to continue, `/xiro run` must block.

`agent/evidence.json` is an index of evidence artifacts; it is not evidence by itself.

## Human Read Order

Users should be able to understand a feature without reading worker contracts:

1. `brief.md` - what is being built and why.
2. `state.md` - what can honestly be claimed now.
3. `plan.md` - the readable path to completion.
4. `evidence/` - artifacts that prove claims.

`slices.md` may be generated as a readable projection, but it must not be the primary control surface or a runnable execution contract. `state.md` is the primary human status document. `agent/slices.json` is the canonical worker execution contract once generated.

## `/xiro new`

Start with a quick environment scan, then interview from broad to narrow.

Rules:

- Use `AskUserQuestion` for interview questions when the host provides it. If the host uses a different structured question tool, use that equivalent. Fall back to plain chat questions only when no structured question tool is available or the question cannot reasonably be expressed as choices.
- Ask 1-2 short question screens at a time.
- Prefer multiple-choice questions with short descriptions.
- Always allow a freeform answer.
- Ask broad product, user, journey, and scope questions before technical detail.
- Always establish `Scope Mode`.
- Activate technical modules only when the user's answers or repo signals require them.
- Record skipped modules with a reason instead of silently omitting them.
- Create or refresh `brief.md` from the confirmed project contract.
- Initialize `state.md` with honest claims: interview/project contract exists, implementation has not started, no acceptance proof has passed.
- Create only `/xiro new` artifacts: `project.md`, `brief.md`, `state.md`, and optional `decisions.md`.
- Do not create spec artifacts, agent contracts, phase docs, gold tests, product files, app scaffolds, packages, routes, schemas, runtime config, implementation tests, or run servers.
- Stop after the new artifacts exist. Recommend `/xiro spec <feature>` only as the next command; do not run it.

Read these references when running `/xiro new`:

- `references/interview.md`
- `references/question-bank.md`
- `references/scope-modes.md`
- `references/module-triggers.md`
- `references/project-template.md`
- `references/human-control-surface.md`
- `references/phase-boundaries.md`

When the user asks to move fast with defaults, also read `references/just-build-it.md`.

## Scope Modes

Every feature must choose one scope mode:

- `mockup-prototype` - visual flow and clickable interaction proof; fixture or local state may be enough.
- `usable-local` - core journeys work locally with real behavior where the selected journeys require it.
- `production-ready` - deployable product with security, persistence, runtime, observability, and real unavailable states where relevant.

The scope mode controls what xiro may plan. Do not add production work to a mockup unless the user asks. Do not omit production safety from a production-ready project.

## Activated Modules

`project.md` must include a module matrix. Each module is `active`, `skipped`, `deferred`, or `blocking`, with a one-line reason.

Common modules:

- Auth and ownership
- Persistence and migrations
- API and realtime contracts
- Providers and external integrations
- Deployment and runtime
- Security and operations
- Source and design inheritance
- Mock, fixture, and prototype boundary
- UI verification

Read `references/module-triggers.md` before asking detailed module questions.

When source/design inheritance is active, read `references/source-and-design-intake.md`.
When UI verification is active, read `references/ui-verification.md`.

## `/xiro spec`

Before writing specs, run the spec-readiness gate in `references/spec-readiness.md`.

Rules:

- Plan only from facts recorded in `project.md`, `decisions.md`, and the latest explicit user instruction.
- Refuse spec generation when an active module has unresolved blocking facts.
- Generate user-visible phases, not implementation-layer phases.
- Generate or refresh `brief.md` before detailed planning.
- Generate `plan.md` as the human-readable phase plan before worker execution contracts.
- Create one directory per phase under `.xiro/{feature}/phases/{N}-{slug}/`.
- Write BDD scenarios with stable `THEN` IDs.
- Write `agent/slices.json` as the canonical worker execution contract.
- `slices.md`, when present, is a readable projection of `agent/slices.json`; do not use it as the primary human progress document.
- Initialize or refresh `agent/agents.json` if missing.
- Initialize or refresh `agent/evidence.json` as an artifact index only.
- Update `state.md` after spec generation with `planned but not implemented`; do not imply any slice proof passed.
- Write gold tests that match the selected scope mode.
- Do not create product files, app scaffolds, packages, routes, schemas, runtime config, implementation tests, run servers, spawn Coder/Tester workers, or execute acceptance proofs as completion claims.
- Stop after spec artifacts and planned-only `state.md` exist. Recommend `/xiro run <feature>` only as the next command; do not run it.

Read:

- `references/spec-format.md`
- `references/spec-readiness.md`
- `references/gold-tests.md`
- `references/human-control-surface.md`
- `references/agent-execution-contracts.md`
- `references/phase-boundaries.md`

## `/xiro run`

`/xiro run` implements slices. It does not merely run tests.

Rules:

- Resolve the feature and ready slice before spawning workers.
- Require the vNext control surface and execution contract before spawning workers: `project.md`, `spec.md`, `brief.md`, `plan.md`, `state.md`, `agent/agents.json`, and `agent/slices.json`.
- If required vNext files are missing, stop with `BLOCKED: missing xiro control surface` and recommend `/xiro spec <feature>` or `/xiro salvage <feature>`.
- Do not infer runnable execution from legacy `phases/*/slices.md`.
- Every implementation slice must be assigned to a Coder worker/subagent. Direct implementation in the main session is forbidden.
- Give Coder workers the assigned slice as an implementation contract.
- Coder workers inspect the repo, implement code and tests as needed, and make the acceptance proof pass without weakening intent.
- Tester workers run the acceptance proof independently and capture evidence.
- If no worker/subagent facility is available, stop and report `BLOCKED: worker/subagent unavailable` instead of coding directly.
- Do not mark a slice complete without evidence.
- Do not use weaker evidence to claim stronger completion.
- Update `state.md` at checkpoints with claim-accurate status, warnings, blocking user decisions, and whether automatic continuation is safe.
- Passing every slice proof and gold test is not enough for final completion if the must-work journey is not reachable through the intended UI, API, tool registry, orchestrator, CLI, or runtime entrypoint.
- Before final completion, confirm the user can perform the promised workflow in the intended runtime path; if not, add or revise slices instead of reporting completion.
- At checkpoints, report what works, what is fake or unavailable, how the user can test it, and where evidence lives.

Read:

- `references/orchestration.md`
- `references/verification.md`
- `references/evidence-policy.md`
- `references/change-triage.md`
- `references/human-control-surface.md`
- `references/notification-policy.md`
- `references/host-permissions.md`

## `/xiro salvage`

`/xiro salvage` recovers a readable control surface from bloated, drifted, or failed xiro output. It is diagnosis-first and non-mutating by default.

Rules:

- Create output under `.xiro/{feature}/salvage/{timestamp}/`.
- Write `salvage-report.md`, `proposed-brief.md`, `proposed-plan.md`, and `proposed-state.md`.
- Extract only confirmed facts: intended goal, confirmed decisions, observed implementation, verified behavior, unverified or suspect behavior, and drift.
- Separate `Observed in files`, `Likely implemented`, and `Verified`.
- Do not archive, replace, or delete existing docs during the first salvage pass.
- Do not generate `agent/*.json` during the first salvage pass.
- If a world-model change is detected, recommend revising the project contract/spec before implementation.

Read:

- `references/salvage.md`
- `references/change-triage.md`
- `references/human-control-surface.md`

## Evidence Classes

Every slice has an evidence class:

- `design-fixture`
- `mock-contract`
- `local-integration`
- `runtime-compose`
- `real-provider`
- `manual-production`
- `cannot-verify`

Lower evidence cannot satisfy a stronger claim. Fixture evidence cannot prove production behavior. Mock provider evidence cannot prove real provider behavior. Static config checks cannot prove runtime deployability.

## Worker Boundary

The orchestrator coordinates and reviews. Workers do focused work.

- Planner writes human planning docs and agent execution contracts.
- Coder implements assigned slices.
- Tester runs acceptance proofs and captures evidence.
- Simplifier cleans up after checkpoints without changing behavior.

The orchestrator may read files, select slices, prepare worker prompts, review or integrate worker output, and update xiro planning/evidence docs. It must not patch product code, add implementation tests, or act as the Coder itself during `/xiro run`.

The orchestrator may revise planning docs when scope changes, but it must not weaken failed acceptance criteria to make progress look complete.
