# Spec Format Reference

Canonical format guide for `project.md`, `spec.md`, `requirements.md`, `design.md`, `tests.md`, and `gold-tests.md`.

Xiro is BDD-driven:

- `spec.md` defines scope and phases
- `requirements.md` defines scenarios
- `design.md` explains the technical approach for those scenarios
- `tests.md` turns each `THEN` into an executable slice
- `gold-tests.md` proves the feature works end-to-end

---

## 1. `spec.md` Format

### Purpose

`spec.md` is the top-level source of truth for the feature. It replaces the old `spec-anchor.md` pattern by carrying a short immutable summary section that all phase docs copy at the top.

### Document Structure

```markdown
# Spec: {feature-name}

## Summary (IMMUTABLE COPY SOURCE)
- Goal: {1 sentence}
- Non-goals: {comma-separated}
- Critical constraints: {comma-separated}
- Phase outline: {Phase 1 name}, {Phase 2 name}, ...
- Gold test candidates: {short list}

## Problem
What is being solved and why now.

## Users and Must-Work Journeys
- User type: {who}
- Must-work journey: {high-value flow}

## Non-goals
- {explicitly out of scope}

## Critical Constraints
- {technical, regulatory, business, UX, or integration constraint}

## Phase Plan
### Phase 1: {name}
- Outcome:
- Scenario focus:

### Phase 2: {name}
- Outcome:
- Scenario focus:

## Gold Test Candidates
- GT-1: {business journey}
- GT-2: {business journey}
```

### Rules

- The summary section is short and stable
- The summary is copied verbatim into each phase document
- Phase names should follow user-visible milestones, not internal implementation layers
- Gold test candidates are business journeys, not low-level checks

---

## 2. `requirements.md` Format

### Purpose

`requirements.md` captures phase-scoped BDD scenarios. It is not a list of generic requirements and it is not a task list.

### Document Structure

```markdown
# Requirements: Phase N — {name}

## Spec Summary
> (copied verbatim from `spec.md` summary)

## Scope Notes
- Included:
- Excluded:

## Scenarios

### Scenario S1: {scenario title}
**Goal**: {why this user behavior matters}
**Actors**: {who is involved}

**GIVEN**
- {precondition}
- {precondition}

**WHEN**
- {single triggering action}

**THEN**
- S1.T1 {observable outcome}
  - VERIFY_BY: automated ({short method hint})
- S1.T2 {observable outcome}
  - VERIFY_BY: hitl ({why human verification is required})
  - HITL_ACTION: {specific human steps}

### Scenario S2: {scenario title}
...
```

### Scenario Rules

1. `GIVEN` describes preconditions only.
2. `WHEN` describes one user or system trigger.
3. `THEN` describes observable outcomes only.
4. Each `THEN` gets a stable ID such as `S2.T3`.
5. `THEN` is the progress unit used later in `tests.md`.
6. If one `THEN` is too large or mixes multiple outcomes, split it here.
7. Keep scenarios user-visible. Avoid implementation details such as component names, function names, and database tables.

### Verification Classification

Each `THEN` declares its intended verification mode.

**Automated example**

```markdown
- S1.T1 The displayed count increases by 1
  - VERIFY_BY: automated (playwright: click increment button and assert visible text)
```

**HITL example**

```markdown
- S3.T2 The drag animation feels smooth while reordering cards
  - VERIFY_BY: hitl (subjective animation quality)
  - HITL_ACTION: Open the board -> drag a card -> confirm no jank or snapping
```

### Counter Example

```markdown
### Scenario S1: Increment Counter
**Goal**: User can increase the counter while under the upper bound
**Actors**: End user

**GIVEN**
- The current number is 100 or less

**WHEN**
- The user presses the `+` button

**THEN**
- S1.T1 The displayed number increases by 1
  - VERIFY_BY: automated (web-ui click and visible text assertion)
- S1.T2 The updated number remains visible after the click interaction completes
  - VERIFY_BY: automated (DOM assertion after event loop settles)
```

### Boundary Example

