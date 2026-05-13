# Xiro State: {feature}

## Current Claim

What can honestly be claimed now:

- {claim, e.g. "Project contract exists." or "Spec and execution contracts are generated."}

What cannot yet be claimed:

- {missing proof, e.g. "Implementation has not started.", "No acceptance proof has passed.", "Runtime reachability has not been verified."}

Strongest evidence class achieved: `{none | design-fixture | mock-contract | local-integration | runtime-compose | real-provider | manual-production | cannot-verify}`

Safe to continue automatically: `{yes | no}`

Next recommended command: `{none | /xiro spec <feature> | /xiro run <feature> | /xiro salvage <feature>}`

## Current Work

- Phase: {phase or "not selected"}
- Slice: {slice id or "none"}
- Worker assignment: {role/id or "none"}
- Runtime reachability: {verified path, unverified path, or "not yet checked"}

## Evidence Status

| Item | Evidence Class | Result | Artifact |
| --- | --- | --- | --- |
| {THEN ID or gold test} | {class} | {PASS/FAIL/CANNOT_VERIFY/PENDING} | {path or none} |

## Warnings

| Level | Type | Message | Requires User Decision |
| --- | --- | --- | --- |
| {info/warning/debug} | {type} | {message} | {yes/no} |

## User Decision Required

### Blocking

- {decision that affects scope, acceptance, world model, evidence, or runtime reachability, or "none"}

### Non-Blocking

- {deferred preference or polish decision, or "none"}

## Recent Events

- {timestamp}: {event summary}
