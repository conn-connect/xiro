# Project: {feature}

## Overview

{What is being built, for whom, and why it matters.}

## Scope Mode

Selected scope: `{mockup-prototype | usable-local | production-ready}`

Decision reason:

- {Why this scope mode fits the user's intent.}

## Users and Context

- {User type}: {context and need}

## Must-Work Journeys

- {Journey}: {end-to-end outcome}

## Non-Goals

- {Explicitly out of scope}

## Module Matrix

| Module | Status | Reason | Blocking Questions |
| --- | --- | --- | --- |
| Auth and ownership | {active/skipped/deferred/blocking} | {reason} | {none or question} |
| Persistence and migrations | {active/skipped/deferred/blocking} | {reason} | {none or question} |
| API and realtime contracts | {active/skipped/deferred/blocking} | {reason} | {none or question} |
| Providers and integrations | {active/skipped/deferred/blocking} | {reason} | {none or question} |
| Deployment and runtime | {active/skipped/deferred/blocking} | {reason} | {none or question} |
| Security and operations | {active/skipped/deferred/blocking} | {reason} | {none or question} |
| Source and design inheritance | {active/skipped/deferred/blocking} | {reason} | {none or question} |
| Mock, fixture, and prototype boundary | {active/skipped/deferred/blocking} | {reason} | {none or question} |
| UI verification | {active/skipped/deferred/blocking} | {reason} | {none or question} |

## Mock, Fixture, and Prototype Boundary

| Surface | Allowed in Prototype | Required for Local | Required for Production | Evidence Required | Owning Phase |
| --- | --- | --- | --- | --- | --- |
| {surface} | {fixture/local/fake allowed?} | {local behavior} | {production behavior} | {evidence class} | {phase} |

## Data and Persistence

Status: {active/skipped/deferred/blocking}

- Entities or records:
- Owner or tenant boundary:
- Storage location:
- Create/read/update/delete/restore behavior:
- Refresh/restart behavior:
- Migration expectation:
- Missing-storage failure state:

## APIs, Realtime, and Integrations

Status: {active/skipped/deferred/blocking}

- API or event surfaces:
- Provider or external service paths:
- Configured behavior:
- Unconfigured behavior:
- Failure/timeout behavior:
- Evidence required:

## Source and Design Strategy

Status: {active/skipped/deferred/blocking}

- Seed repo:
- Reference app:
- Design-system source:
- API/protocol source:
- Preserve:
- Remove:
- Intentional differences:
- Parity evidence:

## Deployment, Security, and Operations

Status: {active/skipped/deferred/blocking}

- Runtime target:
- Run command:
- Services and ports:
- Health/readiness checks:
- Logs or observability:
- Secrets handling:
- Security boundary:
- Manual production checks:

## Failure States

- {Failure state}: {expected user/system behavior}

## Candidate Phases

- Phase 1: {name} - {outcome}
- Phase 2: {name} - {outcome}

## Gold-Test Candidates

- GT-1: {business journey}
- GT-2: {business journey}

## Open Questions

| Question | Status | Blocks Spec? | Default if Unanswered |
| --- | --- | --- | --- |
| {question} | {blocking/deferred/non-blocking} | {yes/no} | {default} |

## Spec-Readiness Status

Status: `{ready | ready with deferred items | not ready}`

Reasons:

- {readiness reason}

## Interview Transcript (Verbatim)

Record the `/xiro new` interview exactly as it happened. Do not summarize, translate, or clean up wording.

### Q1: {header or topic}

Asked by xiro:

```text
{exact question text}
```

Options shown:

1. {exact option label} - {exact option description}
2. {exact option label} - {exact option description}

User selected:

```text
{exact selected option label(s)}
```

User added:

```text
{exact freeform comment, or "none"}
```
