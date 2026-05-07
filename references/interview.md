# Adaptive Interview

`/xiro new` is a guided interview. It should feel easy for a new user and precise for a serious production project.

## Principles

- Start broad, then narrow.
- Use `AskUserQuestion` for interview prompts when available. If the host exposes the same capability under another name, use the host's structured question tool.
- Ask 1-2 question screens at a time.
- Use concrete choices with short descriptions.
- Always allow freeform answers.
- Avoid jargon in early questions.
- Record defaults and skipped modules explicitly.
- Ask deep technical questions only when triggered by scope, user journeys, or repo signals.

## Question Tool Use

Interview questions should normally be sent through `AskUserQuestion` so the user can answer by selecting options instead of writing a long prompt.

Use plain text questions only when:

- the structured question tool is unavailable
- the question is genuinely open-ended and cannot be represented with useful choices
- the user already gave a detailed freeform answer and only a short confirmation is needed

Each `AskUserQuestion` call should contain one decision cluster. Prefer one or two questions per call. Do not batch unrelated decisions just because the tool allows it.

Every option should be plausible. Do not include filler choices that are obviously wrong. The freeform answer path covers unusual cases.

## Environment Scan

Before asking product questions, inspect the current folder:

- Empty directory or existing app?
- Git repo present?
- Framework or package files?
- Existing `.xiro` state?
- Apps, services, packages, or multiple repos?
- Obvious design system, API, database, deployment, or test signals?

Use this scan to shape the first question. Do not ask users facts that the folder makes clear.

## Interview Stages

1. Product shape
2. Users and context
3. Must-work journeys
4. Scope mode
5. Activated modules
6. Constraints and non-goals
7. Gold-test candidates
8. Spec-readiness summary

## Product Shape

Ask what kind of thing is being built. Adapt options to the prompt and repo.

Example options:

- Web app
- Internal tool
- Mobile or desktop app
- Automation or backend service
- CLI or developer tool
- Game or interactive experience
- Data workflow
- Extension to an existing product

## Users and Journeys

Ask who needs it and what must work end-to-end.

Prefer domain language. If the user says "ordering", ask about browse, customize, cart, checkout, staff, and admin. If the user says "dashboard", ask about data sources, filters, actions, exports, alerts, and admin paths.

## Scope Mode

Always ask how real the first finished version should be:

- `Mockup / clickable prototype`
- `Usable local app`
- `Production-ready app`

This is the most important early decision because it controls whether fake data, local-only behavior, deployment, security, and provider questions are in scope.

## Activated Modules

After scope mode and journeys are known, activate modules only when relevant:

- Auth and ownership
- Persistence and migrations
- API and realtime
- Providers and integrations
- Deployment and runtime
- Security and operations
- Source and design inheritance
- Mock, fixture, and prototype boundary
- UI verification

See `module-triggers.md`.

## Defaults for Fast Users

When a user says "just build it", use current facts and declare defaults.

Ask at most one blocker question when the wrong default would change the project materially. The usual blocker is scope mode.

Record defaults in `project.md` as reversible decisions.

## Output

The interview writes `.xiro/{feature}/project.md` using `project-template.md`.

The document must include:

- Scope mode
- Must-work journeys
- Non-goals
- Module matrix
- Mock/real boundary
- Candidate phases
- Gold-test candidates
- Open questions with blocking status
- Interview transcript as the final section, preserving exact questions, options, selected choices, and user comments from `/xiro new`
