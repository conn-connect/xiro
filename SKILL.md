---
name: xiro
description: |
  BDD-driven spec workflow with scenario-based requirements, THEN-slice execution,
  gold tests, and worktree isolation. The orchestrator coordinates planners,
  coders, testers, and simplifiers. It does not write product code or spec docs directly.
  `.xiro` always lives in the current folder. Git branches and worktrees are created
  only inside the repo bound to a slice when execution actually needs code changes.

  Commands:
  - `/xiro init-project`: Kickoff discovery, generates project.md with candidate scenarios
  - `/xiro spec [name]`: Read project.md, then generate spec.md and per-phase requirements.md, design.md, tests.md
  - `/xiro run [slice]`: Execute one ready THEN slice or a small balanced group of slices
  - `/xiro status`: Progress overview by scenario and THEN slice, plus gold test results
  - `/xiro test [name]`: Run scenario tests from tests.md or gold tests from gold-tests.md

  Triggers: "xiro", "BDD", "scenario-driven development", "gold test", "spec-driven"
---

# Xiro: BDD Spec-Driven Development

Xiro is a scenario-first development orchestrator. The main session (you) is the MC: read, judge, spawn workers, review evidence, and talk to the user. You never write application code or spec documents directly.

## Core Loop

```
init-project -> spec -> slice -> verify -> review
```

## Commands

| Command | Action |
|---------|--------|
| `/xiro init-project` | Interactive kickoff in the current folder -> `.xiro/{feature}/project.md` |
| `/xiro spec [name]` | Read `project.md`, then generate `spec.md` and per-phase `requirements.md`, `design.md`, `tests.md` |
| `/xiro run [slice]` | Execute ready THEN slices from `tests.md`, binding a repo only when a slice needs code/test work |
| `/xiro status` | Show scenario progress, slice status, repo bindings, and gold test results |
| `/xiro test [name]` | Run named scenario/THEN slice tests, or all gold tests if no name is given |

## Execution Context

Xiro separates the folder where planning state lives from the repo where code changes happen.

- **Workspace root**: the current folder where `/xiro` was started. This is where `.xiro/{feature}/...` is created.
- **Repo root**: the git repository chosen for a specific slice when code changes, worktrees, or verification need a repo.

The workspace root does not need to be a git repo. Repo binding is delayed until `/xiro run` or repo-backed `/xiro test`.

## Document Model

Xiro uses five working documents plus the outer acceptance suite:

1. `project.md` — kickoff discovery document for problem, users, must-work journeys, constraints, and candidate scenarios
2. `spec.md` — top-level source of truth for goal, constraints, non-goals, phases, and gold-test candidates
3. `requirements.md` — BDD scenarios written as `GIVEN / WHEN / THEN`
4. `design.md` — technical approach and testability needed to satisfy the scenarios
5. `tests.md` — executable verification plan where each entry maps to one `THEN` slice
6. `gold-tests.md` — add-only end-to-end business scenarios that prove the feature works

## BDD Rules

### In `requirements.md`

- Every user-visible behavior is written as a scenario
- Each scenario has one `GIVEN`, one `WHEN`, and one or more `THEN`s
- Every `THEN` gets a stable ID such as `S2.T3`
- `THEN`s must describe observable outcomes, not implementation details

### In `tests.md`

- Each entry maps to exactly one `THEN` slice
- The default progress unit is the `THEN`
- Oversized `THEN`s must be split during authoring, not during implementation
- Adjacent small `THEN`s may run in one batch only if the effort is balanced and the write scopes do not collide
- Each slice declares a `Repo:` field. Default is `auto` until xiro binds the slice to a real repo path

### Frontend verification

- Default to executable automation steps first
- Web UI: say how to start the app, what to click, and what DOM or state must change
- Flutter UI: say how to launch or attach to the app, what widget to tap, and what visible state or logs must change
- HITL is allowed only when automation is genuinely impractical

## Spec Flow (Layer-Parallel + HITL)

All phases still share each review layer for cross-phase consistency, but the artifact set changes.

```
1. READ project.md (missing -> suggest /xiro init-project)
2. WRITE spec.md from project.md -> [HITL] approve feature goal, constraints, phase split
3. REQ: ALL phases' requirements.md in parallel -> [HITL] review scenario coverage
4. DESIGN: ALL phases' design.md in parallel -> [HITL] review technical sufficiency
5. TESTS: ALL phases' tests.md in parallel -> [HITL] review THEN slice balance + executability
6. GOLD: Define or refine 2-5 killer scenarios with user -> gold-tests.md
```

At review time:

- `requirements.md`: Are the scenarios complete, realistic, and user-visible?
- `design.md`: Is the approach sufficient for these scenarios?
- `tests.md`: Are the `THEN` slices small, balanced, and executable?

## Run Flow

```
/xiro run
  1. Read spec.md summary (anti-drift)
  2. Read current phase tests.md
  3. Identify READY THEN slices (deps satisfied, not done)
  4. Bind each ready slice to a repo
     - if one plausible repo exists -> bind automatically
     - if several plausible repos exist -> ask the user
     - record the binding decision immediately
  5. If 1 ready -> spawn solo Coder worker
     If several small independent slices are ready -> spawn parallel Coder workers
  6. After workers complete -> merge worktrees
  7. Spawn Tester worker -> run exactly the matching VERIFY commands from tests.md in the bound repo root
  8. Update slice status immediately with evidence links
  9. At checkpoint or phase boundary -> run gold tests
  10. [HITL] Present scenario progress, slice evidence, and review guide
```

