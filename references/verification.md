# Verification

Verification happens at the slice level and at the gold-test level.

## Honest Failure Rules

- No evidence means not done.
- Exit code truth matters: non-zero is failure.
- Timeouts and crashes are failures.
- `cannot-verify` must be declared, not invented after a failed command.
- Do not weaken a `THEN` or acceptance proof to make progress look complete.

## Acceptance Proof

Every implementation slice includes an acceptance proof.

Forms:

- `npm test -- --grep "S1.T1"` exits 0
- `pytest tests/test_feature.py -k S1_T1` exits 0
- `curl http://localhost:3000/health` contains `ok`
- Manual steps with exact expected observations

## Evidence Format

Store evidence under:

```text
.xiro/{feature}/evidence/phase-{N}/slices/{THEN-ID}/
```

Recommended files:

- `verify.log`
- `summary.md`
- screenshots or artifacts if relevant

`verify.log` format:

```text
SLICE: S1.T1
COMMAND: {exact command}
TIMESTAMP: {ISO 8601}
EXIT_CODE: {code}
RESULT: PASS | FAIL
EVIDENCE_CLASS: {class}
---
{stdout and stderr}
```

## Gold Tests

Gold tests run:

- at checkpoints
- at phase boundaries
- when `/xiro test` requests them
- after simplification when behavior could regress

Gold-test failure blocks progress.

## Manual Verification

Manual verification is allowed for:

- subjective visual polish
- hardware or device behavior unavailable to the agent
- production-only environments
- third-party flows that require human auth

Manual verification must include:

- exact steps
- expected observations
- who must run it
- what evidence to capture
- whether it blocks completion

## CANNOT_VERIFY

Use `cannot-verify` when the current environment cannot prove the claim.

Do not hide it. Report it clearly with the exact missing environment or access.
