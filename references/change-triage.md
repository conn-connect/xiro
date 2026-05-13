# Change Triage

Late requirements are signals. Treat them deliberately.

## Categories

### Clarification

The user clarifies existing intent.

Action:

- Update docs.
- Adjust current slices if needed.
- Continue.

### Missed Original Requirement

The requirement was implied or stated earlier, but the plan missed it.

Action:

- Stop claiming completion for affected scope.
- Add or revise acceptance proof.
- Add gold coverage if it changes business value.
- Insert a phase if it is a boundary gate.

### New Scope

The user adds a genuinely new capability.

Action:

- Ask for approval if it changes timeline or architecture.
- Add backlog, new phase, or future milestone.
- Do not silently blend it into current completion.

### World-Model Change

The user changes the domain rules or concept system behind existing scenarios.

Examples:

- a poker game changes when cards can be exchanged or who owns cards
- a single-user tool becomes collaborative or multi-tenant
- a local fixture flow becomes provider-backed
- production-ready auth, persistence, or deployment becomes part of an earlier prototype

Action:

- Stop affected implementation progression.
- Warn that existing slices may preserve obsolete assumptions.
- Do not immediately regenerate `agent/slices.json`.
- Reconfirm or rewrite the affected project contract, scenarios, and gold tests.
- Recommend `/xiro salvage` if existing docs are hard to understand or contain conflicting assumptions.

### Production Defect

The current implementation fails a production-ready boundary.

Action:

- Stop current progression.
- Fix or re-plan before advancing.
- Record evidence and decision.

## Decimal Phases

Decimal phases are valid when a missed boundary must be inserted between existing phases.

Examples:

- deployment integration before a feature can claim live operation
- production truth gate after a prototype phase
- migration readiness before durable data claims

Record why the phase exists:

- missed original requirement
- failed boundary
- new gold or acceptance proof
- future phases protected by the gate
