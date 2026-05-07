# Xiro

Xiro is a scenario-driven development skill. It helps you turn a rough idea into a scoped project contract, concrete user journeys, implementation slices, and honest acceptance evidence.

## Quick Start

```text
/xiro new
/xiro spec my-feature
/xiro run my-feature
/xiro status my-feature
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

## Main Files

When you use xiro, it creates:

```text
.xiro/{feature}/
├── project.md
├── spec.md
├── gold-tests.md
├── shared.md
├── phases/
│   ├── 0-{phase}/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── slices.md
│   └── 1-{phase}/
│       ├── requirements.md
│       ├── design.md
│       └── slices.md
└── evidence/
    ├── decisions.log
    ├── phase-0/slices/
    ├── phase-1/slices/
    └── gold/
```

Phase documents are always nested under `phases/{N}-{slug}/`. Feature-root files are limited to project/spec/gold/shared state. Use phase `0` only when the first phase is an intentional setup, design, prototype, or baseline phase; otherwise start at phase `1`.

## Implementation Slices

Xiro uses `slices.md` as the execution document. Each slice tells the Coder what to build and how completion will be proven.

A slice is not a test-only task. It is an implementation target with an acceptance proof.

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