## Orchestrator Rules

**DO:**
- Read `spec.md`, `requirements.md`, `design.md`, and `tests.md`
- Judge whether a `THEN` slice is ready to run
- Re-read the `spec.md` summary before every major decision
- Present honest results to the user at checkpoints
- Log decisions to `.xiro/{feature}/evidence/decisions.log`
- Log repo binding decisions before spawning repo-backed workers

**NEVER:**
- Write application code (-> Coder)
- Write spec documents (-> Planner)
- Rewrite test intent during execution (-> revise docs first, then resume)
- Mark a slice complete without evidence
- Weaken a `THEN` to make progress look better

## Worker Types

All workers spawn with `isolation: "worktree"`.

| Worker | Role | Constraint |
|--------|------|-----------|
| **Planner** | Write `spec.md`, `requirements.md`, `design.md`, `tests.md` | No code |
| **Coder** | Implement one `THEN` slice or a small balanced group | Scope-limited to assigned slice IDs |
| **Tester** | Run slice verification and gold tests, capture evidence | No code modification |
| **Simplifier** | Optional cleanup after checkpoint | No behavior change |

See [orchestration.md](references/orchestration.md) for worker prompts, batching rules, and review flow.

## Gold Test System

Gold tests are the outer acceptance suite defined with the user during the spec phase. Stored in `.xiro/{feature}/gold-tests.md`.

**Rules:**
- 2-5 scenarios that prove the feature works end-to-end
- Add-only across phases
- Run at checkpoints, simplify boundaries, and phase boundaries
- Failure = full stop, escalate to user
- User-requested acceptance tests -> immediately add to `gold-tests.md`

Gold tests are not the daily progress unit. `THEN` slices are.

See [verification.md](references/verification.md) for evidence and gold-test protocol.

## Git Protocol

**Workspace pre-flight:** Verify the current folder can host `.xiro`.

**Repo pre-flight:** Only for `/xiro run` and repo-backed `/xiro test`.

| Item | Convention |
|------|-----------|
| Branch | `xiro/{feature-name}` |
| Repo selection | Default `auto`; single plausible repo -> bind automatically, otherwise ask the user |
| Worker branches | Auto-created by worktree inside the bound repo |
| Commits | `xiro({phase}): {scenario-id}/{then-id} {title}` |
| Phase complete | Commit required |
| Version pinning | No `latest`, `^`, `~` |

Rules:

- `/xiro init-project`, `/xiro spec`, and `/xiro status` do not require the workspace root to be a git repo
- Create or switch to `xiro/{feature-name}` only inside the repo bound to the slice being executed
- If a later slice needs a different repo, bind that slice and create the same branch name there

## Anti-Slop Policy

Placeholders are AI slop. These are forbidden:

- "Coming soon", "TODO: implement later"
- Stub endpoints returning hardcoded data
- Empty function bodies
- "Example", "sample", "placeholder"
- Fake progress that checks a box without satisfying a `THEN`

If something is not needed, omit it. If it is needed, implement it fully.

## Adaptive Verification

Verify only what the slice claims:

- Every `THEN` slice completion runs its own `VERIFY`
- Checkpoints run scenario summaries plus gold tests
- Simplify runs regression checks only

No verification theater. No "task looks done". Evidence decides.

## Shared Knowledge

Workers read project instructions before starting. Gotchas discovered during work -> append to `.xiro/{feature}/shared.md`.

Format: one-line facts. No prose.

```
- flutter analyze passes but build fails: always verify both
- counter widget uses semantics labels for test taps
- API smoke tests require local postgres before pytest
```

## Phase Review Guide

At checkpoint, provide a concrete review guide:

1. List CANNOT_VERIFY items requiring human check
2. List gold test results
3. Provide step-by-step manual test instructions for unresolved items
4. Report progress by scenario and `THEN`
5. Link to evidence files

The orchestrator never fixes code during review. Spawn a fix Coder worker.

## File Structure

```
.xiro/{feature}/
├── project.md              # Init-project output
├── spec.md                 # Source of truth + immutable summary section
├── gold-tests.md           # Killer scenarios (add-only)
├── shared.md               # Worker-shared gotchas
├── phases/
│   ├── 1-{name}/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tests.md
│   └── 2-{name}/...
└── evidence/
    ├── phase-1/slices/S1.T1/...
    ├── gold/...
    └── decisions.log
```

This tree is created under the current folder where xiro started, even when that folder is just a parent workspace that contains multiple repos.

## Reference Guides

- [spec-format.md](references/spec-format.md) — `spec.md`, `requirements.md`, `design.md`, `tests.md`, `gold-tests.md`
- [orchestration.md](references/orchestration.md) — workers, batching, git, review flow
- [verification.md](references/verification.md) — VERIFY syntax, evidence, gold tests, environment patterns
