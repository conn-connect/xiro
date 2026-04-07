# Orchestration Reference

How xiro coordinates planners, coders, testers, and simplifiers in the BDD workflow.

Xiro keeps the current worker model, but replaces `tasks.md` with `tests.md` and replaces broad task execution with `THEN`-slice execution.

---

## 1. Orchestrator Role

The orchestrator is the MC: reviewer, coordinator, and communicator. Never a builder.

### DO

- Read `spec.md`, phase `requirements.md`, `design.md`, and `tests.md`
- Decide which `THEN` slices are ready to run
- Group only genuinely independent, balanced slices for parallel execution
- Review worker output and evidence
- Run or delegate verification exactly as written in `tests.md`
- Enforce evidence-based completion
- Communicate with the user at review checkpoints

### NEVER

- Write application code
- Write `spec.md`, `requirements.md`, `design.md`, or `tests.md` directly
- Mark a slice complete without evidence
- Reword a failing `THEN` into something easier
- Report progress as "task complete" when only part of the scenario is proven

### Why

The orchestrator keeps its context focused on:

- scenario intent
- slice readiness
- evidence quality
- review communication

Workers carry implementation context. This separation reduces drift and makes status reporting honest.

---

## 2. Worker Types and Prompts

All workers use `isolation: "worktree"`.

### Planner Worker

Produces `spec.md`, `requirements.md`, `design.md`, or `tests.md`.

```text
Tool: Task
Parameters:
  description: "Planner: Phase {N} {document}"
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a Planner worker for xiro.
    YOUR ROLE: Write {document} for Phase {N}: {phase-name}.
    You write documents, NOT product code.

    ## Input
    {project.md content, spec.md content, or prior layer output}

    ## Rules
    - Follow the format guide exactly
    - `requirements.md` must use `GIVEN / WHEN / THEN`
    - Every `THEN` gets a stable ID
    - `design.md` must map scenarios to components and automation strategy
    - `tests.md` must create one executable slice per `THEN`
    - Frontend slices must include explicit interaction steps

    Write the document to:
    .xiro/{feature}/phases/{N}-{name}/{document}
```

Layer-parallel flow:

- all `requirements.md` in parallel -> HITL review
- all `design.md` in parallel -> HITL review
- all `tests.md` in parallel -> HITL review

### Coder Worker

Implements one `THEN` slice or a small balanced batch.

```text
Tool: Task
Parameters:
  description: "Coder: {slice-ids} [{phase}]"
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a Coder worker for xiro.
    YOUR ROLE: Implement only the assigned slice IDs.

    ## Spec Summary
    {copied summary from spec.md}

    ## Shared Knowledge
    {shared.md content}

    ## Assigned Slices
    {full slice blocks from tests.md}

    ## Scenario Context
    {relevant scenario blocks from requirements.md}

    ## Design Context
    {relevant design excerpt}

    ## Rules
    1. Implement only the assigned slices
    2. Do not widen scope to "finish the feature"
    3. Respect dependency order inside the batch
    4. Keep behavior aligned with the exact THEN wording
    5. Do not weaken VERIFY criteria
    6. Append new gotchas to shared.md
    7. Commit on completion: xiro({phase}): {scenario-id}/{then-id} {title}
```

### Tester Worker

Runs verification independently. Never modifies code.

```text
Tool: Task
Parameters:
  description: "Tester: {slice-ids} [{phase}]"
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a Tester worker for xiro.
    YOUR ROLE: Run the exact verification steps for the assigned slices.

    ## Assigned Slices
    {slice blocks from tests.md}

    ## Rules
    1. Run the VERIFY commands exactly as written
    2. Capture stdout, stderr, exit code, and referenced artifacts
    3. Save evidence under .xiro/{feature}/evidence/
    4. Do not modify product code or test code
    5. Report results by scenario and THEN ID
```

### Simplifier Worker

Optional cleanup after a checkpoint. No behavior changes.

```text
Tool: Task
Parameters:
  description: "Simplifier: Phase {P} checkpoint cleanup"
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a Simplifier worker for xiro.
    YOUR ROLE: Reduce duplication and improve clarity after the checkpoint.

    ## Scope
    {list of files modified by completed slices}

    ## Rules
    - No behavior change
    - No public contract change
    - No slice status changes
    - Full regression must still pass after cleanup
```

---

## 3. Batch Execution Flow

Complete sequence for `/xiro run` with multiple ready slices.

