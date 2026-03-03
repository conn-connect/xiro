# Spec Format Reference

Consolidated format guide for requirements.md, design.md, tasks.md, and gold-tests.md.

---

## 1. Requirements Format

### Document Structure

```markdown
# Requirements: Phase N — {name}

## Spec Anchor
> (copied verbatim from spec-anchor.md — IMMUTABLE)

## Glossary
- **Term**: Definition

## Requirements

### Requirement 1: {Name}
**User Story:** As a {role}, I want {goal}, so that {benefit}.

#### Acceptance Criteria

1.1 WHEN {condition} THE System SHALL {behavior}
    VERIFY_BY: automated ({tool}: {what to test})

1.2 WHEN {condition} THE System SHALL {behavior}
    VERIFY_BY: hitl ({reason})
    HITL_ACTION: {step-by-step human verification}

## Verification Budget
| Category | Count | Method |
|----------|-------|--------|
| Automated | N | pytest, ruff, mypy |
| HITL | N | Browser, external service |
| **Total** | **N** | |
AI: X/Y (Z%) | Human: X/Y (Z%)
```

### EARS Notation

All requirements use EARS (Easy Approach to Requirements Syntax):

| Pattern | Use |
|---------|-----|
| `WHEN...THE...SHALL` | Event-triggered behavior |
| `IF...THEN THE...SHALL` | State-dependent behavior |
| `THE System SHALL` | Universal/always-on behavior |

### VERIFY_BY Classification

Every acceptance criterion declares verification method at spec time.

**Automated:**
```markdown
1.1 WHEN user submits valid credentials THE System SHALL create a session
    VERIFY_BY: automated (pytest: mock credentials → assert session created)
```

**HITL (human-in-the-loop):**
```markdown
2.1 WHEN user clicks "Sign in with Google" THE System SHALL redirect to consent screen
    VERIFY_BY: hitl (requires browser + real OAuth provider)
    HITL_ACTION: Open browser → click SSO → verify redirect to provider
```

**Rules:**
- Every criterion gets VERIFY_BY. No exceptions.
- HITL items must include HITL_ACTION (specific steps for human).
- Automated items specify the tool (pytest, ruff, curl, etc.).
- Classification is set at spec time — never changed during execution.
- When in doubt, classify as hitl.

### Verification Budget

Summary table at the end of every requirements.md:
- Count every acceptance criterion
- Calculate AI vs. human ratio
- Update when criteria change

---

## 2. Design Format

### Document Structure

```markdown
# Design: Phase N — {name}

## Overview
1-2 paragraph technical approach summary.

## Architecture
System diagram (ASCII) + component relationships + tech stack.

## Components and Interfaces
Per-component spec with testability annotation.

## Data Models
Types/interfaces + database schema.

## Error Handling
Error codes, HTTP statuses, strategies.

## Testing Strategy
Unit, integration, property-based approaches.

## Verification Architecture
Commands table + CANNOT_VERIFY items.

## Simplification Targets
Post-implementation cleanup candidates.
```

### Component Template

Every component includes testability annotation:

```markdown
### {ComponentName}

**File**: `src/path/to/file.py`
**Purpose**: One sentence.
**Testability**: HIGH | MEDIUM | LOW | HITL
**Test Strategy**: How to test in isolation
**Mock**: Dependencies to mock
**Validates**: Requirements X.X, X.X
```

Testability levels:

| Level | Meaning |
|-------|---------|
| HIGH | Pure logic, easily mockable. Fast, deterministic tests. |
| MEDIUM | External deps but testable with fakes/containers. |
| LOW | Real services needed. Slow or flaky. |
| HITL | Cannot automate. Human verification required. |

### Verification Architecture Section

