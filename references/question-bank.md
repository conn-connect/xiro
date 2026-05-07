# Question Bank

Use these as patterns. Rewrite options in the user's domain language.

These question definitions are intended for `AskUserQuestion` or the host's equivalent structured question tool. Keep each option short, concrete, and mutually distinct. Do not turn the question bank into a plain prose checklist during `/xiro new`.

## Product Shape

```yaml
id: product.shape
when_to_ask: Always near the start of /xiro new.
header: Project
question: What kind of thing are we building?
multiSelect: false
options:
  - label: Web app
    description: Interactive browser app with screens, state, and user flows.
  - label: Internal tool
    description: Dashboard, workflow, admin, operations, or data-management tool.
  - label: App or client
    description: Mobile, desktop, embedded, or device-facing experience.
  - label: Automation or backend
    description: API, job, integration, CLI, or service with little UI.
```

## Users

```yaml
id: product.users
when_to_ask: After product shape.
header: Users
question: Who needs this to work?
multiSelect: true
options:
  - label: End users
    description: People completing the main workflow.
  - label: Admins
    description: People configuring or managing the system.
  - label: Operators
    description: People deploying, monitoring, or supporting it.
  - label: Developers
    description: People using APIs, scripts, or integrations.
```

## Must-Work Journeys

```yaml
id: product.journeys
when_to_ask: After users are known.
header: Journeys
question: What must work end-to-end?
multiSelect: true
options:
  - label: Create something
    description: User creates the primary record, output, or artifact.
  - label: Find or restore work
    description: User can come back and continue.
  - label: Review and edit
    description: User can inspect, adjust, approve, retry, or correct.
  - label: Share or export
    description: User can send, download, publish, or hand off.
```

## Scope Mode

```yaml
id: scope.mode
when_to_ask: Always before writing project.md.
header: Scope
question: How real should the first finished version be?
multiSelect: false
options:
  - label: Mockup / clickable prototype
    description: Screens and interactions are enough; real backend may be out of scope.
  - label: Usable local app
    description: Core journeys should work locally with real behavior where needed.
  - label: Production-ready app
    description: Real security, persistence, deployment, operations, and truthful unavailable states matter.
```

## Data

```yaml
id: module.persistence
when_to_ask: Saved state, files, drafts, history, sessions, uploads, restore, or cross-device behavior is mentioned.
header: Data
question: What needs to be saved or restored?
multiSelect: true
options:
  - label: User-created records
    description: Main business objects or saved work.
  - label: Files or media
    description: Uploaded or generated binary assets.
  - label: History or drafts
    description: Previous work can be reopened or revised.
  - label: Nothing durable
    description: State can reset between sessions for this scope.
```

## Integrations

```yaml
id: module.integrations
when_to_ask: External API, provider, payment, email, model, hardware, realtime, or webhook is mentioned.
header: Integrations
question: Which external paths must be real in this scope?
multiSelect: true
options:
  - label: Real provider path
    description: A configured external provider must be called.
  - label: Mock contract only
    description: Request and failure shape must be proven, but live provider is not required.
  - label: Unavailable state
    description: UI/API must be truthful when provider config is missing.
  - label: Not in this scope
    description: Integration is explicitly deferred.
```

## Source and Design

```yaml
id: module.source_design
when_to_ask: Existing repo, reference app, design system, copy, fork, match, reuse, or visual parity is mentioned.
header: Source
question: What sources should guide this work?
multiSelect: true
options:
  - label: Seed repo
    description: Codebase to start from or modify.
  - label: Reference app
    description: Behavior or interaction source of truth.
  - label: Design-system source
    description: Components, tokens, layout, and states to preserve.
  - label: API/protocol source
    description: Existing endpoints, events, or data contracts to follow.
```

## Gold Tests

```yaml
id: gold.candidates
when_to_ask: Before closing /xiro new or during /xiro spec.
header: Gold tests
question: Which full journeys would convince you this is done?
multiSelect: true
options:
  - label: Primary happy path
    description: A real user completes the main workflow from start to finish.
  - label: Return and continue
    description: User refreshes or reopens and previous work is correct.
  - label: Failure or unavailable state
    description: Missing service, bad input, or denied permission is handled truthfully.
  - label: Admin or operator path
    description: A non-end-user role can manage, verify, or complete the workflow.
```
