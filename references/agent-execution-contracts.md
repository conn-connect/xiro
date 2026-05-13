# Agent Execution Contracts

Agent JSON files encode worker execution. They do not override intent authority or design authority.

## Files

- `agent/agents.json` - role contracts, permissions, forbidden actions, and required reports.
- `agent/slices.json` - canonical worker execution contracts.
- `agent/evidence.json` - index of evidence artifacts.
- `agent/events.jsonl` - structured events for status, warnings, and debugging.

## Canonical Scope

`agent/slices.json` is canonical only for worker execution. It must be generated from canonical intent and design files and refreshed when those sources change in ways that affect slices.

If `agent/slices.json` conflicts with current intent or design authority:

- do not run affected slices
- update `state.md` with a stale-contract warning
- regenerate or revise the execution contract before spawning workers

## Role Contracts

`agents.json` is a role contract, not a list of names.

Each role must define:

- purpose
- file edit boundary or `false`
- command/tool permission expectation
- whether acceptance proof modification is allowed
- forbidden actions
- required report fields

Coder workers must not:

- expand beyond the assigned slice
- weaken acceptance assertions
- revert unrelated changes made by others
- mark completion without tester evidence

Tester workers must not:

- modify product code
- modify implementation tests
- weaken acceptance assertions
- fix the code they are testing

## Evidence Index

`agent/evidence.json` is an index. It is not proof.

Every passing or failing claim must point to raw artifacts such as:

- `verify.log`
- command output
- screenshots
- browser recordings
- manual observation notes
- deployment or provider logs

If the raw artifact is missing, the claim is unproven even if `agent/evidence.json` says `PASS`.

## Worker Prompt Inputs

When spawning a worker, include:

- role from `agent/agents.json`
- slice object from `agent/slices.json`
- relevant readable summary from `brief.md` and `plan.md`
- canonical intent and design references from the slice contract
- explicit out-of-scope boundaries
- evidence path where results must be stored

Do not pass the full document set to every worker by default. Context should be limited to the assigned slice and the canonical intent/design context needed to preserve acceptance meaning.
