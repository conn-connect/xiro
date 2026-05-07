# Gold Tests

Gold tests prove end-to-end user value. They are broader than individual slices.

Use `templates/gold-tests.md` as the concrete template.

## Rules

- Define 2-5 gold tests during spec.
- Match gold tests to scope mode.
- Keep gold tests add-only by default.
- Run at checkpoints and phase boundaries.
- Failure blocks progress.
- Each gold test has an evidence class.

## Gold Test Classes

Use the classes that fit the project:

- Design review journey
- Primary user happy path
- Return and continue journey
- Production operability journey
- Source/design parity journey
- Integration/provider journey
- Deployment/runtime smoke journey
- Security/ownership journey
- Failure or unavailable-state journey

## Format

```markdown
## GT-1: {name}

**Business journey**: {what user value this proves}
**Scope mode**: {scope}
**Evidence class**: {class}
**Covers phases**: {phases}

**Steps**
1. {step}

**Expected outcome**
- {outcome}

**Acceptance proof**
- `{command}` exits 0
```

## Evidence Matching

Examples:

- A design review gold test may use `design-fixture`.
- A provider journey requires `real-provider` or an explicit manual/cannot-verify path.
- A production operability journey cannot pass from fixture data.
- A deployment journey needs runtime evidence, not only static config.

## Manual Gold Tests

Manual gold tests are allowed when automation is impractical. They must include exact steps and expected observations.