```markdown
## Verification Architecture

### Commands
| Stage | Command | Expected |
|-------|---------|----------|
| Lint | `ruff check src/` | exits 0 |
| Type | `mypy src/` | exits 0 |
| Unit | `pytest tests/unit/ -v` | exits 0, all pass |
| Integration | `pytest tests/integration/ -v` | exits 0 |
| Build | `npm run build` | exits 0 |

### CANNOT_VERIFY Items
| Item | Reason | Human Steps |
|------|--------|-------------|
| OAuth flow | Browser interaction | Navigate → login → verify redirect |
```

### Simplification Targets

Identify areas that will accumulate complexity during implementation:
- Duplicated patterns across components
- Inconsistent naming or conventions
- Configuration scattered across modules
- Dead code from iteration

These guide the Simplifier worker post-checkpoint.

---

## 3. Tasks Format

### Document Structure

```markdown
# Tasks: Phase N — {name}

## Spec Anchor
> (copied verbatim — IMMUTABLE)

## Verification Environment
| Purpose | Command | Expected |
|---------|---------|----------|
| Build | `{cmd}` | exits 0 |
| Tests | `{cmd}` | exits 0, all pass |
| Lint | `{cmd}` | exits 0 |

## Tasks

- [ ] 1. {Task title}
  - [ ] 1.1 {Subtask}
    - Implementation detail
    - _Requirements: X.X_
    - **VERIFY**: `{command}` exits 0
  - [ ] 1.T {Test subtask} (MANDATORY)
    - **Property 1: {what is tested}**
    - **Validates: Requirements X.X**
    - **VERIFY**: `{test command}` exits 0, N tests PASS

- [ ] **checkpoint**: {description}
  - **VERIFY_ALL**:
    - `{full test suite}` exits 0
    - `{lint}` exits 0
  - **CANNOT_VERIFY**:
    - {item} — REASON: {why} — REQUIRES: {human action}
  - **GOLD_TEST**: run all gold tests
  - [HITL] Review + approve

- [ ] **simplify**: Post-checkpoint cleanup for tasks N-M
  - **CONSTRAINT**: No behavior change
  - **VERIFY**: same commands, same results
```

### Subtask Rules

1. **Every task has subtasks**: Min 2 implementation + 1 test subtask (N.T)
2. **N.M numbering**: Subtasks use `N.M` format. Test subtask = `N.T`
3. **N.T is MANDATORY**: Every task ends with a test subtask. Not optional.
4. **Every subtask has VERIFY**: At least one `**VERIFY**` per subtask
5. **Dependencies at task level**: `_depends: N_` at end of task block
6. **Requirements at subtask level**: `_Requirements: X.X_` per subtask

### VERIFY Syntax

| Form | Example |
|------|---------|
| Exit code | `**VERIFY**: \`npm run build\` exits 0` |
| Test count | `**VERIFY**: \`pytest tests/\` exits 0, 8 tests PASS` |
| Output contains | `**VERIFY**: \`curl localhost:3000/health\` contains "ok"` |
| Output matches | `**VERIFY**: \`curl localhost/version\` matches "\\d+\\.\\d+"` |
| Compound | `**VERIFY**: \`npm run lint\` exits 0 AND \`npm run build\` exits 0` |
| File exists | `**VERIFY**: \`test -f src/models.py\` exits 0` |

**Rules:**
- Deterministic: same code → same result
- Self-contained: works from project root
- Specific: executable command, not a wish
- At subtask level: never on parent tasks

### Checkpoint Syntax

```markdown
- [ ] **checkpoint**: {description}
  - **VERIFY_ALL**:
    - `{cmd}` exits 0
    - `{cmd}` exits 0, N tests PASS
  - **CANNOT_VERIFY**:
    - {what} — REASON: {why} — REQUIRES: {human action}
  - **GOLD_TEST**: run all gold tests
  - [HITL] Review evidence + approve
```

Checkpoints aggregate verification and run gold tests. Place at natural integration boundaries.

### Simplify Block

```markdown
- [ ] **simplify**: Post-checkpoint cleanup for tasks N-M
  - **CONSTRAINT**: All behavior preserved. No functional changes.
  - **VERIFY**: `{full suite}` exits 0 (same count as pre-simplify)
```

