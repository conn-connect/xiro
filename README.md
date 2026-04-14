# Xiro

**BDD-driven spec workflow with scenario-based requirements, `THEN`-slice execution, gold tests, and worktree isolation.**

Xiro keeps the current lightweight skill structure, but changes the working model from `requirements -> design -> tasks` to:

```
project -> spec -> requirements -> design -> tests
```

The core idea is simple:

- `project.md` is the kickoff discovery brief and input to `/xiro spec`
- `spec.md` defines the feature, phases, and critical constraints
- `requirements.md` captures user-visible scenarios in `GIVEN / WHEN / THEN`
- `design.md` explains the technical approach needed to satisfy those scenarios
- `tests.md` is the execution document, where each entry maps to one `THEN` slice
- `gold-tests.md` remains the outer acceptance suite

Xiro now supports starting from a parent workspace folder that is not itself a git repo:

- `.xiro` is always created in the current folder where you started xiro
- repo selection is delayed until a slice actually needs code changes or repo-backed verification
- each slice records its bound repo with `Repo: auto` or `Repo: path/to/repo`

## Philosophy

Xiro is no longer task-first. It is scenario-first.

- Progress is measured by `THEN`, not by broad implementation tasks
- A `THEN` must describe an observable user outcome
- `tests.md` must say exactly how to verify each `THEN`
- Gold tests validate full business journeys across scenarios

This keeps specs readable, execution concrete, and progress honest.

## Commands

| Command | Description |
|---------|-------------|
| `/xiro new` | Kickoff discovery in the current folder, generates `project.md` and candidate scenarios |
| `/xiro spec [name]` | Reads `project.md`, then generates `spec.md`, `requirements.md`, `design.md`, `tests.md` |
| `/xiro list` | Lists xiro features in the current workspace and shows progress |
| `/xiro run [feature] [slice]` | Executes one ready `THEN` slice or a small balanced batch for the chosen feature |
| `/xiro status <feature>` | Shows detailed progress for one feature |
| `/xiro test [feature] [name]` | Runs tests for one feature using the same feature-resolution rules as `run` |

## How It Works

```
/xiro new
        |
        v
  project.md
        |
        v
/xiro spec
        |
  spec.md (from project.md) -> [HITL] feature goal / constraints / phase split
        |
  Layer-parallel phase documents:
    all requirements.md -> [HITL] scenario review
    all design.md       -> [HITL] design review
    all tests.md        -> [HITL] slice/execution review
        |
  gold-tests.md -> outer acceptance suite
        |
        v
/xiro run
        |
  1. Resolve which feature to operate on
  2. Identify ready THEN slices from that feature's tests.md
  3. Bind each slice to a repo (`auto` if one candidate, ask if ambiguous)
  4. Spawn Coder worker(s) for one slice each
  5. Merge worktrees
  6. Spawn Tester worker for exact slice verification in the bound repo
  7. Update progress immediately by feature / scenario / THEN
  8. Run gold tests at checkpoints and phase boundaries
```

If the workspace has multiple incomplete xiro features, `/xiro run` without a feature name must ask which feature to continue before any work begins.

## BDD Model

Each requirement is a scenario:

```markdown
### Scenario S1: Increment Counter

**GIVEN**
- The current number is 100 or less

**WHEN**
- The user presses the `+` button

**THEN**
- S1.T1 The displayed number increases by 1
- S1.T2 The updated number remains visible after the click interaction completes
```

Key rules:

- `GIVEN` defines preconditions
- `WHEN` defines one triggering action
- `THEN` defines observable outcomes
- Each `THEN` gets a stable ID such as `S1.T1`
- Each `THEN` becomes one executable slice in `tests.md`

## `tests.md` as the Execution Artifact

`tests.md` replaces `tasks.md` as the primary execution document.

Each entry must include:

- Scenario ID / THEN ID
- User-visible goal
- Repo binding (`auto` until execution binds it)
- Dependencies on earlier slices
- Target surface (`web-ui`, `flutter-ui`, `api`, `cli`, etc.)
- Setup command(s)
- Execution method
- Explicit interaction steps
- Assertions / expected outcomes
- Evidence command or artifact path
- Status checkbox

