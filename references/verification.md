# Verification Reference

Honest verification rules, slice evidence format, gold test execution, and environment-specific patterns for the BDD workflow.

In xiro, verification happens at the `THEN`-slice level first and at the gold-test level second.

---

## 1. Honest Failure Protocol

These rules are non-negotiable.

### R1: EVIDENCE_REQUIRED

Every `VERIFY` produces captured evidence in `.xiro/{feature}/evidence/`.

- No evidence = not done
- A slice cannot be marked `[x]` without its evidence
- Evidence includes stdout, stderr, exit code, and referenced artifacts when relevant
- Evidence capture failure is itself a failure

### R2: EXIT_CODE_TRUTH

Exit `0` = pass. Non-zero = fail.

- timeout = fail
- crash = fail
- "output looks fine" with exit `1` = fail

### R3: CANNOT_VERIFY_DECLARATION

Human-only verification must be declared while writing the docs, not invented during execution to excuse a failure.

Common `CANNOT_VERIFY` cases:

- subjective UX quality
- device-specific hardware behavior
- third-party flows requiring real human auth or CAPTCHA
- tactile/animation feel that automation cannot judge honestly

### R4: NO_SELF_WAIVER

The orchestrator cannot weaken a `THEN`, skip a step, or reinterpret a failing assertion as acceptable.

### R5: FAILURE_ESCALATION

Three honest attempts, then stop and escalate.

| Attempt | Actor | Action |
|---------|-------|--------|
| 1 | Worker | Fix and retry the same slice |
| 2 | Orchestrator guides, worker retries |
| 3 | Final retry |
| Post-3 | Stop and report with evidence |

---

## 2. `VERIFY` Syntax

`VERIFY` lives in `tests.md`, inside each `THEN` slice entry.

### Forms

| Form | Example |
|------|---------|
| Exit code | `**VERIFY**: \`npm run build\` exits 0` |
| Test suite | `**VERIFY**: \`pytest tests/\` exits 0, 8 tests PASS` |
| Output contains | `**VERIFY**: \`curl localhost:3000/health\` contains "ok"` |
| Output matches | `**VERIFY**: \`curl localhost/version\` matches "\\d+\\.\\d+"` |
| Compound | `**VERIFY**: \`npm run lint\` exits 0 AND \`npm run build\` exits 0` |

### Rules

1. Deterministic: same code should produce the same result
2. Self-contained: runnable from project root with declared setup
3. Specific: must be an executable command with a clear success condition
4. Slice-scoped: the command must prove the assigned `THEN`, not the whole universe

### Example

```markdown
- [ ] S1.T1 Increment visible count
  - Scenario: S1
  - Goal: User sees `41` become `42`
  - Surface: web-ui
  - Method: Playwright
  - Steps:
    1. Open `/counter`
    2. Click the `+` button once
  - Assertions:
    - The visible count becomes `42`
  - **VERIFY**: `npx playwright test tests/e2e/counter.spec.ts --grep "S1.T1"` exits 0
```

---

## 3. Evidence Format

### Directory Layout

```text
.xiro/{feature}/evidence/
├── decisions.log
├── phase-1/
│   ├── slices/
│   │   ├── S1.T1/
│   │   │   ├── verify.log
│   │   │   └── summary.md
│   │   ├── S1.T2/
│   │   └── S2.T1/
│   └── checkpoint/
│       ├── verify-all.log
│       └── gold-test-results.md
└── gold/
    ├── gt-1.log
    └── gt-2.log
```

### Slice Evidence Log Format

```text
VERIFY: {exact command}
SLICE: {scenario-id}/{then-id}
TIMESTAMP: {ISO 8601}
EXIT_CODE: {code}
RESULT: PASS | FAIL
---
{full stdout + stderr}
```

### Decision Log Format

Append-only:

```text
[{ISO 8601}] DECISION: {what changed or was approved}
REASON: {why}
SCOPED_TO: {phase, scenario, or slice}
```

### Slice Summary Format

```markdown
# Slice Summary: S1.T1

- Scenario: S1
- Goal: Increment visible count
- Result: PASS
- Evidence: verify.log
- Changed files:
  - src/counter/store.ts
  - tests/e2e/counter.spec.ts
```

---

## 4. Gold Test Verification Protocol

### When Gold Tests Run

