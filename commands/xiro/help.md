---
name: xiro help
description: Show available xiro commands
---

# /xiro help

## xiro — Verification-enforced spec-driven development

### Core Workflow
```
/xiro new-project  →  /xiro plan-phase 1  →  /xiro run
```

### Commands

| Command | Description |
|---------|-------------|
| `/xiro new-project` | Interactive interview → spec-anchor + gold tests |
| `/xiro plan-phase N` | Generate phase spec pack (req + design + tasks) |
| `/xiro run` | Auto-run active phase (default: all tasks) |
| `/xiro run --task 2.3` | Run specific task only |
| `/xiro run --next` | Run next incomplete task |
| `/xiro status` | Show progress, failures, pending HITL |
| `/xiro resume` | Resume from persisted state |
| `/xiro review` | Latest checkpoint summary + evidence |
| `/xiro health` | Check .xiro/ integrity |

### Design Principles
- **P1**: Procedure over prompting — engine enforces, not prompts
- **P2**: No self-verification — Codex verifies, not Claude
- **P3**: Memory is a service — Haiku records, not MC
- **P4**: Phase autorun default — one command runs the phase
- **P5**: Render is not done — buttons must work, not just appear
- **P6**: Fail closed — missing verification = halt, not skip
