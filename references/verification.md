# Verification Reference

Honest Failure Protocol, VERIFY syntax, evidence format, and gold test verification.

---

## 1. Honest Failure Protocol (5 Rules)

These rules are non-negotiable. AI agents rationalize failures, interpret ambiguous results as success, and skip verification under pressure. Xiro refuses to do that.

### R1: EVIDENCE_REQUIRED

Every VERIFY produces captured output in `.xiro/evidence/`. No evidence = not done.

- Task CANNOT be marked `[x]` without evidence files
- Evidence = stdout + stderr + exit code (all three, always)
- "I ran it and it worked" is NOT evidence
- Evidence capture failure is itself a FAIL

### R2: EXIT_CODE_TRUTH

Exit 0 = PASS. Non-zero = FAIL. No exceptions.

- Timeout = FAIL
- Segfault = FAIL
- "Exit 1 but output looks right" = FAIL
- "Timed out but probably started" = FAIL
- Never interpret non-zero as acceptable without human confirmation

### R3: CANNOT_VERIFY_DECLARATION

Declared at spec time. Cannot be added during execution to excuse a failure.

What AI cannot verify:
- Browser-interactive flows (OAuth, CAPTCHA)
- External service side-effects (email, SMS, webhooks)
- Performance under load
- Security testing
- Subjective quality (UX, animation smoothness)

Format in tasks.md:
```markdown
**CANNOT_VERIFY**: {what}
REASON: {why AI can't}
REQUIRES: {human action}
WORKAROUND: {partial verification AI CAN do}
```

### R4: NO_SELF_WAIVER

Orchestrator cannot waive, weaken, or reinterpret verification criteria. Only humans can.

Prohibited:
- Concluding "expected behavior" without human confirmation
- Modifying criteria to make them pass
- Skipping verification steps
- Reducing test count expectations
- Marking `[x]` with partial verification

### R5: FAILURE_ESCALATION

3 attempts, then STOP.

| Attempt | Actor | Action |
|---------|-------|--------|
| 1 | Worker | Fix and retry |
| 2 | Orchestrator guides, worker retries |
| 3 | Final attempt. FAIL → FULL STOP |
| Post-3 | Orchestrator reports to human with evidence |

At FULL STOP:
- No further work on this task or dependents
- Complete evidence report to human
- Human options: provide guidance, waive, or abort

---

## 2. VERIFY Syntax Reference

### Forms

| Syntax | Meaning |
|--------|---------|
| `**VERIFY**: \`cmd\` exits N` | Command exits with code N |
| `**VERIFY**: \`cmd\` exits 0, N tests PASS` | Exit 0 + N or more tests pass |
| `**VERIFY**: \`cmd\` contains "str"` | Exit 0 + output contains literal string |
| `**VERIFY**: \`cmd\` matches \`regex\`` | Exit 0 + output matches pattern |
| `**VERIFY**: \`cmd1\` exits 0 AND \`cmd2\` exits 0` | Both must pass |
| `**CANNOT_VERIFY**: {what}` | Human-required (spec-time only) |

### Rules

1. **Deterministic**: Same code → same result. No external dependencies.
2. **Self-contained**: Works from project root, no manual setup.
3. **Specific**: Executable command with expected outcome (not a wish).
4. **At subtask level**: VERIFY on subtasks, never parent tasks.
5. **Test counts are contracts**: `5 tests PASS` means exactly 5.

### Example Subtask

```markdown
- [ ] 2.1 Create auth middleware
  - Implement JWT validation in `src/middleware/auth.ts`
  - Handle expired, missing, malformed tokens
  - _Requirements: 1.1, 1.2_
  - **VERIFY**: `npm test -- --grep "auth middleware"` exits 0, 6 tests PASS
```

---

## 3. Evidence Format

### Directory Layout

```
.xiro/{feature}/evidence/
├── decisions.log
├── phase-1/
│   ├── task-1/
│   │   ├── subtask-1.1.log
│   │   ├── subtask-1.T.log
│   │   └── verify-summary.md
│   ├── checkpoint-1/
│   │   └── verify-all.log
│   └── simplify-1/
│       ├── pre-verify.log
│       └── post-verify.log
├── gold/
│   ├── gt-1.log
│   └── gt-2.log
└── phase-2/...
```

### Evidence Log Format

```
VERIFY: {exact command}
TASK: {N.M} {title}
TIMESTAMP: {ISO 8601}
EXIT_CODE: {code}
RESULT: PASS | FAIL
---
{full stdout + stderr}
```

### Decision Log Format

Append-only. One entry per decision.

```
[{ISO 8601}] DECISION: {what}
REASON: {why}
ANCHOR_CHECK: {confirmed alignment with spec-anchor}
```

### Verify Summary Format

```markdown
# Verification Summary: Task {N}

| Subtask | Command | Result | Attempts | Evidence |
|---------|---------|--------|----------|----------|
| {N}.1 | `{cmd}` | PASS | 1 | subtask-{N}.1.log |
| {N}.2 | `{cmd}` | PASS | 2 | subtask-{N}.2.log |
| {N}.T | `{cmd}` | PASS | 1 | subtask-{N}.T.log |

Overall: PASS ({M}/{M} subtasks)
```

---

## 4. Gold Test Verification Protocol

### When Gold Tests Run

