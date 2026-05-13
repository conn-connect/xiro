# Notification Policy

Xiro records structured events so a user can understand long autonomous runs without reading every log.

## Event Levels

### Info

Useful progress that does not require immediate intervention.

Examples:

- phase planned
- Coder worker assigned
- Tester worker completed proof
- gold test passed
- state document updated

### Warning

Claim integrity, scope, permission, or execution issues that may require intervention.

Examples:

- spec and implementation conflict
- acceptance proof fails repeatedly
- worker role overlap is detected
- mock evidence is being used for a runtime claim
- runtime reachability is unverified
- host permission blocks proof
- token/cost use appears abnormal
- `agent/slices.json` is stale against intent or design authority

### Debug

Details useful for later analysis but not suitable for human notification by default.

Examples:

- exact tool calls
- context documents read by a worker
- command retry history
- raw worker message flow

## Storage

Record structured events in `agent/events.jsonl` when available. Keep user-facing summaries in `state.md`.

Do not send every debug event to the user. Promote only warnings and decision points to `state.md`.

## Warning Semantics

Warnings protect claim integrity. They do not automatically mean product failure.

A warning must state:

- what happened
- what claim is blocked or weakened
- whether user decision is required
- which artifact or command provides more detail
