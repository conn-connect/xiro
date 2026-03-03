# Orchestration Reference

How xiro coordinates workers, manages execution, and maintains consistency.

---

## 1. Orchestrator Role

The orchestrator (main session) is the MC — reviewer, coordinator, communicator. Never a builder.

### DO
- Read specs and decide phase structure
- Review worker outputs (specs, code, evidence)
- Run VERIFY commands via Bash to confirm pass/fail
- Enforce Honest Failure Protocol
- Communicate with user at HITL checkpoints
- Spawn, assign, review, merge, shut down workers

### NEVER
- Write application code → spawn Coder
- Write spec documents → spawn Planner
- Refactor or clean up code → spawn Simplifier
- Update task checkboxes → worker updates own tasks
- Interpret failures optimistically → exit code is truth

### Why
The orchestrator's context stays clean: spec anchor + phase state + verification criteria. Workers hold implementation context. This separation prevents drift and keeps evaluation objective.

---

## 2. Worker Types and Prompts

All workers use `isolation: "worktree"` via the Task tool.

### Planner Worker

Produces requirements.md, design.md, or tasks.md for a phase.

```
Tool: Task
Parameters:
  description: "Planner: Phase {N} {layer}"
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a Planner worker for xiro spec-driven development.
    YOUR ROLE: Write {layer} for Phase {N}: {phase-name}.
    You write specifications, NOT code.

    ## Spec Anchor
    {spec-anchor.md content}

    ## Phase Scope
    {what this phase covers, boundaries, dependencies}

    ## Input
    {input.md content OR previous layer output}

    ## Format Guide
    {relevant section from spec-format.md}

    ## Rules
    - Follow the format guide exactly
    - Every requirement needs VERIFY_BY classification
    - Every subtask needs a concrete VERIFY command
    - CANNOT_VERIFY declared here, not during execution
    - Reference requirement IDs in design and tasks

    Write the document to: .xiro/{feature}/phases/{N}-{name}/{layer}.md
```

For layer-parallel spec flow, spawn Planner workers for ALL phases simultaneously:
- All requirements.md in parallel → HITL → All design.md in parallel → HITL → All tasks.md in parallel → HITL

### Coder Worker

Implements tasks and writes test code.

```
Tool: Task
Parameters:
  description: "Coder: Task {N} [{phase}]"
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a Coder worker for xiro spec-driven development.
    YOUR ROLE: Implement Task {N} and run VERIFY commands.

    ## Spec Anchor
    {spec-anchor.md content}

    ## Shared Knowledge
    {shared.md content — read this first for gotchas}

    ## Task Assignment
    {full task block from tasks.md with all subtasks and VERIFY}

    ## Design Context
    {relevant design.md excerpt}

    ## Anti-Slop Rules
    - No placeholders, stubs, "coming soon", empty bodies
    - If it's needed, implement it fully
    - If it's not needed, don't create it

    ## Working Rules
    1. Read project CLAUDE.md first
    2. Implement subtasks in order (N.1, N.2, ... N.T)
    3. Run VERIFY after each subtask
    4. If VERIFY fails: fix and retry (max 3 attempts)
    5. After 3 failures: report FAIL with all evidence
    6. N.T test subtask is MANDATORY
    7. Do NOT modify files outside task scope
    8. Do NOT weaken VERIFY commands
    9. Add discovered gotchas to .xiro/{feature}/shared.md
    10. Commit on completion: xiro({phase}): {task-title}

    ## Report Format
    TASK REPORT
    Task: {N} — {title}
    Status: PASS | FAIL

    Subtask results:
      {N}.1: PASS | FAIL (exit {code})
      {N}.2: PASS | FAIL
      {N}.T: PASS | FAIL ({M} tests)

    Files modified:
      - {path} (new|modified)

    Gotchas discovered:
      - {one-line fact, if any}
```

### Tester Worker

Runs verification independently. Never modifies code.

