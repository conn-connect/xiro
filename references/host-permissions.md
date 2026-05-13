# Host Permissions

Xiro distinguishes workflow integrity from host approval policy.

Host approval policy controls whether the environment asks before spawning workers, editing files, running commands, using browsers, or calling external tools. This is configured by Codex, Claude Code, or another host.

Xiro workflow integrity controls whether a claim is allowed. It depends on scope mode, assigned slices, independent tester evidence, evidence class, and runtime reachability.

## Boundary Rule

Do not weaken Xiro evidence requirements to reduce host approvals.

Repeated approvals for worker creation, file edits, shell commands, browser access, or external tools are host permission-policy issues. They may block automation, but they do not justify weaker claims.

## Permission Failure

Permission failure is not negative evidence of product failure, but it is also not positive evidence of product success.

When permission blocks verification:

- record the blocked command or tool
- mark the affected proof as `cannot-verify`
- update `state.md` with the claim that cannot yet be made
- include the missing permission or environment requirement

Example `state.md` entry:

```markdown
What cannot yet be claimed:
- Browser runtime behavior, because Playwright/Chrome access was unavailable.
```

## Autonomous Runs

Host auto-mode or permission configuration may be documented separately for uninterrupted runs. It must not change:

- Coder/Tester separation
- acceptance proofs
- evidence classes
- runtime reachability requirements
- No Upclaim rule