```text
1. PLAN
   a. Read spec.md summary
   b. Read current phase requirements.md
   c. Read current phase tests.md
   d. Identify READY THEN slices by dependency status
   e. Group only balanced, independent slices
   f. Log the batching decision

2. EXECUTE
   For each slice or slice-group:
     a. Re-read spec summary
     b. Spawn Coder worker in a worktree
     c. Worker implements only the assigned slice(s)
     d. Worker reports changed files and scope notes

3. MERGE
   a. Merge worktrees back in dependency order
   b. On conflict: prefer explicit ownership from design/tests docs, else ask the user

4. VERIFY
   a. Spawn Tester worker
   b. Run the exact VERIFY commands from the completed slice blocks
   c. Save evidence per slice
   d. PASS -> continue
   e. FAIL -> escalate honestly

5. UPDATE
   a. Mark each passing slice complete immediately in tests.md
   b. Update scenario progress table
   c. Append decisions to decisions.log

6. CHECKPOINT
   a. Run gold tests if the checkpoint or phase boundary requires them
   b. Compile scenario progress summary
   c. Generate review guide with CANNOT_VERIFY items and manual steps
   d. Present to user
```

### Parallelism Rules

Parallel execution is allowed only when all of these are true:

- slices have no dependency edges between them
- slices have similar effort
- slices touch disjoint or low-conflict areas
- each slice still preserves one-to-one mapping to a `THEN`

Example:

```text
S2.T1 depends on S1.T1
S2.T2 depends on S1.T1
S3.T1 depends on none

Ready batch:
- S2.T1 + S2.T2 only if they are both small and low-conflict
- S3.T1 can run in parallel with either one
```

### Error Recovery

| Situation | Action |
|-----------|--------|
| Worker fails after 3 attempts | Mark slice FAILED and escalate |
| Merge conflict | Check slice ownership in `design.md` and `tests.md`, else ask user |
| Verification fails | Keep slice incomplete and report evidence |
| Gold test fails | Full stop, escalate immediately |
| Session interrupted | Resume by reading `spec.md`, current `tests.md`, decisions.log, shared.md |

---

## 4. Git Workflow

### Pre-flight

Before any xiro operation:

1. Verify git repo exists
2. Verify the working tree is safe to use
3. Create or switch to feature branch: `xiro/{feature-name}`

### Branch Strategy

```text
main
  └── xiro/{feature-name}
        ├── worktree: s1-t1
        ├── worktree: s1-t2
        └── worktree: simplify-phase-1
```

### Commit Convention

```text
xiro({phase}): {scenario-id}/{then-id} {title}
```

Examples:

```text
xiro(counter): S1/T1 increment visible count
xiro(counter): S3/T1 decrement above min
xiro(profile): S5/T2 persist saved profile name
```

Commit after each verified slice or verified balanced batch.

---

## 5. Shared Knowledge Protocol

### Project Instructions

Workers must read the project's instruction file if it exists before starting work.

### `shared.md`

Workers append gotchas discovered during implementation to `.xiro/{feature}/shared.md`.

**Format:** one-line facts only.

```markdown
# Shared Knowledge

- playwright selectors should use data-testid for counter controls
- flutter integration tests rely on semantics labels, not visible text
- local API requires seeded sqlite database before UI verification
```

Rules:

- append-only within a phase
- no duplicates
- no paragraphs

---

## 6. Context Recovery

If the session is interrupted or compacted:

1. Read `.xiro/{feature}/spec.md`
2. Read current phase `tests.md`
3. Read `.xiro/{feature}/evidence/decisions.log`
4. Read `.xiro/{feature}/shared.md`
5. Read the last slice evidence directories

### Anti-Drift Timing

Re-read the `spec.md` summary before:

- spawning each worker batch
- deciding whether a slice is really done
- evaluating a failed VERIFY
- presenting checkpoint status

---

## 7. Status and Review Guide

`/xiro status` should report progress by scenario and slice:

```text
Phase: 1-counter
Scenario S1: 2/2 THEN slices complete
Scenario S2: 1/2 THEN slices complete
Scenario S3: 0/1 THEN slices complete
Gold tests: 1/3 passing
```

At checkpoint, present this instead of a vague readiness message:

```markdown
## Phase {N} Review Guide

### Scenario Progress
- S1: 2/2 complete
- S2: 1/2 complete

### Automated Results
- Verified slices: {X}/{Y}
- Gold tests: {pass}/{total}
- Evidence: `.xiro/{feature}/evidence/phase-{N}/`

### Requires Human Verification
1. {CANNOT_VERIFY item}
   - What:
   - How:
   - Why AI cannot verify:

### Manual Test Checklist
- [ ] {action} -> expect {outcome}
- [ ] {action} -> expect {outcome}

### Deliverables
- {user-visible capability}
- {user-visible capability}
```

---

## 8. Init-Project Flow

For `/xiro init-project`:

1. Ask about the problem being solved
2. Ask who the users are
3. Ask what must visibly work for those users
4. Ask for candidate scenarios and high-value journeys
5. Ask about constraints and out-of-scope items
6. Ask what full business journey would convince the user the feature is done
7. Compile the answers into `.xiro/{feature}/project.md`

The init-project flow should collect scenario material, not just a feature wishlist.