| Trigger | Required? | On Failure |
|---------|-----------|------------|
| Checkpoint | Yes | Block progress |
| Post-simplify | Yes | Revert or fix simplify pass |
| Phase boundary | Yes | Block next phase |
| `/xiro test` with no name | Yes | Report to user |

### Execution Protocol

```text
1. Read .xiro/{feature}/gold-tests.md
2. For each GT-N:
   a. Run VERIFY command exactly as written
   b. Capture output to .xiro/{feature}/evidence/gold/gt-{N}.log
   c. Check exit code honestly
3. Compile results:
   Gold Tests: {pass}/{total}
   GT-1: PASS | FAIL
   GT-2: PASS | FAIL
```

### Add-Only Rule

Gold tests accumulate across phases:

- Phase 1 defines GT-1, GT-2
- Phase 2 adds GT-3
- Phase 3 adds GT-4

Previously defined gold tests still run unless the user explicitly approves removal.

---

## 5. Slice and Checkpoint Templates

### Slice Failure Escalation

```markdown
## Verification Failed: S2.T3 — {title}

**Command**: `{verify command}`
**Phase**: {P} — {name}

| Attempt | Exit | Key Error | Fix Applied |
|---------|------|-----------|-------------|
| 1 | {code} | {1-line} | {what changed} |
| 2 | {code} | {1-line} | {what changed} |
| 3 | {code} | {1-line} | {what changed} |

**Diagnosis**: {honest assessment from evidence}

**Evidence**: `.xiro/{feature}/evidence/phase-{P}/slices/S2.T3/`

Options:
- [Provide guidance]
- [Waive]
- [Abort]
```

### Checkpoint Review

```markdown
## Checkpoint: Phase {P} — {name}

**Scenario progress**
- S1: 2/2 slices complete
- S2: 1/3 slices complete

**Verified slices**: {X}/{Y}
**Gold tests**: {pass}/{total}

### Automated PASS
- {slice-id} {title}

### FAILED
- {slice-id} -> evidence path

### CANNOT_VERIFY
- {item}: {manual step}

### Manual Test Checklist
- [ ] {action} -> expect {outcome}
- [ ] {action} -> expect {outcome}
```

---

## 6. Environment-Specific Patterns

Standard patterns to use when writing `tests.md`.

### Web UI

| Field | Pattern |
|-------|---------|
| Setup | `npm install`, `npm run dev` |
| Method | Playwright |
| Steps | open page -> click control -> observe visible UI |
| VERIFY | `npx playwright test ... --grep "{slice-id}"` exits 0 |

Use explicit steps like:

```markdown
Steps:
1. Open `/counter`
2. Confirm visible text is `41`
3. Click the `+` button once
Assertions:
- Visible text becomes `42`
- No warning banner is shown
```

### Flutter UI

| Field | Pattern |
|-------|---------|
| Setup | `flutter pub get` |
| Method | `integration_test` or stable driver-based test |
| Steps | launch app -> tap widget by semantics label -> observe visible state |
| VERIFY | `flutter test integration_test/... --plain-name "{slice-id}"` exits 0 |

Use explicit steps like:

```markdown
Steps:
1. Launch the app with the test harness
2. Find widget `counter-increment`
3. Tap once
Assertions:
- Text `1` is visible
- No error banner appears
```

### API / Backend

| Field | Pattern |
|-------|---------|
| Setup | app server or test database boot |
| Method | pytest, curl, or integration suite |
| Steps | create request preconditions -> send request -> assert response/state |
| VERIFY | `pytest tests/api/test_counter.py -k "{slice-id}"` exits 0 |

### HITL Fallback

Use HITL only when automation is impractical. If HITL is used, write:

```markdown
- VERIFY_BY: hitl (reason)
- HITL_ACTION:
  1. {human step}
  2. {human step}
  3. Confirm {observable outcome}
```

---

## 7. Quick Reference

```text
R1  EVIDENCE_REQUIRED     No evidence = not done
R2  EXIT_CODE_TRUTH       Exit 0 = pass. Non-zero = fail.
R3  CANNOT_VERIFY         Declare during authoring, not after a failure
R4  NO_SELF_WAIVER        Do not weaken a THEN during execution
R5  FAILURE_ESCALATION    3 attempts then stop
```

```text
Evidence:   .xiro/{feature}/evidence/phase-{N}/slices/{slice-id}/
Gold:       .xiro/{feature}/evidence/gold/
Decisions:  .xiro/{feature}/evidence/decisions.log
```
