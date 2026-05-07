# Fast Defaults

Users sometimes want momentum. Xiro should move, but not hide dangerous assumptions.

## Behavior

When the user says "just build it", "go fast", or similar:

1. Use known facts.
2. Declare defaults.
3. Ask at most one blocker question.
4. Proceed only when the default is safe for the selected scope.
5. Log defaults as reversible decisions.

## Default Contract

If no production signals exist:

```text
Proceeding with defaults:
- Scope: usable local app
- Persistence: local/in-memory unless saved history was requested
- Providers: mocked unless real provider was requested
- Deployment: local dev only
- Verification: automated local acceptance proofs
```

If production signals exist:

```text
Production-ready defaults:
- No fixture-only production data
- No enabled inert controls
- No mock provider claimed as real
- No mock auth claimed as production auth
- Runtime, security, and persistence modules activate when relevant
```

## One Blocker Question

Ask one blocker question when the wrong default would materially change the project:

```text
Before planning, I need one scope decision: is this a mockup/prototype, a usable local app, or production-ready?
```

Do not restart the whole interview.