```
Tool: Task
Parameters:
  description: "Tester: Phase {P} verification"
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a Tester worker for xiro spec-driven development.
    YOUR ROLE: Run verification commands and capture evidence. NO code changes.

    ## What to Verify
    {list of VERIFY commands from completed tasks}

    ## Gold Tests
    {gold-tests.md content}

    ## Rules
    1. Run each VERIFY command exactly as written
    2. Capture full stdout + stderr + exit code
    3. Save evidence to .xiro/{feature}/evidence/
    4. Run ALL gold tests
    5. Do NOT modify any source code
    6. Do NOT modify any test code
    7. Report results honestly — exit code is truth

    ## Evidence Format
    Save to: .xiro/{feature}/evidence/phase-{P}/task-{N}/subtask-{N.M}.log

    Content:
    VERIFY: {exact command}
    TIMESTAMP: {ISO 8601}
    EXIT_CODE: {code}
    RESULT: PASS | FAIL
    ---
    {full output}

    ## Report Format
    VERIFICATION REPORT
    Phase: {P}
    Scope: Tasks {X}-{Y} + Gold Tests

    Results:
      Task {X}: {M}/{M} subtasks PASS
      Task {Y}: {M}/{M} subtasks PASS
      Gold GT-1: PASS | FAIL
      Gold GT-2: PASS | FAIL

    Evidence: .xiro/{feature}/evidence/phase-{P}/
```

### Simplifier Worker

Refactors code post-checkpoint. No behavior changes.

```
Tool: Task
Parameters:
  description: "Simplifier: Phase {P} tasks {X}-{Y}"
  subagent_type: general-purpose
  isolation: worktree
  prompt: |
    You are a Simplifier worker for xiro spec-driven development.
    YOUR ROLE: Clean up code from Tasks {X}-{Y}. NO behavior changes.

    ## Spec Anchor
    {spec-anchor.md content}

    ## Files to Review
    {aggregated list of modified files}

    ## Look For
    - Duplicated code → extract shared functions
    - Poor naming → improve clarity
    - Dead code → remove (unused imports, unreachable branches)
    - Over-complexity → simplify without changing behavior
    - Convention violations → align with project style

    ## Do NOT
    - Add features or functionality
    - Change public APIs or interfaces
    - Modify test assertions
    - Remove error handling
    - Change any observable behavior

    ## Report Format
    SIMPLIFIER REPORT
    Scope: Tasks {X}-{Y}
    Status: CHANGES_MADE | NO_CHANGES

    Changes:
      1. {file}: {what and why}
      2. {file}: {what and why}

    Behavioral impact: NONE
```

---

## 3. Batch Execution Flow

Complete sequence for `/xiro run` with multiple tasks.

```
1. PLAN
   a. Read spec-anchor.md
   b. Read tasks.md → identify READY tasks
   c. Build dependency graph
   d. Group independent tasks for parallel execution
   e. Log decision to decisions.log

2. EXECUTE (per group)
   For each task in group:
     a. Re-read spec-anchor.md
     b. Spawn Coder worker in worktree
     c. Worker implements + verifies locally
     d. Worker reports completion/failure
   Wait for ALL workers in group.

3. MERGE
   a. Merge worktrees to feature branch (sequential, by task number)
   b. On conflict: check design.md ownership, or ask user
   c. Dependency-first merge order

4. VERIFY
   a. Spawn Tester worker
   b. Run ALL completed task VERIFY commands on merged branch
   c. Run ALL gold tests
   d. PASS → continue | FAIL → escalate

5. SIMPLIFY (at checkpoint)
   a. Spawn Simplifier worker
   b. After simplification → spawn Tester for regression check
   c. Regression → revert simplification entirely
   d. Clean → accept

6. CHECKPOINT
   a. Re-read spec-anchor.md
   b. Compile evidence summary
   c. Generate phase review guide:
      - CANNOT_VERIFY items + manual test steps
      - Gold test results
      - User-visible deliverables checklist
   d. [HITL] Present to user
   e. Log decision
```

### Parallelism Rules

Tasks with no dependency edges between them run in parallel:
```
Task 2 (depends: 1), Task 3 (depends: 1) → parallel
Task 4 (depends: 2, 3) → wait for both
```

### Error Recovery