```markdown
### Scenario S2: Prevent Increment Beyond Maximum
**Goal**: User cannot push the counter beyond its supported bound
**Actors**: End user

**GIVEN**
- The current number is 101

**WHEN**
- The user presses the `+` button

**THEN**
- S2.T1 The displayed number stays at 101
  - VERIFY_BY: automated (assert no visible count change)
- S2.T2 The UI explains that the maximum value has been reached
  - VERIFY_BY: automated (toast, inline text, or status message assertion)
```

### Bugfix Example

```markdown
### Scenario S7: Restore Deleted Draft Warning
**Goal**: User sees the missing warning again after reopening the editor
**Actors**: Editor user

**GIVEN**
- A draft has unsaved changes
- The known regression is present in the current build

**WHEN**
- The user closes and reopens the editor

**THEN**
- S7.T1 The bug is reproducible before the fix in the baseline build
  - VERIFY_BY: automated (reproduction script or regression test)
- S7.T2 The warning is shown after the fix
  - VERIFY_BY: automated (UI or API assertion)
- S7.T3 Existing save behavior remains unchanged
  - VERIFY_BY: automated (unchanged-behavior regression test)
```

---

## 3. `design.md` Format

### Purpose

`design.md` explains only the technical structure needed to satisfy the phase scenarios. It is narrower than the old broad architecture document and must stay traceable to specific scenarios and `THEN` slices.

### Document Structure

```markdown
# Design: Phase N — {name}

## Spec Summary
> (copied verbatim from `spec.md` summary)

## Overview
1-2 paragraph approach summary.

## Scenario Coverage
| Scenario | Key components | Primary risks |
|----------|----------------|---------------|
| S1 | CounterView, CounterStore | upper-bound drift |

## Architecture
System or UI flow diagram plus component relationships.

## Components and Interfaces
Per-component responsibilities and contracts.

## Testability and Automation Strategy
What is automated, what is HITL, and why.

## Frontend Interaction Strategy
Web, Flutter, or mobile-specific automation choices.

## CANNOT_VERIFY Items
What still needs human verification.

## Simplification Targets
Possible cleanup after scenario checkpoints.
```

### Component Template

```markdown
### CounterStore

**File**: `src/counter/store.ts`
**Purpose**: Owns counter state and enforces numeric bounds.
**Scenarios**: S1, S2, S3
**Slices**: S1.T1, S2.T1, S3.T1
**Testability**: HIGH
**Automation**: unit + Playwright-visible state assertions
**Dependencies**: none
```

### Frontend Strategy Example

```markdown
## Frontend Interaction Strategy

### Web
- Use Playwright for button clicks, visible text assertions, and disabled-state checks
- Use semantic selectors or test ids instead of brittle CSS chains

### Flutter
- Prefer `integration_test` for stable tap/assert flows
- Use semantics labels for tappable controls
- Reserve HITL for animation feel or platform-native integrations that are impractical to automate
```

---

## 4. `tests.md` Format

### Purpose

`tests.md` is the execution document. It replaces `tasks.md` as the primary artifact used by `/xiro run`.

Each entry maps to one `THEN` slice. The document must be executable, not aspirational.

`tests.md` also carries repo binding state for execution:

- `Repo: auto` means xiro will choose a repo later
- `Repo: {path}` means the slice is already bound to that repo path relative to the workspace root

### Document Structure

```markdown
# Tests: Phase N — {name}

## Spec Summary
> (copied verbatim from `spec.md` summary)

## Verification Environment
| Purpose | Command | Expected |
|---------|---------|----------|
| Build | `{cmd}` | exits 0 |
| Lint | `{cmd}` | exits 0 |
| Primary UI test | `{cmd}` | exits 0 |

## Scenario Progress
| Scenario | THEN slices | Status |
|----------|-------------|--------|
| S1 | S1.T1, S1.T2 | 0/2 complete |

## THEN Slices

- [ ] S1.T1 {slice title}
  - Scenario: S1
  - Goal: {user-visible outcome}
  - Repo: auto
  - Depends: none
  - Surface: web-ui
  - Setup:
    - `{cmd}`
  - Method: Playwright
  - Steps:
    1. {step}
    2. {step}
  - Assertions:
    - {observable result}
    - {observable result}
  - **VERIFY**: `{command}` exits 0
  - **EVIDENCE**: `.xiro/{feature}/evidence/phase-{N}/slices/S1.T1/verify.log`

- [ ] S1.T2 {slice title}
  ...

- [ ] **checkpoint**: {description}
  - Scope: S1, S2
  - **VERIFY_ALL**:
    - `{cmd}` exits 0
    - `{cmd}` exits 0
  - **GOLD_TEST**: run all gold tests up to the current phase
  - [HITL] Review evidence + approve
```

