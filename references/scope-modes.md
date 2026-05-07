# Scope Modes

Every xiro feature has one scope mode. Scope mode controls what xiro asks, plans, implements, and verifies.

## `mockup-prototype`

Use when the desired output is a visual mockup, clickable prototype, or interaction proof.

Allowed:

- Fixture data
- In-memory state
- Static screens
- Fake provider responses if clearly labeled
- Manual visual review

Required:

- Record what is fake.
- Record whether anything saves.
- Record what "done" means for the prototype.
- Do not plan backend, auth, deployment, or real provider work unless the user explicitly requests it.

Completion cannot claim:

- Durable persistence
- Real provider behavior
- Production security
- Production deployability

## `usable-local`

Use when selected journeys should work locally for real.

Allowed:

- Local database, local files, local services, or lightweight API.
- Mock providers for contract tests if real provider setup is out of scope.
- Development auth or single-user mode if private multi-user data is not in scope.

Required:

- Core selected journeys work locally.
- Any saved state named by the user survives the expected local lifecycle.
- Unavailable integrations are shown truthfully.
- Gold tests are executable locally or explicitly manual.

Completion cannot claim:

- Production security
- Production deployment
- Real provider behavior unless configured evidence exists

## `production-ready`

Use when the project is intended for real users or real operations.

Required where relevant:

- Auth and ownership contract
- Secrets and provider configuration behavior
- Persistence and migrations
- Deployment or runtime target
- Health, readiness, logs, and smoke checks
- Security-sensitive failure states
- No fixture-only data in production paths
- No enabled inert controls
- No mock auth or fake provider success presented as production completion

Completion requires evidence that matches the claim. If the environment cannot be verified by the agent, record `manual-production` or `cannot-verify` with exact user steps.

## Changing Scope

When the user changes scope:

- Update `project.md`.
- Log the decision.
- Re-run spec-readiness for affected modules.
- Add or revise gold tests if the definition of done changed.
- Insert phases only when the new scope changes acceptance boundaries.

## Defaulting

If the user says "just build it" and does not give production signals, default to `usable-local`.

If the user mentions real users, production, deployment, shared preview, private data, external providers, payments, secrets, or operations, default to asking one scope-mode blocker question before planning.
