# Salvage

`/xiro salvage <feature>` recovers a readable control surface from bloated, drifted, or failed xiro output. It is not a normal implementation step.

Legacy `.xiro` output may be read by `/xiro salvage` as input material, but it is not a runnable execution contract. Salvage proposes new human control files; it does not automatically migrate legacy slices into `agent/slices.json`.

## When to Recommend Salvage

Run or recommend salvage when any of these are true:

- `state.md` cannot be summarized in one screen.
- phase or slice docs contain implementation minutiae but no clear user-visible outcome.
- multiple workers claim overlapping responsibility.
- evidence files exist but cannot be mapped to user journeys.
- a new user request changes the domain/world model.
- agent output repeatedly edits plans instead of product behavior.
- mock evidence is being used to imply runtime behavior.
- the user says generated plans or docs are no longer understandable.

## First Pass Is Non-Mutating

The first salvage pass must not archive, replace, delete, or regenerate existing xiro documents.

Write only:

```text
.xiro/{feature}/salvage/{timestamp}/salvage-report.md
.xiro/{feature}/salvage/{timestamp}/proposed-brief.md
.xiro/{feature}/salvage/{timestamp}/proposed-plan.md
.xiro/{feature}/salvage/{timestamp}/proposed-state.md
```

Do not generate `agent/*.json` during the first salvage pass. Intent and design authority must be stabilized before worker execution contracts are recreated.

## Extraction Rules

Extract only confirmed facts:

- final intended goal
- confirmed decisions
- actually observed implementation
- verified behavior
- unverified or suspect behavior
- wrong turns and drift

Do not treat code existence as verified behavior.

Use three implementation categories:

- `Observed in files` - code, tests, routes, or documents were found.
- `Likely implemented` - code path appears connected, but no stored proof exists.
- `Verified` - acceptance proof, log, screenshot, or artifact confirms behavior.

## Report Sections

`salvage-report.md` must include:

- Confirmed Decisions
- Intended Goal Recovered
- Observed Implementation
- Likely Implemented
- Verified Behavior
- Unverified or Suspect Behavior
- Drift / Wrong Turns
- Documents to Keep
- Documents to Archive Later
- Proposed New Brief
- Proposed New Plan
- Proposed New State
- User Approval Required Before Mutation

## World-Model Changes

A world-model change alters the domain rules or concept system, not only UI or implementation detail.

Examples:

- a poker game adds a skill that changes card ownership and round timing
- a single-user app becomes multi-tenant
- a mock provider becomes a real external provider requirement
- a local-only workflow becomes production-ready with auth and persistence

When detected:

- warn that existing slices may preserve obsolete assumptions
- do not regenerate worker JSON immediately
- recommend revising the project contract/spec before implementation

Suggested warning:

```text
WARNING: This appears to be a world-model change. Continuing with existing slices may preserve obsolete domain assumptions. Regenerate the affected project contract/spec before implementation.
```
