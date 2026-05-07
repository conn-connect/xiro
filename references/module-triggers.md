# Module Triggers

Xiro should not ask every technical question for every project. Activate modules only when triggered by user intent, repo signals, or selected scope mode.

Each module in `project.md` is one of:

- `active` - required for the selected scope.
- `skipped` - not relevant, with a reason.
- `deferred` - known but intentionally later, with a boundary.
- `blocking` - required before `/xiro spec` can proceed.

## Module Matrix

| Module | Activate When | Minimum Contract |
| --- | --- | --- |
| Auth and ownership | roles, login, private data, tenant/team/workspace, gateway, iframe, user headers, permissions | auth modes by environment, current-user source, forbidden production modes, ownership tests |
| Persistence and migrations | saved records, files, drafts, sessions, history, uploads, restore, DB, schema, migrations | entities, owner fields if any, storage location, restore/delete behavior, migration command, missing-schema behavior |
| API and realtime | UI needs backend reads/writes, websocket, events, background jobs, clients, integrations | method/path or channel, request/response/events, errors, ownership, UI consumer |
| Providers and integrations | AI, speech, payment, email, maps, webhook, model server, hardware, external API | configured state, unconfigured state, mock contract, failure/timeout, evidence needed |
| Deployment and runtime | production, server, Docker, compose, cloud, device, shared preview, mobile store, operator smoke | run command, services, ports, health URL, logs, smoke evidence |
| Security and operations | production-ready, private data, secrets, provider keys, external services, long-running jobs | secret handling, auth boundary, readiness, logs, alerts or inspection path, failure states |
| Source and design inheritance | existing app, seed repo, reference app, design system, copy, fork, match, reuse/remove | source-of-truth map, preserve/remove matrix, intentional differences, parity checks |
| Mock and prototype boundary | mockup, fixtures, fake provider, demo mode, deterministic tests | what is fake, where it is reachable, production-off switch, paired truth gate if production exists |
| UI verification | visible UI, design parity, responsive layout, controls, accessibility | viewport checks, no overlap, accessible names, enabled-control effects |

## Production-Ready Escalation

`production-ready` scope raises the bar for any active module. Skipping must be explicit and defensible.

Examples:

- If private data exists, auth/ownership cannot be skipped.
- If durable state exists, persistence/migrations cannot be skipped.
- If external providers exist, configured/unconfigured/failure states cannot be skipped.
- If deployment is in scope, static config checks are not enough.

## Mockup/Prototype Limits

For `mockup-prototype`, most technical modules are skipped unless the user asks for them.

Still record:

- what data is fixture/local
- what controls are fake
- what is intentionally not saved
- what evidence proves the prototype is done

## Repo Signals

Activate modules from repo evidence when present:

- `package.json`, app directories, UI tests -> UI verification
- API routes, OpenAPI files, controllers -> API contracts
- migrations, schema files, ORM models -> persistence and migrations
- docker compose, deployment manifests -> deployment and runtime
- auth middleware, session code, user models -> auth and ownership
- env examples with secrets/providers -> providers and security
- design-system packages, shared components -> source and design inheritance
