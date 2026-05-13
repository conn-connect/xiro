# Human Control Surface

Xiro must never make the primary human control surface machine-oriented.

Human-facing files explain goals, status, decisions, risks, and required user choices. They are the readable interface, not the original product-intent source. Agent-facing files encode worker roles, slices, evidence indexes, and execution contracts.

## Human Control Files

Use these files for human review:

- `brief.md` - concise summary of intent, scope, users, must-work journeys, non-goals, risks.
- `plan.md` - user-readable roadmap and test plan.
- `state.md` - current honest claims, proof status, warnings, decisions, and orchestration gate.
- `decisions.md` - explicit decisions and their sources.

## Read Order

Human read order:

1. `brief.md`
2. `state.md`
3. `plan.md`
4. `evidence/`

Agent read order:

1. `agent/agents.json`
2. `agent/slices.json`
3. `agent/evidence.json`
4. canonical intent and design files referenced by `agent/slices.json`

This read order is not truth-source precedence.

## Authority Model

Xiro uses domain-specific authority.

### Intent Authority

The source of truth for what should be built:

1. Latest explicit user instruction.
2. `project.md`.
3. `spec.md`.
4. `phases/{N}-{slug}/requirements.md`.

`brief.md` summarizes intent. It must be corrected if it conflicts with intent authority.

### Design Authority

The source of truth for how it should be built:

1. `phases/{N}-{slug}/design.md`.
2. Design sections in `spec.md`.
3. Recorded decisions.

`plan.md` summarizes the roadmap. It must be corrected if it conflicts with design authority.

### Execution Authority

The source of truth for what workers execute:

1. `agent/slices.json`.
2. `agent/agents.json`.

`agent/*.json` is canonical only for worker execution, not for product intent or technical design.

### Claim Authority

The source of truth for what can honestly be claimed:

1. Raw evidence artifacts under `evidence/`.
2. Tester results.
3. `state.md`.
4. The No Upclaim Rule.

`state.md` records claim status and gates orchestration. It cannot weaken scope, remove active modules, alter acceptance criteria, or upgrade evidence claims.

When the human control surface conflicts with intent, design, execution, or evidence authority, Xiro must record the conflict in `state.md` and block if the conflict affects acceptance, design, runtime behavior, or claim integrity.

## State Truthfulness

`state.md` must lead with claim integrity, not percent progress.

It must show:

- what can honestly be claimed now
- what cannot yet be claimed
- strongest evidence class achieved
- active phase, slice, and worker assignments
- tester proof status
- runtime reachability
- warnings
- blocking and non-blocking user decisions
- whether it is safe to continue automatically

After `/xiro spec`, `state.md` may claim that contracts and plans were generated. It must not claim that implementation exists, acceptance proofs passed, or runtime reachability was verified.

## User Decisions

Separate user decisions by blocking severity:

- `Blocking` - affects scope, acceptance, domain/world model, evidence class, runtime reachability, or safety. `/xiro run` must stop before executing affected slices.
- `Non-Blocking` - preference, wording, visual polish, or deferred choice. `/xiro run` may continue if acceptance is unaffected.

`Safe to continue automatically` is `no` when any blocking decision is unresolved.

## Slice Markdown Projection

`slices.md` may be generated as a readable projection of `agent/slices.json`. It must not become the primary progress dashboard, user control surface, or runnable execution contract.

Use:

- `state.md` for human status.
- `plan.md` for human phase plan.
- `agent/slices.json` for worker execution.