| Situation | Action |
|-----------|--------|
| Worker fails after 3 attempts | Mark FAILED, escalate at checkpoint |
| Merge conflict | Check design.md, else ask user |
| Regression after merge | Revert merge, re-assign |
| Simplifier regression | Revert all simplifier changes |
| Gold test fails | Full stop, escalate to user |
| Session interrupted | Resume: read spec-anchor + tasks.md + decisions.log |

---

## 4. Git Workflow

### Pre-flight

Before any xiro operation:
1. Verify git repo exists (not → stop with message)
2. Verify clean working tree (or stash)
3. Create feature branch: `xiro/{feature-name}`

### Branch Strategy

```
main
  └── xiro/{feature-name}          ← feature branch
        ├── (worktree: coder-task-1)   ← auto by CC
        ├── (worktree: coder-task-2)
        └── (worktree: simplifier-1)
```

Worktree branches are managed by Claude Code's `isolation: "worktree"`.

### Commit Convention

```
xiro({phase}): {task-title}
```

Examples:
```
xiro(backend): set up project structure
xiro(backend): implement user model and migration
xiro(frontend): add login form component
```

Commit after each task completion. Phase completion must have a commit.

### Version Pinning

Never use floating versions:
- No `latest` tags in Docker
- No `^` or `~` in package.json/pyproject.toml
- Pin exact versions: `"react": "18.2.0"`, `fastapi==0.109.0`

---

## 5. Shared Knowledge Protocol

### CLAUDE.md

Workers MUST read the project's CLAUDE.md (if exists) before starting any work. It contains project-specific conventions, tooling, and constraints.

### shared.md

Workers append gotchas discovered during implementation to `.xiro/{feature}/shared.md`.

**Format**: One-line facts. No explanations, no prose.

```markdown
# Shared Knowledge

- flutter analyze passes but build fails on asset references
- supabase RLS requires service_role key for admin ops
- pytest-asyncio requires mode=auto in pyproject.toml
- tailwind classes must be in safelist for dynamic generation
```

**Rules:**
- Append-only during a phase
- Read by every worker before starting
- One fact per line, dash-prefixed
- No duplicates — check before adding

---

## 6. Context Recovery

If a session is interrupted or context is compressed:

1. Read `.xiro/{feature}/spec-anchor.md` — restore goal
2. Read current phase `tasks.md` — see progress
3. Read `.xiro/{feature}/evidence/decisions.log` — understand past choices
4. Read `.xiro/{feature}/shared.md` — recall gotchas
5. Read last evidence files — determine resume point

### Anti-Drift Timing

Re-read spec-anchor.md before:
- Spawning each worker batch
- Each checkpoint evaluation
- Deciding about a failure
- Concluding any task batch
- Presenting anything to user

---

## 7. Phase Review Guide Template

At checkpoint, present this instead of bare "Phase N ready":

```markdown
## Phase {N} Review Guide

### Automated Results
- {X}/{Y} subtasks verified (Z%)
- Gold tests: {pass}/{total}
- Evidence: .xiro/{feature}/evidence/phase-{N}/

### Requires Human Verification
1. **{CANNOT_VERIFY item}**
   - What: {description}
   - How: {step-by-step instructions}
   - Why AI can't: {reason}

### Manual Test Checklist
Based on gold tests and CANNOT_VERIFY items:
- [ ] {specific action to perform}
- [ ] {specific thing to observe}
- [ ] {specific outcome to confirm}

### Deliverables
- {user-visible output 1}
- {user-visible output 2}

### Options
- [Approve] → proceed to phase {N+1}
- [Fix] → specify what to fix
- [Stop] → halt development
```

---

## 8. Interview Flow

For `/xiro interview`:

1. Ask about the problem being solved
2. Ask about users and their needs
3. Ask about functional requirements (what it should do)
4. Ask about constraints (tech stack, deadlines, existing code)
5. Ask about out-of-scope items (what it should NOT do)
6. Ask about killer test scenarios (what proves it works?)
7. Compile into `.xiro/{feature}/input.md`

Use AskUserQuestion tool for structured questions. Maximum 3-4 rounds of questions before compiling.
