---
name: xiro
description: |
  Spec-driven development with layer-parallel specs, gold tests, and worktree isolation.
  Orchestrator delegates ALL work to specialized workers. Never writes code or specs directly.

  Commands:
  - `/xiro interview`: Requirements interview, generates input.md
  - `/xiro spec [name]`: Layer-parallel spec generation from input.md
  - `/xiro run [N]`: Execute tasks (auto: single or batch). N for specific task
  - `/xiro status`: Progress overview with gold test results
  - `/xiro test [name]`: Run gold tests (name optional, default: all)

  Triggers: "xiro", "spec-driven", "gold test", "verified development"
---

# Xiro: Spec-Driven Development

Xiro is a verification-first development orchestrator. The main session (you) is the MC — you read, judge, spawn workers, review, and talk to the user. You never write code or specs.

## Core Loop

```
interview → spec → run → verify → simplify
```

## Commands

| Command | Action |
|---------|--------|
| `/xiro interview` | Interactive requirements gathering → `.xiro/{feature}/input.md` |
| `/xiro spec [name]` | Generate specs from input.md. No input.md → suggest interview |
| `/xiro run [N]` | Auto-judge: 1 task → solo worker, multiple → batch. N = specific task |
| `/xiro status` | Show phases, tasks, gold test results |
| `/xiro test [name]` | Run gold tests. No name → run all |

## Spec Flow (Layer-Parallel + HITL)

All phases share each layer review, enabling cross-phase consistency.

```
1. READ input.md (missing → suggest /xiro interview)
2. SPLIT: Propose Phase structure → [HITL] approve
3. REQ: ALL phases' requirements.md in parallel → [HITL] review all
4. DESIGN: ALL phases' design.md in parallel → [HITL] review all
5. TASKS: ALL phases' tasks.md in parallel → [HITL] review all
6. GOLD: Define 2-5 killer scenarios with user → gold-tests.md
```

Each [HITL] step shows all phases side-by-side for cross-phase review.

## Run Flow

```
/xiro run
  1. Read spec-anchor.md (anti-drift)
  2. Read current phase tasks.md
  3. Identify READY tasks (deps satisfied, not done)
  4. If 1 ready → spawn solo Coder worker
     If N ready → spawn parallel Coder workers
  5. After workers complete → merge worktrees
  6. Spawn Tester worker → run all VERIFY + gold tests
  7. If checkpoint reached → spawn Simplifier → re-verify
  8. [HITL] Present results with phase review guide
```

## Orchestrator Rules

**DO:**
- Read specs, judge, coordinate workers
- Run VERIFY commands to confirm pass/fail
- Re-read spec-anchor.md before every major decision
- Present honest results to user at checkpoints
- Log decisions to `.xiro/{feature}/evidence/decisions.log`

**NEVER:**
- Write application code (→ Coder)
- Write spec documents (→ Planner)
- Update task checkboxes (→ Worker who completed it)
- Write evidence files (→ Tester)
- Modify code to fix issues (→ spawn fix Coder)

## Worker Types

All workers spawn with `isolation: "worktree"`.

| Worker | Role | Constraint |
|--------|------|-----------|
| **Planner** | Write spec documents (req/design/tasks) | No code |
| **Coder** | Implement + write test code | Scope-limited to assigned task |
| **Tester** | Run verification, capture evidence | No code modification |
| **Simplifier** | Refactor post-checkpoint | No behavior change |

See [orchestration.md](references/orchestration.md) for worker prompts and team flow.

## Gold Test System

Killer scenarios defined with the user during spec phase. Stored in `.xiro/{feature}/gold-tests.md`.

**Rules:**
- 2-5 scenarios that prove the feature works end-to-end
- Run at: checkpoint, simplify, phase boundary
- Failure = full stop, escalate to user
- Phase progression: add-only (never delete gold tests)
- User-requested tests → immediately add to gold-tests.md

See [verification.md](references/verification.md) for gold test format.

## Git Protocol

**Pre-flight:** Verify git repo exists. No repo → stop.

| Item | Convention |
|------|-----------|
| Branch | `xiro/{feature-name}` |
| Worker branches | Auto-created by worktree |
| Commits | `xiro({phase}): {task-title}` |
| Phase complete | Commit required |
| Version pinning | No `latest`, `^`, `~` |

## Anti-Slop Policy

Placeholders are AI slop. These are forbidden:
- "Coming soon", "TODO: implement later"
- Stub endpoints returning hardcoded data
- Empty function bodies
- "Example", "sample", "placeholder"

If something isn't needed, omit it. If it's needed, implement it fully.

## Adaptive Verification

Don't verify what doesn't need verification. VERIFY only at:
- Subtask completion (each subtask's VERIFY command)
- Checkpoint (VERIFY_ALL + gold tests)
- Post-simplify (regression guard)

No speculative verification. No verification theater.

## Shared Knowledge

Workers read project CLAUDE.md before starting. Gotchas discovered during work → append to `.xiro/{feature}/shared.md`.

Format: One-line facts. No prose.
```
- flutter analyze passes but build fails: always run both
- supabase RLS requires service_role key for admin operations
```

## Phase Review Guide

At checkpoint, provide a concrete review guide (not just "Phase N ready"):

1. List CANNOT_VERIFY items requiring human check
2. List gold test results (pass/fail with evidence)
3. Provide step-by-step manual test instructions
4. Link to evidence files

The orchestrator NEVER fixes code during review → spawn a fix Coder worker.

## File Structure

```
.xiro/{feature}/
├── input.md                # Interview output
├── spec-anchor.md          # Immutable 3-5 line summary
├── gold-tests.md           # Killer scenarios (add-only)
├── shared.md               # Worker-shared gotchas
├── phases/
│   ├── 1-{name}/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   └── 2-{name}/...
└── evidence/
    ├── phase-1/task-1/...
    ├── gold/...
    └── decisions.log
```

## Spec Format References

- [spec-format.md](references/spec-format.md) — Requirements, design, tasks, gold test formats
- [orchestration.md](references/orchestration.md) — Workers, teams, git, shared knowledge
- [verification.md](references/verification.md) — HFP, VERIFY syntax, gold test protocol
