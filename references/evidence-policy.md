# Evidence Policy

Evidence tells xiro what kind of claim a slice can honestly support.

## Evidence Classes

| Class | Meaning |
| --- | --- |
| `design-fixture` | Design, layout, or interaction proof using fixtures or static data |
| `mock-contract` | Contract behavior proven with mock provider, fake upstream, or deterministic fixture |
| `local-integration` | Real app components working together in local development |
| `runtime-compose` | Runtime stack starts and passes health/smoke checks in a declared runtime target |
| `real-provider` | Configured external provider path works with real credentials or sandbox |
| `manual-production` | Human or environment-only production verification was performed with recorded steps |
| `cannot-verify` | Verification is impossible in the current agent environment and is explicitly documented |

## No Upclaim Rule

Do not use weaker evidence to claim stronger completion.

Examples:

- `design-fixture` cannot prove production behavior.
- `mock-contract` cannot prove a real provider works.
- Static config parsing cannot prove deployability.
- Local happy path cannot prove production security.
- Manual subjective review cannot replace required automated regression checks unless marked as manual.
- Module-level tests cannot prove the user-facing workflow if the implemented behavior is not reachable through the intended runtime path.

## Runtime Reachability

Reachability means the implemented behavior is invoked through the path the user or system will actually use: UI, API, tool registry, orchestrator, CLI, worker, scheduler, service route, or deployment entrypoint.

A completed slice should state where the behavior is surfaced. A final completion claim must prove the must-work journeys are reachable through the intended runtime path, not only that isolated modules and tests exist.

## Slice Metadata

Each implementation slice includes:

```text
Scope Mode:
Activated Module:
Evidence Class:
Mock Allowed:
Real Path Required:
Reachability:
Boundary Claim:
```

## Completion Summaries

Final and checkpoint summaries should separate:

- Implemented
- Reachable through intended runtime
- Verified with real integration
- Verified with mock or fixture evidence
- Gaps blocking user-facing completion
- Manual verification required
- Cannot verify in this environment

## Production Claims

Production-ready claims require evidence for:

- security boundary where relevant
- durable persistence where relevant
- configured/unconfigured provider behavior where relevant
- deployment/runtime health where relevant
- reachability through the intended runtime entrypoint where relevant
- no fixture-only or inert production UI where relevant
