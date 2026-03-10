# xiro

**Verification-enforced spec-driven development for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).**

Hiro's verification philosophy + GSD's JS engine = xiro.
Neither Hiro nor GSD — a new system built from both.

**Core insight: Prompting for procedure is not enforcing procedure. xiro makes role boundaries and verification rules physically impossible to bypass.**

---

**[Claude Code](https://docs.anthropic.com/en/docs/claude-code)를 위한 검증 강제 스펙 기반 개발 시스템.**

Hiro의 검증 철학 + GSD의 JS 엔진 = xiro.
Hiro도 아니고 GSD도 아니고, 둘을 합쳐 새로 만든 시스템.

**핵심 통찰: 프롬프트로 절차를 요청하는 것과 엔진이 절차를 강제하는 것은 다르다. xiro는 역할 경계와 검증 규칙을 물리적으로 우회 불가능하게 만든다.**

## Why xiro?

The orchestrator (Claude) will always try to do everything itself — write code, run tests, check boxes, commit. Markdown instructions saying "don't do that" work until they don't.

xiro makes it structurally impossible:
- **Gate functions** block task completion without evidence (R1-R8)
- **Codex runs as an external process** — Claude can't verify its own work
- **Memory is a separate Haiku agent** — not the MC's side job
- **Phase autorun** is the default — one command runs everything

### xiro가 필요한 이유

오케스트레이터(Claude)는 항상 모든 것을 직접 하려 한다 — 코드 작성, 테스트 실행, 체크마크 찍기, 커밋. "그러지 마세요"라는 마크다운 지시는 안 될 때까지만 작동한다.

xiro는 구조적으로 불가능하게 만든다:
- **Gate 함수**가 증거 없이 태스크 완료를 차단 (R1-R8)
- **Codex는 외부 프로세스로 실행** — Claude가 자기 작업을 검증할 수 없음
- **기억은 별도 Haiku 에이전트** — MC의 부업이 아님
- **Phase 자동 실행**이 기본값 — 명령 하나로 전체 실행

## Features

- **JS verification engine** — R1-R8 guard functions enforce honest failure protocol
- **External Codex verification** — child_process boundary, not prompt-level convention
- **Phase autorun** — `/xiro run` executes entire phase, HITL only at real boundaries
- **Haiku memory agent** — dedicated recorder, not MC's fuzzy recollection
- **Gate system** — state transitions blocked unless all guards pass
- **Anti-mockup detection** — placeholder patterns flagged automatically
- **Gold test system** — killer scenarios, add-only, failure = full stop
- **Evidence-first** — no PASS without linked evidence files
- **Criteria locking** — verification criteria locked after HITL approval
- **Session continuity** — canonical event ledger survives compaction/interruption

## Commands

| Command | Description |
|---------|-------------|
| `/xiro new-project` | Interactive interview → spec-anchor + gold tests |
| `/xiro plan-phase N` | Generate phase spec pack with Codex review |
| `/xiro run` | Auto-run active phase (default: all tasks) |
| `/xiro run --task 2.3` | Run specific task only |
| `/xiro run --next` | Run next incomplete task |
| `/xiro status` | Progress + verification state + pending HITL |
| `/xiro resume` | Resume from persisted state |
| `/xiro review` | Checkpoint summary + evidence index |
| `/xiro health` | Check .xiro/ integrity |

## How It Works

```
/xiro new-project
  → Interview + spec-anchor + gold tests
  → HITL: "Project overview correct?"

/xiro plan-phase 1
  → Planner(opus) → requirements + design + tasks (VERIFY syntax)
  → Codex spec review (engine → codex exec)
  → Criteria lock
  → HITL: "Phase 1 spec approved?"

/xiro run                              ← Phase autorun (default)
  → Engine: all tasks sequential/parallel
  → Each task: coder → verify → codex → gate → clerk → memory
  → Failure: 3 retries → ESCALATION → HITL
  → Completion: regression + gold tests → phase report
  → HITL: "Phase 1 complete. [Approve] [Changes] [Abort]"
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│  MC (Opus)                                      │
│  Role: start/stop + HITL conversation only      │
│  Cannot: code, test, commit, evidence, memory   │
├─────────────────────────────────────────────────┤
│  Slash Commands (/xiro *)                       │
│  commands/xiro/*.md                             │
├─────────────────────────────────────────────────┤
│  Agent Definitions                              │
│  agents/xiro-{planner,coder,clerk,memory,...}.md│
├─────────────────────────────────────────────────┤
│  ★ Verification Engine (JS)                     │
│  xiro/bin/lib/honest.cjs      (R1-R8 guards)   │
│  xiro/bin/lib/evidence.cjs    (evidence store)  │
│  xiro/bin/lib/verifier.cjs    (VERIFY runner)   │
│  xiro/bin/lib/gate.cjs        (state blocker)   │
│  xiro/bin/lib/autorun.cjs     (phase engine)    │
│  xiro/bin/lib/external-verifier.cjs (Codex)     │
│  xiro/bin/lib/memory-bridge.cjs (Haiku bridge)  │
├─────────────────────────────────────────────────┤
│  External Verifier (Codex CLI / OpenAI API)     │
│  → Engine calls via child_process               │
│  → MC cannot call directly                      │
└─────────────────────────────────────────────────┘
```

## Role Isolation

| Role | Executor | MC can substitute? |
|------|----------|--------------------|
| Workflow start/stop | MC (Opus) | ✅ Only role |
| HITL conversation | MC (Opus) | ✅ Only role |
| Code writing | Coder (Sonnet) | ❌ Engine spawns |
| VERIFY execution | verifier.cjs | ❌ child_process |
| Exit code judgment | honest.cjs | ❌ Function return |
| Evidence storage | evidence.cjs | ❌ fs.writeFileSync |
| Codex review | external-verifier.cjs | ❌ child_process |
| Task completion | gate.cjs | ❌ Guard must pass |
| Git commits | Clerk (Sonnet) | ❌ Engine spawns |
| Memory recording | Memory (Haiku) | ❌ Separate context |
| Criteria weakening | Impossible | ❌ criteria-lock |
| Regression skip | Impossible | ❌ gate blocks |

## Honest Failure Protocol (R1-R8)

| Rule | Enforcement |
|------|------------|
| R1: No evidence = not done | gate.cjs blocks without evidence files |
| R2: Exit 0 = pass, always | honest.cjs: non-zero is never acceptable |
| R3: CANNOT_VERIFY at spec time only | honest.cjs blocks runtime additions |
| R4: No criteria weakening | criteria-lock.json + honest.cjs |
| R5: Regression guard | autorun.cjs re-runs all previous passes |
| R6: 3 strikes = escalation | honest.cjs: FULL STOP after 3 failures |
| R7: No speculative evidence | honest.cjs flags "should", "likely", etc. |
| R8: 5 verifier failures = halt | honest.cjs: stops the entire run |

## Installation

### Option 1: Clone into Claude Code skills directory

```bash
git clone https://github.com/conn-connect/xiro.git ~/.claude/skills/xiro
```

### Option 2: Clone and symlink

```bash
git clone https://github.com/conn-connect/xiro.git ~/xiro
ln -s ~/xiro ~/.claude/skills/xiro
```

After installation, restart Claude Code. The skill will be automatically detected.

## Generated Project Structure

```
.xiro/
├── config.json                # Project settings
├── STATE.md                   # Current state
├── spec-anchor.md             # Immutable goal (3-5 lines)
├── gold-tests.md              # Add-only killer scenarios
├── shared.md                  # Worker-shared gotchas
├── criteria-lock.json         # Locked after HITL approval
├── phases/{N}-{name}/
│   ├── requirements.md        # EARS + VERIFY_BY
│   ├── design.md              # Architecture + testability
│   ├── tasks.md               # VERIFY/CODEX_VERIFY/CANNOT_VERIFY
│   └── gold-tests.md          # Phase-specific additions
├── evidence/
│   ├── decisions.log          # Global decision audit trail
│   ├── phase-{N}/task-{N}/    # Per-task evidence
│   │   ├── subtask-{N.M}.log  # VERIFY output
│   │   ├── codex-review.md    # Codex verdict
│   │   └── verify-summary.md  # Task summary
│   └── gold/                  # Gold test evidence
├── ledger/events.ndjson       # Canonical event log
├── state/run-state.json       # Engine execution state
└── memory/                    # Haiku memory recorder
    ├── inbox/                 # Event queue (JSON)
    ├── latest.md              # Working summary (derived)
    └── patterns.md            # Recurring patterns
```

## Related

- [hiro](https://github.com/conn-connect/hiro) — The verification philosophy origin
- [GSD](https://github.com/gsd-build/get-shit-done) — The JS engine pattern origin

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- Git (for worktree-based agent isolation)
- Node.js >= 16.7.0
- Codex CLI or OPENAI_API_KEY (for external verification)

## License

MIT