| Trigger | Required? | On Failure |
|---------|-----------|------------|
| Checkpoint | Yes | Block phase |
| Post-simplify | Yes | Revert simplification |
| Phase boundary | Yes | Block next phase |
| `/xiro test` | Manual | Report to user |
| User requests a test | Add + run | Report to user |

### Execution Protocol

```
1. Read .xiro/{feature}/gold-tests.md
2. For each GT-N:
   a. Run VERIFY command exactly as written
   b. Capture full output to .xiro/{feature}/evidence/gold/gt-{N}.log
   c. Check exit code (R2: EXIT_CODE_TRUTH)
   d. If FAIL: stop all gold tests, report immediately
3. Compile results:
   Gold Tests: {pass}/{total}
   GT-1: PASS | FAIL
   GT-2: PASS | FAIL
   ...
```

### Gold Test Failure Response

Gold test failure is more severe than subtask failure:

1. **Immediate stop** — no more work on any task
2. **Full evidence** — capture output, highlight failure point
3. **Escalate to user** — present failure with context:
   ```
   GOLD TEST FAILURE
   Test: GT-{N} — {name}
   Command: {verify command}
   Exit: {code}
   Output: {captured}

   This gold test previously passed at: {last pass timestamp, if any}
   Possible causes:
     1. {based on error output}
     2. {based on recent changes}

   Options:
   - [Fix] Spawn Coder worker to address the failure
   - [Waive] Accept current state (logged in decisions.log)
   - [Stop] Halt all development
   ```

### Add-Only Rule

Gold tests accumulate across phases:
- Phase 1 defines GT-1, GT-2
- Phase 2 adds GT-3, GT-4 (GT-1, GT-2 still required)
- Phase 3 adds GT-5 (all 5 must pass)

Never delete or weaken a gold test. If a gold test becomes invalid due to legitimate design change, present to user for explicit removal approval (logged in decisions.log).

---

## 5. HITL Templates

### Failure Escalation (3 attempts exhausted)

```markdown
## Verification Failed: {N.M} — {title}

**Command**: `{verify command}`
**Phase**: {P} — {name}

| Attempt | Exit | Key Error | Fix Applied |
|---------|------|-----------|-------------|
| 1 | {code} | {1-line} | {what changed} |
| 2 | {code} | {1-line} | {what changed} |
| 3 | {code} | {1-line} | {what changed} |

**Diagnosis**: {honest assessment from evidence, not speculation}

**Evidence**: `.xiro/{feature}/evidence/phase-{P}/task-{N}/`

Options:
- [Provide guidance] Reset attempts
- [Waive] Accept (logged)
- [Abort] Stop work
```

### Checkpoint Review

```markdown
## Checkpoint: Phase {P} — {name}

**Tasks**: {completed}/{total}
**Subtasks verified**: {X}/{Y} (Z%)
**Gold tests**: {pass}/{total}

### Automated PASS
{list of passing tasks}

### FAILED (escalated)
{list with evidence links}

### CANNOT_VERIFY (human required)
{list with manual test steps}

### Manual Test Checklist
- [ ] {action} → expect {outcome}
- [ ] {action} → expect {outcome}

Options: [Approve] [Fix] [Stop]
```

---

## 6. Environment-Specific Patterns

Standard verification commands by project type. Adjust per project.

### Web (Next.js / React / Node)

| Stage | Command | Criteria |
|-------|---------|----------|
| Build | `npm run build` | exits 0 |
| Lint | `eslint . --max-warnings 0` | exits 0 |
| Type | `tsc --noEmit` | exits 0 |
| Test | `npm test` | exits 0, N tests PASS |
| Smoke | `curl -s localhost:3000/health` | contains "ok" |

### Flutter

| Stage | Command | Criteria |
|-------|---------|----------|
| Analyze | `flutter analyze --no-fatal-infos` | exits 0 |
| Build | `flutter build apk --debug` | exits 0 |
| Test | `flutter test` | exits 0, N tests PASS |

**Critical**: `flutter analyze` passing does NOT mean build passes. Always verify both.

### Python (FastAPI / Django)

| Stage | Command | Criteria |
|-------|---------|----------|
| Lint | `ruff check src/` | exits 0 |
| Type | `mypy src/` | exits 0 |
| Test | `pytest tests/ -v` | exits 0, N tests PASS |
| Smoke | `uvicorn app:app & sleep 3 && curl localhost:8000/health` | contains "ok" |

---

## 7. Quick Reference

```
R1  EVIDENCE_REQUIRED     No evidence = not done
R2  EXIT_CODE_TRUTH       Exit 0 = pass. Non-zero = fail. Always.
R3  CANNOT_VERIFY         Declared at spec time ONLY. Includes WORKAROUND.
R4  NO_SELF_WAIVER        Orchestrator cannot weaken criteria.
R5  FAILURE_ESCALATION    3 attempts then STOP. Report to human.
```

```
VERIFY exits N            Command exit code
VERIFY contains "str"     Output substring
VERIFY matches regex      Output pattern
VERIFY N tests PASS       Test count
CANNOT_VERIFY             Human-required (spec-time only)
```

```
Evidence:    .xiro/{feature}/evidence/phase-{N}/task-{N}/
Decisions:   .xiro/{feature}/evidence/decisions.log
Gold tests:  .xiro/{feature}/evidence/gold/
Checkpoint:  .xiro/{feature}/evidence/phase-{N}/checkpoint-{N}/
```
