# Project Template Guide

`project.md` is the contract produced by `/xiro new`. It should be detailed enough for `/xiro spec` to plan from without inventing missing scope.

Use `templates/project.md` as the concrete template.

## Required Sections

- Overview
- Scope Mode
- Users and Context
- Must-Work Journeys
- Non-Goals
- Module Matrix
- Mock, Fixture, and Prototype Boundary
- Data and Persistence
- APIs, Realtime, and Integrations
- Source and Design Strategy
- Deployment, Security, and Operations
- Failure States
- Candidate Phases
- Gold-Test Candidates
- Open Questions
- Spec-Readiness Status
- Interview Transcript (Verbatim)

## Module Matrix Rules

Every module must be recorded as `active`, `skipped`, `deferred`, or `blocking`.

The reason matters. A skipped module without a reason is an unknown, not a decision.

## Mock Boundary Rules

If anything is fake, local-only, fixture-backed, mock-backed, or design-only, record:

- Surface
- What is allowed in mockup/prototype
- What is required in usable local scope
- What is required in production-ready scope
- Evidence required
- Owning phase

## Open Questions

Open questions are classified:

- `blocking` - cannot run `/xiro spec`
- `deferred` - intentionally later, with a phase or condition
- `non-blocking` - useful but not needed for current planning

## Spec-Readiness

End `project.md` with a short status:

- `ready`
- `not ready`
- `ready with deferred items`

If not ready, list the exact questions that block `/xiro spec`.

## Interview Transcript

The final section of `project.md` must be `Interview Transcript (Verbatim)`.

Record the `/xiro new` interview exactly as it happened:

- exact assistant question text
- exact option labels and descriptions shown to the user
- exact user-selected option labels
- exact user freeform comments or amendments
- exact plain-chat question and answer text when a structured question tool was unavailable

Do not summarize, translate, normalize, or improve wording in this section. It is a source record for later audits.