### Required Slice Fields

Every slice entry must include:

1. Scenario ID / THEN ID
2. Goal in user-visible language
3. Repo binding (`auto` or a workspace-relative repo path)
4. Dependencies on earlier slices
5. Target surface (`web-ui`, `flutter-ui`, `api`, `cli`, etc.)
6. Setup command(s)
7. Execution method
8. Explicit interaction steps
9. Assertions / expected outcomes
10. Evidence command or artifact path
11. Status checkbox

### Slice Rules

- One slice maps to one `THEN`
- Keep the slice small enough to complete and verify in one focused run
- Do not create vague entries such as "implement counter page"
- Batching is an orchestration optimization, not an authoring excuse
- Frontend entries must include explicit interaction steps, not just assertions
- `Setup` and `VERIFY` commands run from the slice's bound repo root, not from the workspace root

### Counter Example

```markdown
- [ ] S1.T1 Increment under max bound
  - Scenario: S1
  - Goal: User sees `41` become `42`
  - Repo: apps/counter
  - Depends: none
  - Surface: web-ui
  - Setup:
    - `npm install`
    - `npm run dev`
  - Method: Playwright
  - Steps:
    1. Open `/counter`
    2. Confirm the visible count is `41`
    3. Click the `+` button once
  - Assertions:
    - Visible count becomes `42`
    - No upper-bound warning is shown
  - **VERIFY**: `npx playwright test tests/e2e/counter.spec.ts --grep "S1.T1"` exits 0
  - **EVIDENCE**: `.xiro/counter/evidence/phase-1/slices/S1.T1/verify.log`

- [ ] S3.T1 Decrement above min bound
  - Scenario: S3
  - Goal: User sees `10` become `9`
  - Repo: apps/counter
  - Depends: none
  - Surface: web-ui
  - Setup:
    - `npm run dev`
  - Method: Playwright
  - Steps:
    1. Open `/counter`
    2. Seed the UI at `10`
    3. Click the `-` button once
  - Assertions:
    - Visible count becomes `9`
    - No lower-bound warning is shown
  - **VERIFY**: `npx playwright test tests/e2e/counter.spec.ts --grep "S3.T1"` exits 0
  - **EVIDENCE**: `.xiro/counter/evidence/phase-1/slices/S3.T1/verify.log`
```

### Web Frontend Example

```markdown
- [ ] S5.T2 Save button persists changes
  - Scenario: S5
  - Goal: User sees saved content after reload
  - Repo: apps/profile-web
  - Depends: S5.T1
  - Surface: web-ui
  - Setup:
    - `pnpm install`
    - `pnpm dev`
  - Method: Playwright
  - Steps:
    1. Open `/settings/profile`
    2. Fill the display-name field with `Taylor`
    3. Click `Save`
    4. Reload the page
  - Assertions:
    - The field value remains `Taylor`
    - A success confirmation is visible before reload
  - **VERIFY**: `pnpm playwright test tests/gold/profile-save.spec.ts --grep "S5.T2"` exits 0
  - **EVIDENCE**: `.xiro/profile/evidence/phase-2/slices/S5.T2/verify.log`
```

### Flutter Example

```markdown
- [ ] S8.T1 Tap increment FAB in Flutter
  - Scenario: S8
  - Goal: User sees `0` become `1`
  - Repo: apps/flutter-counter
  - Depends: none
  - Surface: flutter-ui
  - Setup:
    - `flutter pub get`
  - Method: Flutter integration test
  - Steps:
    1. Launch the app in the integration test harness
    2. Find the widget with semantics label `counter-increment`
    3. Tap once
  - Assertions:
    - Text `1` is visible
    - No error banner is shown
  - **VERIFY**: `flutter test integration_test/counter_test.dart --plain-name "S8.T1"` exits 0
  - **EVIDENCE**: `.xiro/flutter-counter/evidence/phase-1/slices/S8.T1/verify.log`
```

