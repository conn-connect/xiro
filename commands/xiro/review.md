---
name: xiro review
description: Open latest checkpoint summary and evidence index
---

# /xiro review

Present the latest checkpoint results and evidence for user review.

## Procedure

1. **Read latest checkpoint evidence**:
   - Find most recent checkpoint directory in `.xiro/evidence/`
   - Read gold-test-results.md, regression-results.md, cannot-verify.md

2. **Read task verification summaries**:
   - Scan verify-summary.md files in each task evidence directory

3. **Present Phase Review Guide**:

```markdown
## Phase {N} Review Guide

### Automated Results
- {X}/{Y} subtasks verified (Z%)
- Gold tests: {pass}/{total}
- Evidence: .xiro/evidence/phase-{N}/

### Requires Human Verification
1. **{CANNOT_VERIFY item}**
   - What: {description}
   - How: {step-by-step instructions}
   - Why AI can't: {reason}

### Manual Test Checklist
- [ ] {specific action to perform}
- [ ] {specific thing to observe}
- [ ] {specific outcome to confirm}

### Deliverables
- {user-visible output 1}
- {user-visible output 2}

### Options
- [Approve] → proceed to next phase
- [Fix] → specify what to fix
- [Stop] → halt development
```

4. **Log decision** to `.xiro/evidence/decisions.log` based on user response.
