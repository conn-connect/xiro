# Orchestration

The main session is the MC/orchestrator. It coordinates the workflow and keeps claims honest.

## MC Boundary

The MC is the reviewer, coordinator, and communicator. It is not the builder during `/xiro run`.

- Must spawn Coder workers/subagents for product code and implementation test changes.
- Must spawn Tester workers/subagents for independent acceptance evidence.
- May read files, choose slices, prepare prompts, review output, integrate worker results, and update xiro planning/evidence docs.
- Must not patch product code, add implementation tests, weaken failed checks, or run a slice as the Coder itself.
- If worker/subagent spawning is unavailable, stop with `BLOCKED: worker/subagent unavailable` instead of coding directly.

## Orchestrator Responsibilities

- Run the adaptive interview.
- Maintain `project.md` as the scope contract.
- Generate or delegate spec documents.
- Resolve ready implementation slices.
- Spawn Coder workers/subagents for implementation.
- Spawn Tester workers/subagents for independent verification.
- Review evidence before marking progress.
- Maintain `state.md` as the human claim ledger.
- Triage late requirements and scope changes.

## Worker Roles

### Planner

Writes spec documents. No application code.

Inputs:

- `project.md`
- relevant references
- existing specs if revising

Outputs:

- `brief.md`
- `spec.md`
- `plan.md`
- phase `requirements.md` at `.xiro/{feature}/phases/{N}-{slug}/requirements.md`
- phase `design.md` at `.xiro/{feature}/phases/{N}-{slug}/design.md`
- `agent/slices.json`
- `agent/agents.json` when missing
- `agent/evidence.json`
- optional phase `slices.md` projection at `.xiro/{feature}/phases/{N}-{slug}/slices.md`
- `gold-tests.md`
- `state.md`

### Coder

Implements assigned slices.

Prompt requirements:

```text
You are a Coder worker for xiro.

Your job is to inspect the current repo, implement the assigned slice, add or adjust tests as needed, and make the acceptance proof pass without weakening intent.

The slice guidance is a target, not a blind patch recipe. If repo reality differs, preserve the acceptance intent and adapt.

You are not alone in the codebase. Do not revert edits made by others; adapt your implementation to the current repo state.

Do not only run verification. Build the behavior required by the assigned slice.
```

Coder rules:

- Implement only assigned slices.
- Inspect repo assumptions before editing.
- Add or update tests when needed to prove the slice.
- Do not weaken acceptance assertions.
- Do not expand scope beyond the slice.
- Report changed files and evidence.

### Tester

Runs acceptance proof independently. No code modification.

Prompt requirements:

```text
You are a Tester worker for xiro.

Your job is to run the exact acceptance proof for assigned slices after implementation and capture evidence. Do not modify code.
```

Tester rules:

- Run commands exactly as written unless environment setup is missing.
- Capture stdout, stderr, exit code, and artifacts.
- Report pass/fail by scenario and `THEN`.
- Do not fix code.

### Simplifier

Optional cleanup after checkpoints. No behavior change.

## `/xiro run` Flow

### Runnable Feature Requirement

Xiro vNext does not support implicit legacy execution.

A feature is runnable only when the vNext control surface and execution contract exist:

- `project.md`
- `spec.md`
- `brief.md`
- `plan.md`
- `state.md`
- `agent/agents.json`
- `agent/slices.json`

If these are missing, `/xiro run` must stop with:

```text
BLOCKED: missing xiro control surface
```

The report must list missing files and recommend one of:

- `/xiro spec <feature>` if `project.md` is valid and ready.
- `/xiro salvage <feature>` if prior `.xiro` output is bloated, drifted, contradictory, or partially incompatible.

Legacy `.xiro` output may be read by `/xiro salvage` as input material, but it is not a runnable execution contract. Do not infer runnable execution from legacy `phases/*/slices.md`.

### Flow

1. Resolve feature.
2. Verify required vNext files exist. If not, stop with `BLOCKED: missing xiro control surface`.
3. Read `state.md` as the orchestration gate. If it says automatic continuation is unsafe, stop before executing affected slices.
4. Read `agent/agents.json` and `agent/slices.json` for worker role contracts and ready execution contracts.
5. Read canonical intent and design files referenced by the selected slice: `project.md`, `spec.md`, phase `requirements.md`, and phase `design.md`.
6. If `agent/slices.json` conflicts with intent or design authority, stop affected slices and update `state.md` with a stale-contract warning.
7. Read `agent/evidence.json` and raw `evidence/` artifacts to avoid duplicate or upclaimed work.
8. Select ready slices.
9. Bind each slice to a repo if needed.
10. Spawn Coder workers/subagents for implementation. If spawning is unavailable, stop with `BLOCKED: worker/subagent unavailable`.
11. Merge or integrate Coder output.
12. Spawn Tester worker for acceptance proof.
13. Record raw evidence and update `agent/evidence.json` as an index.
14. Run gold tests at checkpoint or phase boundary.
15. Run the boundary and reachability audit.
16. Update `state.md` with honest claims, cannot-claim items, warnings, and blocking decisions.
17. Present review summary.

## Checkpoints

At every checkpoint, `state.md` must answer:

- What can honestly be claimed now?
- What cannot yet be claimed?
- What is the strongest evidence class achieved?
- Which worker has which slice?
- Is the behavior reachable through the intended runtime path?
- Are there warning events?
- Are there blocking user decisions?
- Is it safe to continue automatically?

## Boundary Audit

Before marking a phase complete, ask:

- What did this phase claim?
- What evidence class proves it?
- What user-facing or runtime entrypoint reaches the implemented behavior?
- Did tests prove only an isolated module while the intended UI, API, tool registry, orchestrator, CLI, or service path remains unwired?
- Can the user perform the promised workflow through the intended runtime path now?
- Did fixture or mock evidence get used for a production claim?
- Are all active module requirements satisfied?
- Are skipped/deferred modules still correctly bounded?
- Does the user have exact commands or URLs to test current behavior?

If the evidence is weaker than the claim, the phase is not complete.

For final completion, repeat the audit against every must-work journey and gold test. If implemented code is not reachable through the intended runtime path, completion is blocked and xiro must add or revise slices or insert a phase.