Simplifier can rename, extract, remove dead code — but all VERIFY must still pass.

### Status Markers

| Marker | Meaning |
|--------|---------|
| `[ ]` | Pending |
| `[x]` | Completed + verified |
| `[-]` | In progress |
| `[FAILED]` | VERIFY failed (with attempt count) |
| `[BLOCKED]` | Waiting on dependency |

### Task Display Example

```
Feature: my-feature
Phase: 1-backend
Spec Anchor: REST API with PostgreSQL + auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[x] 1. Project setup                     [VERIFIED]
[-] 2. Database models                    [IN PROGRESS]
    [x] 2.1 Base models                   [VERIFIED]
    [-] 2.2 Migration                     [FAILED: 2/3]
    [ ] 2.T Model tests                   [BLOCKED]
[ ] 3. CRUD endpoints                     [BLOCKED by 2]
--- checkpoint ---                        [BLOCKED]

Progress: 3/8 subtasks (37%)
Gold tests: 0/3 passing
```

---

## 4. Gold Test Format

### gold-tests.md Structure

```markdown
# Gold Tests: {feature}

Killer scenarios that prove the feature works. Add-only — never delete.

## GT-1: {Scenario Name}
**Added**: Phase {N}
**Description**: {1-2 sentences describing end-to-end scenario}
**Steps**:
1. {step}
2. {step}
3. {step}
**VERIFY**: `{command}` exits 0
**Expected**: {what success looks like}

## GT-2: {Scenario Name}
...
```

### Rules

1. **2-5 scenarios** defined during spec phase with user input
2. **End-to-end**: Gold tests cross component boundaries
3. **Add-only**: New phases can add gold tests, never remove existing
4. **Run at boundaries**: checkpoint, simplify, phase transition
5. **Failure = stop**: Gold test failure halts all work
6. **User tests**: Any test the user requests → immediately add to gold-tests.md

### When Gold Tests Run

| Trigger | Action on Fail |
|---------|---------------|
| Checkpoint | Block phase progress |
| Post-simplify | Revert simplification |
| Phase boundary | Block next phase |
| `/xiro test` | Report to user |

### Example

```markdown
# Gold Tests: auth-system

## GT-1: Full Login Round-Trip
**Added**: Phase 1
**Description**: User registers, logs in, accesses protected endpoint, logs out.
**Steps**:
1. POST /auth/register with valid data
2. POST /auth/login with same credentials
3. GET /api/me with returned token
4. POST /auth/logout
5. GET /api/me with same token → expect 401
**VERIFY**: `pytest tests/gold/test_login_roundtrip.py -v` exits 0
**Expected**: All 5 steps pass sequentially

## GT-2: Invalid Credentials Rejection
**Added**: Phase 1
**Description**: System rejects bad credentials without leaking info.
**Steps**:
1. POST /auth/login with wrong password
2. POST /auth/login with nonexistent email
3. Compare error messages (must be identical)
**VERIFY**: `pytest tests/gold/test_invalid_creds.py -v` exits 0
**Expected**: Same 401 response for both cases
```

---

## 5. spec-anchor.md Format

Immutable summary generated once. Re-read before every major decision.

```markdown
# Spec Anchor (IMMUTABLE)
Feature: {name}
Goal: {1 sentence}
Critical constraints: {comma-separated}
Phases: {N} — {phase-1}, {phase-2}, ...
Verification: {key commands}
```

Never modify after creation. 3-5 lines max.

---

## 6. input.md Format

Output of `/xiro interview`. Free-form but structured.

```markdown
# Feature Input: {name}

## Problem
{What problem does this solve?}

## Users
{Who uses this? What are their needs?}

## Requirements
{Functional requirements gathered from interview}

## Constraints
{Technical constraints, business rules, deadlines}

## Out of Scope
{What this feature explicitly does NOT include}

## Gold Test Ideas
{User's initial thoughts on killer test scenarios}
```
