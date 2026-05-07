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
new -> spec -> slice -> verify -> review
```

## Commands

| Command | Action |
| --- | --- |
| `/xiro new` | Guided interview in the current folder -> `.xiro/{feature}/project.md` |
| `/xiro spec [name]` | Convert `project.md` into `spec.md`, phase docs, implementation slices, and gold tests |
| `/xiro list` | List active xiro features in the current workspace |
| `/xiro run [feature] [slice]` | Implement the next ready slice or a selected slice |
| `/xiro status <feature>` | Show detailed scenario, slice, and evidence status |
| `/xiro test [feature] [name]` | Run acceptance proofs or gold tests for a feature |

## Document Model

Xiro stores feature-level documents at the feature root and phase-level documents under `phases/{N}-{slug}/`.

```text
.xiro/{feature}/
├── project.md
├── spec.md
├── gold-tests.md
├── shared.md
├── phases/
│   ├── 0-{phase-slug}/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── slices.md
│   └── 1-{phase-slug}/
│       ├── requirements.md
│       ├── design.md
│       └── slices.md
└── evidence/
    ├── decisions.log
    ├── phase-0/slices/
    ├── phase-1/slices/
    └── gold/
```

Use phase `0` when a real pre-foundation phase exists, such as a design/prototype shell, discovery harness, migration baseline, or other intentionally first executable phase. Otherwise start at phase `1`. Do not place phase `requirements.md`, `design.md`, or `slices.md` flat at the feature root.

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

Read these references when running `/xiro new`:

- `references/interview.md`
- `references/question-bank.md`
- `references/scope-modes.md`
- `references/module-triggers.md`
- `references/project-template.md`

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

- Plan only from facts recorded in `project.md`.
- Refuse spec generation when an active module has unresolved blocking facts.
- Generate user-visible phases, not implementation-layer phases.
- Create one directory per phase under `.xiro/{feature}/phases/{N}-{slug}/`.
- Write BDD scenarios with stable `THEN` IDs.
- Write `slices.md` as implementation work, not tester-only work.
- Write gold tests that match the selected scope mode.

Read:

- `references/spec-format.md`
- `references/spec-readiness.md`
- `references/gold-tests.md`

## `/xiro run`

`/xiro run` implements slices. It does not merely run tests.

Rules:

- Resolve the feature and ready slice before spawning workers.
- Every implementation slice must be assigned to a Coder worker/subagent. Direct implementation in the main session is forbidden.
- Give Coder workers the assigned slice as an implementation contract.
- Coder workers inspect the repo, implement code and tests as needed, and make the acceptance proof pass without weakening intent.
- Tester workers run the acceptance proof independently and capture evidence.
- If no worker/subagent facility is available, stop and report `BLOCKED: worker/subagent unavailable` instead of coding directly.
- Do not mark a slice complete without evidence.
- Do not use weaker evidence to claim stronger completion.
- Passing every slice proof and gold test is not enough for final completion if the must-work journey is not reachable through the intended UI, API, tool registry, orchestrator, CLI, or runtime entrypoint.
- Before final completion, confirm the user can perform the promised workflow in the intended runtime path; if not, add or revise slices instead of reporting completion.
- At checkpoints, report what works, what is fake or unavailable, how the user can test it, and where evidence lives.

Read:

- `references/orchestration.md`
- `references/verification.md`
- `references/evidence-policy.md`
- `references/change-triage.md`

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

- Planner writes spec documents.
- Coder implements assigned slices.
- Tester runs acceptance proofs and captures evidence.
- Simplifier cleans up after checkpoints without changing behavior.

The orchestrator may read files, select slices, prepare worker prompts, review or integrate worker output, and update xiro planning/evidence docs. It must not patch product code, add implementation tests, or act as the Coder itself during `/xiro run`.

The orchestrator may revise planning docs when scope changes, but it must not weaken failed acceptance criteria to make progress look complete.
