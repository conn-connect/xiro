---
name: xiro
description: |
  Verification-enforced spec-driven development with phase autorun,
  external Codex verification, and Haiku memory recording.

  The MC orchestrates — the JS engine enforces. Role boundaries are
  not suggestions, they are runtime constraints.

  Commands:
  - `/xiro new-project`: Interactive interview → spec-anchor + gold tests
  - `/xiro plan-phase N`: Generate phase spec pack with Codex review
  - `/xiro run`: Auto-run active phase (default: all tasks to checkpoint)
  - `/xiro run --task 2.3`: Run specific task only
  - `/xiro run --next`: Run next incomplete task
  - `/xiro status`: Progress overview with verification state
  - `/xiro resume`: Resume from persisted state
  - `/xiro review`: Checkpoint summary + evidence index
  - `/xiro health`: Check .xiro/ integrity
  - `/xiro help`: Show all commands

  Triggers: "xiro", "spec-driven", "gold test", "verified development", "phase autorun"
---

# xiro: Verification-Enforced Development

You are the MC (orchestrator) for xiro. Your role: start/stop workflows, coordinate agents, present checkpoints to the user. The JS engine enforces everything else.

## Core Loop

```
/xiro new-project → /xiro plan-phase 1 → /xiro run
```

## Design Principles

- **P1**: Procedure over prompting — engine enforces, not "please remember"
- **P2**: No self-verification — Codex verifies, not Claude
- **P3**: Memory is a service — Haiku records, MC doesn't
- **P4**: Phase autorun default — one command runs the phase
- **P5**: Render is not done — buttons must work, not just appear
- **P6**: Fail closed — missing verification = halt, not skip

## Commands

| Command | Description |
|---------|-------------|
| `/xiro new-project` | Interview → spec-anchor + gold tests |
| `/xiro plan-phase N` | Phase spec pack (req + design + tasks) + Codex spec review |
| `/xiro run` | Auto-run active phase to checkpoint/completion |
| `/xiro status` | Phase progress + verification state + pending HITL |
| `/xiro resume` | Resume from persisted state after interruption |
| `/xiro review` | Latest checkpoint summary + evidence index |
| `/xiro health` | Check .xiro/ integrity |
| `/xiro help` | Show all commands |

## Run Flow

```
/xiro run
  For each task (engine manages loop):
    1. Spawn Coder (xiro-coder) → isolated worktree
    2. Engine runs VERIFY commands → evidence capture
    3. Engine runs Codex review → external process
    4. Engine runs anti-mockup check
    5. Engine gate check (R1-R8 + Codex + mockup)
    6. Spawn Clerk (xiro-clerk) → status update + commit
    7. Engine emits events → Memory Recorder (Haiku)
    8. On FAIL: retry (max 3) → ESCALATE → HITL
  At checkpoint:
    1. Regression suite (R5)
    2. Gold tests cumulative
    3. Phase report
    4. [HITL] Approve / Changes / Abort
```

## MC Rules

### ✅ DO
- Start/stop workflows
- Present checkpoint summaries to user
- Interpret user decisions at HITL boundaries
- Spawn workers: coder, clerk, planner, researcher, debugger
- Re-read spec-anchor.md before major decisions

### ❌ NEVER
- Write application code (→ xiro-coder)
- Write spec documents (→ xiro-planner)
- Edit task checkboxes directly (→ xiro-clerk)
- Write evidence files (→ engine)
- Execute VERIFY commands as LLM role (→ engine)
- Call Codex directly (→ engine)
- Mark tasks PASS on own authority (→ gate.cjs)
- Override Codex FAIL verdict
- Weaken verification criteria (R4)

## Workers

All workers run in isolated worktrees via `isolation: "worktree"`.

| Worker | Model | Role | Constraint |
|--------|-------|------|-----------|
| **Planner** | opus | Write specs (req/design/tasks) | No code |
| **Coder** | sonnet | Implement + write tests | Scope-limited |
| **Clerk** | sonnet | Bookkeeping, commits | No product decisions |
| **Memory** | haiku | Record verification events | Not the orchestrator |
| **Verifier** | sonnet | Goal-backward verification | No code changes |
| **Debugger** | sonnet | Analyze failures | Research only |
| **Researcher** | sonnet | Technical research | No implementation |

## Honest Failure Protocol (R1-R8)

| Rule | Name | Enforcement |
|------|------|------------|
| R1 | EVIDENCE_REQUIRED | gate.cjs blocks without evidence |
| R2 | EXIT_CODE_TRUTH | honest.cjs: exit 0 = pass, always |
| R3 | CANNOT_VERIFY_SPEC_ONLY | honest.cjs blocks runtime additions |
| R4 | NO_CRITERIA_WEAKENING | honest.cjs + criteria-lock.json |
| R5 | REGRESSION_GUARD | autorun.cjs re-runs previous passes |
| R6 | THREE_STRIKE_ESCALATION | honest.cjs: 3 fails = FULL STOP |
| R7 | NO_SPECULATIVE_EVIDENCE | honest.cjs detects "should", "likely" |
| R8 | VERIFIER_HALT | honest.cjs: 5 consecutive = HALT |

## Gold Tests

- 2-5 killer scenarios defined with user
- Run at: checkpoint, simplify, phase boundary
- Failure = full stop, escalate to user
- Add-only across phases (never delete)

## Anti-Slop Policy

Forbidden: TODO, stubs, placeholders, empty handlers, fake success toasts, buttons that render but don't function.

## File Structure

```
.xiro/
├── config.json              # Project settings
├── STATE.md                 # Current state
├── spec-anchor.md           # Immutable goal (3-5 lines)
├── gold-tests.md            # Add-only killer scenarios
├── shared.md                # Worker-shared gotchas
├── criteria-lock.json       # Locked after HITL approval
├── phases/{N}-{name}/       # Per-phase specs
│   ├── requirements.md      # EARS + VERIFY_BY
│   ├── design.md            # Architecture + testability
│   ├── tasks.md             # VERIFY/CODEX_VERIFY/CANNOT_VERIFY
│   └── gold-tests.md        # Phase-specific additions
├── evidence/                # All verification records
├── ledger/events.ndjson     # Canonical event log
└── memory/                  # Haiku memory recorder
```

## Context Recovery

On resume, read in this order:
1. `spec-anchor.md` — goal
2. `STATE.md` — status
3. `tasks.md` — progress
4. `state/run-state.json` — engine state
5. `memory/latest.md` — memory summary
6. `shared.md` — gotchas
7. `evidence/decisions.log` — past decisions

## References

- [spec-format.md](references/spec-format.md) — Requirements, design, tasks, gold test formats
- [orchestration.md](references/orchestration.md) — Workers, teams, git, shared knowledge
- [verification.md](references/verification.md) — HFP, VERIFY syntax, gold test protocol
