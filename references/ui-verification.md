# UI Verification

Use this when a feature has a visible UI.

## Baseline Checks

Frontend phases should consider:

- desktop and mobile viewport coverage
- no incoherent text overlap
- stable dimensions for buttons, panels, boards, and toolbars
- accessible names for critical controls
- visible loading, empty, disabled, selected, and error states
- keyboard behavior for interactive controls
- no fixture-only production data
- no enabled inert controls

## Production Control Rule

In production-ready scope, every visible enabled control must produce one of:

- real API call
- WebSocket or realtime event
- provider request
- route or dialog transition
- durable state change
- truthful disabled or unavailable state

Empty handlers, fake success toasts, placeholder labels, and local-only persistence fail production-ready slices.

## Source-Reference UI

When matching an existing design or product:

- capture the source screens/components
- define which differences are intentional
- test critical roles/names and layout states
- use screenshots when automation cannot inspect visual parity

## Suggested Acceptance Proofs

- Playwright visible state assertions
- component tests for states and events
- screenshot comparison for source parity when appropriate
- static audit for fixture leakage or inert handlers
- accessibility assertions for labels, roles, and keyboard behavior

## Mockup/Prototype

For mockup/prototype scope, UI verification may focus on:

- visible flow
- interaction affordances
- fixture data clarity
- responsive layout
- user review instructions

Do not claim production operability from mockup/prototype evidence.
