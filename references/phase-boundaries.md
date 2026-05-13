# Phase Boundaries

Xiro commands are phase-bound. A command may create only the artifacts for its own phase and must not automatically advance to the next Xiro phase.

If the user says "implement the plan" while the active phase is `/xiro new` or `/xiro spec`, interpret it as "create the artifacts for the current Xiro phase only." Do not continue to the next Xiro command unless the user explicitly asks for that command after the current phase artifacts exist.

## `/xiro new` Artifact Boundary

Allowed outputs:

- `.xiro/{feature}/project.md`
- `.xiro/{feature}/brief.md`
- `.xiro/{feature}/state.md`
- optional `.xiro/{feature}/decisions.md`

Forbidden outputs:

- `.xiro/{feature}/spec.md`
- `.xiro/{feature}/plan.md`
- `.xiro/{feature}/phases/**`
- `.xiro/{feature}/agent/**`
- `.xiro/{feature}/gold-tests.md`
- app directories
- package files
- product code
- implementation tests
- routes
- database schemas
- runtime config
- package installation
- server startup
- Coder or Tester worker execution

Stop condition:

- `project.md`, `brief.md`, and initial `state.md` exist.
- `state.md` may claim only that the project contract exists.
- `state.md` must say implementation has not started, no acceptance proof has passed, and runtime reachability has not been verified.
- The next recommended step may be `/xiro spec <feature>` if the project is spec-ready, but `/xiro new` must not run it.

## `/xiro spec` Artifact Boundary

Allowed outputs:

- refresh `.xiro/{feature}/brief.md`
- `.xiro/{feature}/spec.md`
- `.xiro/{feature}/plan.md`
- `.xiro/{feature}/phases/{N}-{slug}/requirements.md`
- `.xiro/{feature}/phases/{N}-{slug}/design.md`
- optional `.xiro/{feature}/phases/{N}-{slug}/slices.md` projection
- `.xiro/{feature}/agent/agents.json`
- `.xiro/{feature}/agent/slices.json`
- `.xiro/{feature}/agent/evidence.json`
- optional `.xiro/{feature}/agent/events.jsonl`
- `.xiro/{feature}/gold-tests.md`
- update `.xiro/{feature}/state.md`

Forbidden outputs:

- app directories
- package files
- product code
- implementation tests
- routes
- database schemas
- runtime config
- package installation
- server startup
- Coder or Tester worker execution
- acceptance proof execution as a completion claim

Stop condition:

- spec, phase docs, agent execution contracts, gold tests, and planned-only `state.md` exist.
- `state.md` may claim that contracts were generated.
- `state.md` must say no slice has been implemented, no acceptance proof has passed, and runtime reachability has not been verified.
- The next recommended step may be `/xiro run <feature>`, but `/xiro spec` must not run it.

## Boundary Violations

If `/xiro new` tries to enter `/xiro spec`, or `/xiro spec` tries to enter `/xiro run` or product implementation, stop immediately with:

```text
BLOCKED: xiro phase boundary violation
```

Do not continue the next phase. If accidental non-Xiro artifacts were created in the same run, remove only artifacts that are clearly attributable to the current mistaken run and safe to remove. Otherwise, list them for user review.

When a valid `state.md` exists, record the boundary violation as a warning.
