---
name: xiro status
description: Show phase progress, verification state, and pending HITL
---

# /xiro status

Show current project status.

## Procedure

1. **Read project info**:
   ```bash
   node xiro/bin/xiro-tools.cjs status
   ```

2. **Read active phase tasks.md** and parse progress.

3. **Present formatted status**:

```
Feature: {name}
Phase: {N}-{name}  [{status}]
Spec Anchor: {1-line summary}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[x] 1. Task title                    [VERIFIED]
[-] 2. Task title                    [IN PROGRESS]
    [x] 2.1 Subtask                  [VERIFIED]
    [-] 2.2 Subtask                  [FAILED: 2/3]
    [ ] 2.T Tests                    [BLOCKED]
[ ] 3. Task title                    [BLOCKED by 2]
--- checkpoint ---                   [PENDING]

Progress: X/Y subtasks (Z%)
Gold tests: X/Y passing
Evidence: .xiro/evidence/phase-{N}/
Pending HITL: {list or "none"}
```

4. **Show recent events** from ledger (last 10).

5. **Show any blockers or escalations**.
