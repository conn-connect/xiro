# Xiro

**Spec-driven development with gold tests and worktree isolation for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).**

Xiro is a Claude Code skill that orchestrates spec-driven development with layer-parallel spec generation, gold test verification, and strict anti-slop policies. The orchestrator delegates all work to specialized workers (Planner, Coder, Tester, Simplifier) and never writes code or specs directly.

**Core philosophy: specs first, gold tests prove it, no placeholders ever.**

---

**[Claude Code](https://docs.anthropic.com/en/docs/claude-code)를 위한 골드 테스트 기반 스펙 주도 개발 스킬.**

Xiro는 레이어 병렬 스펙 생성, 골드 테스트 검증, 엄격한 안티-슬롭 정책을 갖춘 스펙 기반 개발 오케스트레이터입니다. 오케스트레이터는 모든 작업을 전문 워커(Planner, Coder, Tester, Simplifier)에게 위임하며, 직접 코드나 스펙을 작성하지 않습니다.

**핵심 철학: 스펙 우선, 골드 테스트로 증명, 플레이스홀더는 절대 금지.**

## Features

- **Interactive interview** — Structured requirements gathering before any code
- **Layer-parallel specs** — All phases' requirements generated in parallel, then all designs, then all tasks. Cross-phase consistency through shared HITL reviews
- **Gold test system** — 2-5 killer scenarios that prove the feature works end-to-end. Failure = full stop.
- **4 worker types** — Planner (specs), Coder (implementation), Tester (verification), Simplifier (cleanup)
- **Anti-slop policy** — No "TODO", no stubs, no placeholders, no empty function bodies
- **Shared knowledge** — Workers share gotchas via `.xiro/{feature}/shared.md`
- **Honest Failure Protocol** — 5 non-negotiable rules preventing AI from rationalizing failures

### 주요 기능

- **인터랙티브 인터뷰** — 코딩 전 구조화된 요구사항 수집
- **레이어 병렬 스펙** — 모든 페이즈의 요구사항을 병렬 생성, 이후 설계, 이후 태스크 순서. HITL 리뷰를 통한 크로스-페이즈 일관성
- **골드 테스트 시스템** — 기능이 end-to-end로 작동함을 증명하는 2-5개 킬러 시나리오. 실패 시 전체 중단.
- **4가지 워커 타입** — Planner(스펙), Coder(구현), Tester(검증), Simplifier(정리)
- **안티-슬롭 정책** — "TODO", 스텁, 플레이스홀더, 빈 함수 본문 절대 금지
- **공유 지식** — 워커들이 `.xiro/{feature}/shared.md`로 주의사항을 공유
- **Honest Failure Protocol** — AI의 실패 합리화를 방지하는 5가지 규칙

## Commands

| Command | Description |
|---------|-------------|
| `/xiro interview` | Requirements interview, generates `input.md` |
| `/xiro spec [name]` | Layer-parallel spec generation from `input.md` |
| `/xiro run [N]` | Execute tasks (auto: single or batch). N for specific task |
| `/xiro status` | Progress overview with gold test results |
| `/xiro test [name]` | Run gold tests (name optional, default: all) |

## How It Works

```
/xiro interview
        |
        v
  input.md (structured requirements)
        |
        v
/xiro spec
        |
  Phase split proposal → [HITL] approve
        |
  Layer-parallel spec generation:
    All requirements.md in parallel → [HITL] review
    All design.md in parallel       → [HITL] review
    All tasks.md in parallel        → [HITL] review
        |
  Gold test definition with user → gold-tests.md
        |
        v
/xiro run
        |
  1. Identify ready tasks
  2. Spawn Coder workers (parallel if independent)
  3. Merge worktrees
  4. Spawn Tester worker (VERIFY + gold tests)
  5. Spawn Simplifier at checkpoint → re-verify
  6. [HITL] Phase review guide with manual test checklist
```

## Gold Test System

Gold tests are killer scenarios defined with the user during the spec phase. They prove the feature works end-to-end.

```markdown
## GT-1: Full Login Round-Trip
**Description**: User registers, logs in, accesses protected endpoint, logs out.
**VERIFY**: `pytest tests/gold/test_login_roundtrip.py -v` exits 0
```

**Rules:**
- 2-5 scenarios per feature
- Run at every checkpoint, post-simplify, and phase boundary
- Failure = full stop, escalate to user immediately
- Add-only across phases (never delete gold tests)

### 골드 테스트 규칙

- 기능당 2-5개 시나리오
- 모든 체크포인트, 리팩토링 후, 페이즈 경계에서 실행
- 실패 시 모든 작업 즉시 중단, 사용자에게 에스컬레이션
- 페이즈가 추가될수록 골드 테스트도 누적 (삭제 금지)

## Anti-Slop Policy

Placeholders are AI slop. These are **forbidden**:

- `"Coming soon"`, `"TODO: implement later"`
- Stub endpoints returning hardcoded data
- Empty function bodies
- `"Example"`, `"sample"`, `"placeholder"`

If something isn't needed, omit it. If it's needed, implement it fully.

## Worker Types

All workers run in isolated git worktrees.

| Worker | Role | Constraint |
|--------|------|------------|
| **Planner** | Write spec documents (req/design/tasks) | No code |
| **Coder** | Implement + write test code | Scope-limited to assigned task |
| **Tester** | Run verification, capture evidence | No code modification |
| **Simplifier** | Refactor post-checkpoint | No behavior change |

## Honest Failure Protocol

| Rule | Name | Meaning |
|------|------|---------|
| R1 | EVIDENCE_REQUIRED | No evidence = not done |
| R2 | EXIT_CODE_TRUTH | Exit 0 = pass. Non-zero = fail. Always. |
| R3 | CANNOT_VERIFY | Declared at spec time ONLY |
| R4 | NO_SELF_WAIVER | Orchestrator cannot weaken criteria |
| R5 | FAILURE_ESCALATION | 3 attempts then STOP |

## Installation

### Option 1: Clone directly into Claude Code skills directory

```bash
git clone https://github.com/YOUR_USERNAME/xiro.git ~/.claude/skills/xiro
```

### Option 2: Clone and symlink

```bash
git clone https://github.com/YOUR_USERNAME/xiro.git ~/xiro
ln -s ~/xiro ~/.claude/skills/xiro
```

After installation, restart Claude Code. The skill will be automatically detected.

### 설치 방법

**방법 1: Claude Code skills 디렉토리에 직접 클론**

```bash
git clone https://github.com/YOUR_USERNAME/xiro.git ~/.claude/skills/xiro
```

**방법 2: 클론 후 심볼릭 링크**

```bash
git clone https://github.com/YOUR_USERNAME/xiro.git ~/xiro
ln -s ~/xiro ~/.claude/skills/xiro
```

설치 후 Claude Code를 재시작하면 자동으로 인식됩니다.

## File Structure

```
xiro/
├── SKILL.md                          # Main skill definition
├── README.md
└── references/
    ├── spec-format.md                # Requirements, design, tasks, gold test formats
    ├── orchestration.md              # Workers, teams, git, shared knowledge
    └── verification.md               # HFP, VERIFY syntax, gold test protocol
```

## Generated Project Structure

When you use xiro, it creates:

```
.xiro/{feature}/
├── input.md                          # Interview output
├── spec-anchor.md                    # Immutable 3-5 line summary
├── gold-tests.md                     # Killer scenarios (add-only)
├── shared.md                         # Worker-shared gotchas
├── phases/
│   ├── 1-{name}/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   └── 2-{name}/...
└── evidence/
    ├── decisions.log
    ├── phase-1/task-1/...
    └── gold/gt-1.log
```

## Hiro vs Xiro

| Aspect | Hiro | Xiro |
|--------|------|------|
| Spec generation | Per-phase sequential | Layer-parallel (all requirements, then all designs, then all tasks) |
| Gold tests | No | Yes — 2-5 killer scenarios, failure = full stop |
| Anti-slop | Implicit | Explicit policy — no placeholders, stubs, TODOs |
| Shared knowledge | No | Yes — `shared.md` for worker gotchas |
| Interview | Optional | Built-in `/xiro interview` command |
| Tester worker | Orchestrator verifies | Dedicated Tester worker (no code modification) |
| HFP rules | 7 rules | 5 rules (streamlined) |

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- Git (for worktree-based agent isolation)

## Related

- [hiro](https://github.com/YOUR_USERNAME/hiro) — The original with 7-rule Honest Failure Protocol and screenshot honesty

## License

MIT
