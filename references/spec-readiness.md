# Spec Readiness

Before `/xiro spec`, verify that `project.md` is complete enough for the selected scope mode and activated modules.

## Ready When

`/xiro spec` may proceed when:

- Scope mode is explicit.
- Primary users and must-work journeys are explicit.
- Non-goals prevent accidental scope expansion.
- Every activated module has enough detail to plan scenarios.
- Skipped modules have reasons.
- Deferred modules have boundaries.
- Gold-test candidates match the scope mode.

## Blockers

Block `/xiro spec` when any active module has unresolved production-critical unknowns.

Examples:

- Production-ready scope but auth, secrets, persistence, deployment, or operations are ambiguous where relevant.
- Private or user-owned data but ownership rules and cross-user behavior are missing.
- Saved data, files, drafts, or history but persistence, restore, delete, and migration expectations are missing.
- Provider-backed control but configured, unconfigured, and failure behavior are not specified.
- Realtime feature but transport, event schema, identity key, and error events are missing.
- Deployment or runtime target but run commands, services, ports, health URLs, logs, and smoke evidence are missing.
- Fixture or mock mode exists but no boundary records what is fake and what can claim completion.
- Existing app or design parity is required but no source-of-truth map exists.
- Gold tests are prose-only with no executable or manual evidence strategy.

## Non-Blockers

Do not block simple projects on irrelevant modules.

Examples:

- A mockup/prototype can be ready without database, auth, deployment, or provider details when those are out of scope.
- A single-user local app can be ready without multi-user ownership if private multi-user data is not part of the journey.
- A local UI tool can be ready without production deployment if production is not selected.

## Escalation Wording

When blocked, be concise:

```text
I can write the spec after one missing contract is settled:

- Scope says production-ready, and the app stores private user data.
- Missing: auth/ownership rule.

Please choose: single-user only, login required, or existing auth provider.
```

Ask only the blocking question. Do not restart the whole interview.
