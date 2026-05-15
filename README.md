# Xiro

Xiro is a scenario-driven development skill. It helps you turn a rough idea into a scoped project contract, concrete user journeys, implementation slices, and honest acceptance evidence.

## Quick Start

```text
/xiro new
/xiro spec my-feature
/xiro run my-feature
/xiro status my-feature
/xiro salvage my-feature
```

## How It Feels

`/xiro new` starts with friendly questions:

- What are we building?
- Who uses it?
- What must visibly work?
- How real should the first version be?
- What would prove it is done?

The interview starts broad and narrows only when the project needs more detail. A simple mockup stays lightweight. A production-ready project gets security, data, deployment, and observability questions.

## Scope Modes

Xiro always records a scope mode:

- `mockup-prototype`: visual or clickable proof with fixtures/local state allowed.
- `usable-local`: the selected user journeys work locally.
- `production-ready`: real deployment, security, persistence, integrations, and runtime evidence are part of done where relevant.

## Phase Boundaries

Xiro commands do not automatically advance to the next phase. `/xiro new` creates only the project contract control surface. `/xiro spec` creates only planning, scenario, and execution-contract artifacts. Product implementation starts only in `/xiro run`.

If the user says "implement the plan" during `/xiro new` or `/xiro spec`, Xiro treats that as permission to create only the current phase artifacts, not to scaffold or implement the product.

## Main Files

When you use xiro, it separates human control files from agent execution contracts:

```text
.xiro/{feature}/
├── project.md
├── brief.md
├── spec.md
├── plan.md
├── state.md
├── decisions.md
├── gold-tests.md
├── shared.md
├── agent/
│   ├── agents.json
│   ├── slices.json
│   ├── evidence.json
│   └── events.jsonl
├── phases/
│   ├── 0-{phase}/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── slices.md
│   └── 1-{phase}/
│       ├── requirements.md
│       ├── design.md
│       └── slices.md
├── evidence/
│   ├── phase-0/slices/
│   ├── phase-1/slices/
│   └── gold/
└── salvage/
    └── {timestamp}/
        ├── salvage-report.md
        ├── proposed-brief.md
        ├── proposed-plan.md
        └── proposed-state.md
```

Phase documents are always nested under `phases/{N}-{slug}/`. Human control files live at the feature root, worker contracts live under `agent/`, and proof artifacts live under `evidence/`. Use phase `0` only when the first phase is an intentional setup, design, prototype, or baseline phase; otherwise start at phase `1`.

## Human Control Surface

Read these first:

1. `brief.md`: what is being built and why.
2. `state.md`: what can honestly be claimed now.
3. `plan.md`: the user-readable path to completion.
4. `evidence/`: artifacts that prove claims.

`state.md` is the primary human status document. It must show what can be claimed, what cannot yet be claimed, the strongest evidence class, runtime reachability, warnings, and blocking user decisions.

## Generated Language

Xiro keeps Markdown headings and fixed structural labels in English. Generated human-facing content uses the user's active language, including explanations, bullets, table cells, risks, decisions, scenarios, and status messages.

Exact transcript records, quoted user text, code, commands, paths, stable IDs, enum/status values, and raw evidence excerpts are preserved as-is. Agent JSON schema keys and enum values remain English.

Human read order is not truth-source precedence. `project.md`, `spec.md`, and phase `requirements.md` remain the canonical intent sources. `brief.md` and `plan.md` are readable projections. `state.md` is the claim ledger and orchestration gate.

## Implementation Slices

Xiro uses `agent/slices.json` as the canonical worker execution contract once it exists. Each slice tells the Coder what to build and how completion will be proven.

A slice is not a test-only task. It is an implementation target with an acceptance proof.

`slices.md` may be generated as a readable projection of `agent/slices.json`, but it is not the primary human progress document or a runnable execution contract.

## Gold Tests

Gold tests are end-to-end journeys that prove the product works in the way the user cares about.

Gold tests are add-only by default. New phases can add gold tests, but earlier business journeys still protect the product.

## Evidence

Every completed slice has evidence. Xiro labels evidence by strength:

- design fixture
- mock contract
- local integration
- runtime compose
- real provider
- manual production
- cannot verify

Evidence labels keep summaries honest. A mock can prove a contract, but it cannot prove production behavior.

`agent/evidence.json` is only an index of evidence artifacts. The actual proof is the raw evidence under `evidence/`, such as `verify.log`, screenshots, command output, and other artifacts.

## Salvage

`/xiro salvage <feature>` is for bloated, drifted, or failed xiro output. It writes safe proposals under `.xiro/{feature}/salvage/{timestamp}/` and does not archive, replace, or delete existing docs on the first pass.

Xiro vNext does not support implicit legacy execution. If a feature lacks the vNext control surface or `agent/slices.json`, `/xiro run` blocks and recommends `/xiro spec <feature>` or `/xiro salvage <feature>`. Legacy `.xiro` output may be salvage input, but it is not runnable as-is.
