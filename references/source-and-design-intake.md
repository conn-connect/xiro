# Source and Design Intake

Use this when a project starts from, matches, copies, extends, or references existing work.

## Source Types

Record each source separately:

- Seed repo: codebase to modify or start from.
- Reference app: behavior or workflow source of truth.
- Design-system source: components, layout, tokens, icons, and states.
- API/protocol source: endpoints, events, schemas, or data flow.
- Deployment source: run commands, service layout, health checks, or runtime expectations.

Do not collapse these into one vague "source".

## Questions

Ask only when source inheritance is relevant:

- Are we starting empty, modifying existing code, or matching another product?
- Which source controls behavior?
- Which source controls visual design?
- Which source controls API or protocol shape?
- What must be preserved exactly?
- What must be removed?
- What differences are intentional?
- What parity evidence is required?

## Preserve / Remove / Change Matrix

Record:

| Area | Preserve | Remove | Change | Evidence |
| --- | --- | --- | --- | --- |
| UI components | | | | |
| API contracts | | | | |
| Data models | | | | |
| Runtime/deploy | | | | |
| Tests | | | | |

## Visual Parity

When visual parity is required, record:

- screens/components to match
- colors, spacing, radius, shadow, typography, icon style
- responsive layout expectations
- empty/loading/disabled/error states
- screenshots or component tests required

## Implementation Warning

Source guidance is not a blind copy instruction. Coder workers must inspect current repo reality and preserve the acceptance intent.
