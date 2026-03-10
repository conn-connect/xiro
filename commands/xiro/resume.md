---
name: xiro resume
description: Resume from persisted state after interruption
---

# /xiro resume

Resume a xiro run from persisted state. Used after session interruption, context compaction, or manual pause.

## Procedure

1. **Restore context** (in this exact order):
   a. Read `.xiro/spec-anchor.md` — restore goal
   b. Read `.xiro/STATE.md` — current status
   c. Read active phase `tasks.md` — see progress
   d. Run: `node xiro/bin/xiro-tools.cjs status` — engine state
   e. Run: `node xiro/bin/xiro-tools.cjs memory` — memory summary
   f. Read `.xiro/shared.md` — recall gotchas
   g. Read `.xiro/evidence/decisions.log` — past decisions

2. **Report to user**:
   - What was happening when interrupted
   - Current phase and task progress
   - Any pending HITL decisions
   - Any blockers or escalations
   - Recommended next action

3. **Options**:
   - [Continue] → `/xiro run --from-checkpoint` to resume execution
   - [Status] → `/xiro status` for detailed view
   - [Review] → `/xiro review` for evidence review

## Key Principle

Memory continuity does NOT depend on MC internal recall.
Everything is reconstructible from disk:
- `ledger/events.ndjson` — canonical event source
- `state/run-state.json` — execution state
- `memory/latest.md` — human-readable summary
- `evidence/` — all verification records