### Bugfix Example

```markdown
- [ ] S7.T1 Reproduce missing warning bug
  - Scenario: S7
  - Goal: Capture the current broken behavior honestly
  - Repo: apps/editor
  - Depends: none
  - Surface: web-ui
  - Setup:
    - `pnpm dev`
  - Method: Playwright
  - Steps:
    1. Open the editor
    2. Change the draft
    3. Close and reopen the editor
  - Assertions:
    - Warning is missing in the baseline build
  - **VERIFY**: `pnpm playwright test tests/regression/draft-warning.spec.ts --grep "S7.T1"` exits 0
  - **EVIDENCE**: `.xiro/editor/evidence/phase-3/slices/S7.T1/baseline.log`

- [ ] S7.T2 Warning returns after fix
  - Scenario: S7
  - Goal: Show the fix works
  - Repo: apps/editor
  - Depends: S7.T1
  - Surface: web-ui
  - Setup:
    - `pnpm dev`
  - Method: Playwright
  - Steps:
    1. Repeat the reproduction flow
  - Assertions:
    - Warning is visible after reopening
  - **VERIFY**: `pnpm playwright test tests/regression/draft-warning.spec.ts --grep "S7.T2"` exits 0
  - **EVIDENCE**: `.xiro/editor/evidence/phase-3/slices/S7.T2/verify.log`

- [ ] S7.T3 Save flow still works
  - Scenario: S7
  - Goal: Guard unchanged behavior
  - Repo: apps/editor
  - Depends: S7.T2
  - Surface: web-ui
  - Setup:
    - `pnpm dev`
  - Method: Playwright
  - Steps:
    1. Open the editor
    2. Save a valid draft
  - Assertions:
    - Save succeeds
    - No unexpected warning blocks the flow
  - **VERIFY**: `pnpm playwright test tests/regression/draft-warning.spec.ts --grep "S7.T3"` exits 0
  - **EVIDENCE**: `.xiro/editor/evidence/phase-3/slices/S7.T3/verify.log`
```

### Status Markers

| Marker | Meaning |
|--------|---------|
| `[ ]` | Pending |
| `[x]` | Completed + verified |
| `[-]` | In progress |
| `[FAILED]` | Verification failed |
| `[BLOCKED]` | Waiting on dependency |

---

## 5. `gold-tests.md` Format

### Purpose

`gold-tests.md` contains the add-only acceptance suite. These are full business journeys, not single-slice checks.

### Document Structure

```markdown
# Gold Tests: {feature}

## GT-1: {scenario name}
**Added**: Phase {N}
**Business context**: {why this journey matters}
**Related scenarios**: S1, S3, S5

### Prerequisites
- {app running}
- {seed data ready}

### Execution Steps
1. {step}
2. {step}
3. {step}

### Expected Results
- {user-visible outcome}
- {state change}

### VERIFY
`{command}` exits 0
```

### Rules

1. Define 2-5 gold tests with the user
2. Gold tests cross scenario boundaries
3. New phases may add tests but never weaken or delete old ones
4. Run gold tests at checkpoints, simplify boundaries, and phase boundaries
5. Failure halts progress and escalates immediately

Gold test `VERIFY` commands run from the repo implied by the relevant bound slices. If that is ambiguous, resolve the repo before execution and log the decision.

---

## 6. `project.md` Format

### Purpose

`project.md` is the output of `/xiro new`. It captures raw user intent before scenario shaping and serves as the direct input to `/xiro spec`.

### Document Structure

```markdown
# Project: {name}

## Problem
{what problem is being solved}

## Users
{who uses this}

## Desired Behaviors
- {plain-language behavior}

## Candidate Scenarios
- {must-work journey}

## Constraints
- {technical or business constraint}

## Out of Scope
- {explicitly excluded}

## Gold Test Ideas
- {acceptance journey}
```
