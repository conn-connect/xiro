---
name: xiro plan-phase
description: Generate phased spec pack (requirements + design + tasks + gold-tests)
---

# /xiro plan-phase {N}

You are the MC. Your role is to coordinate spec generation, NOT to write specs yourself.

## Arguments

- `{N}` — Phase number to plan (required)

## Procedure

1. **Read context**:
   - `.xiro/spec-anchor.md` — re-read before every decision
   - `.xiro/REQUIREMENTS.md` — user requirements
   - `.xiro/shared.md` — existing gotchas
   - `.xiro/gold-tests.md` — existing gold tests
   - Previous phase specs if N > 1

2. **Spawn Planner agent** (`xiro-planner`) to generate:
   - `.xiro/phases/{N}-{name}/requirements.md` — EARS format + VERIFY_BY on every criterion
   - `.xiro/phases/{N}-{name}/design.md` — architecture + testability annotations
   - `.xiro/phases/{N}-{name}/tasks.md` — with VERIFY/CODEX_VERIFY/CANNOT_VERIFY syntax
   - `.xiro/phases/{N}-{name}/gold-tests.md` — phase-specific additions

3. **Run Codex spec review** (if external_verifier is "required" or "optional"):
   ```bash
   node xiro/bin/xiro-tools.cjs codex-review
   ```
   The engine calls Codex as an external process to review spec completeness.

4. **Create criteria-lock** for this phase:
   After HITL approval, lock the verification criteria so they cannot be weakened during execution.
   Update `.xiro/criteria-lock.json` with the approved criteria.

5. **Present to user** for HITL review:
   - Requirements summary with VERIFY_BY breakdown
   - Verification budget (automated vs. HITL ratio)
   - Task dependency graph
   - Gold test additions
   - [Approve] [Revise] [Cancel]

## Rules

- You are the MC. You spawn Planner, you do NOT write specs yourself.
- Every acceptance criterion MUST have VERIFY_BY (automated/hitl/deferred).
- Every subtask MUST have a VERIFY command.
- Every task MUST end with a test subtask (N.T).
- CANNOT_VERIFY must be declared HERE, not during execution (R3).
- Anti-placeholder: interaction-level criteria, not render-level.
- After approval, criteria are LOCKED (R4).

## After Approval

Tell the user to run `/xiro run` to start execution.