### Web example

```markdown
- [ ] S2.T1 Increment button increases the visible count
  - Scenario: S2
  - Goal: User sees the counter go from `41` to `42`
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
    3. Click the `+` button
  - Assertions:
    - Count text becomes `42`
    - No validation error is shown
  - **VERIFY**: `npx playwright test tests/e2e/counter.spec.ts --grep "S2.T1"` exits 0
  - **EVIDENCE**: `.xiro/counter/evidence/phase-1/slices/S2.T1/verify.log`
```

### Flutter example

```markdown
- [ ] S3.T1 Minus button decreases the value on tap
  - Scenario: S3
  - Goal: User sees `10` become `9`
  - Repo: apps/counter
  - Depends: none
  - Surface: flutter-ui
  - Setup:
    - `flutter pub get`
    - `flutter test integration_test/counter_test.dart -d macos`
  - Method: Flutter integration test
  - Steps:
    1. Launch the app with the counter seeded to `10`
    2. Find the widget with semantics label `counter-decrement`
    3. Tap the widget once
  - Assertions:
    - Visible text becomes `9`
    - No lower-bound warning is shown
  - **VERIFY**: `flutter test integration_test/counter_test.dart --plain-name "S3.T1"` exits 0
  - **EVIDENCE**: `.xiro/counter/evidence/phase-1/slices/S3.T1/verify.log`
```

## Gold Tests

Gold tests are still the outer acceptance layer.

- 2-5 end-to-end business scenarios
- Add-only across phases
- Run at checkpoints and phase boundaries
- Failures halt progress and escalate immediately

Gold tests are not the daily progress unit. `THEN` slices are.

## Worker Model

Xiro keeps the current conceptual worker split:

| Worker | Role |
|--------|------|
| Planner | Writes `spec.md`, `requirements.md`, `design.md`, `tests.md` |
| Coder | Implements one `THEN` slice or a small balanced group |
| Tester | Verifies exact slice instructions from `tests.md` and runs gold tests |
| Simplifier | Optional cleanup after checkpoint, no behavior change |

## File Structure

```text
xiro/
├── SKILL.md
├── README.md
└── references/
    ├── spec-format.md
    ├── orchestration.md
    └── verification.md
```

## Generated Project Structure

When you use xiro, it creates:

```text
.xiro/{feature}/
├── project.md
├── spec.md
├── gold-tests.md
├── shared.md
├── phases/
│   ├── 1-{name}/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tests.md
│   └── 2-{name}/...
└── evidence/
    ├── decisions.log
    ├── phase-1/slices/S1.T1/...
    └── gold/gt-1.log
```

That `.xiro` tree is always created in the current folder where xiro was started, even if that folder only contains multiple git repos.

When more than one feature exists in that workspace:

- use `/xiro list` to see all features and their progress
- use `/xiro status <feature>` for one feature's detailed state
- use `/xiro run <feature>` to avoid ambiguous execution

## Reference Guides

- [spec-format.md](references/spec-format.md) — canonical formats and examples for `spec.md`, `requirements.md`, `design.md`, `tests.md`, `gold-tests.md`
- [orchestration.md](references/orchestration.md) — worker behavior, slice batching, status/review flow
- [verification.md](references/verification.md) — evidence rules, VERIFY syntax, environment-specific verification patterns

## Installation

Clone into your skill directory or symlink it there:

```bash
git clone https://github.com/conn-connect/xiro.git ~/.claude/skills/xiro
```

or

```bash
git clone https://github.com/conn-connect/xiro.git ~/xiro
ln -s ~/xiro ~/.claude/skills/xiro
```

## Requirements

- Git
- A shell environment that can run the project test/build commands
- A coding agent environment that supports worktree isolation and worker delegation

Git is required for repo-backed execution. Discovery and spec authoring can start from a non-git parent workspace.

## License

MIT
