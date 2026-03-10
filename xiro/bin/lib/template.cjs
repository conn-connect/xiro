'use strict';

/**
 * template.cjs — Spec templates with verification syntax
 */

const requirementsMdTemplate = (phaseN, phaseName, specAnchor) => `# Requirements: Phase ${phaseN} — ${phaseName}

## Spec Anchor
> ${specAnchor || '(paste from spec-anchor.md)'}

## Glossary
- **Term**: Definition

## Requirements

### Requirement 1: {Name}
**User Story:** As a {role}, I want {goal}, so that {benefit}.

#### Acceptance Criteria

1.1 WHEN {condition} THE System SHALL {behavior}
    VERIFY_BY: automated ({tool}: {what to test})

1.2 WHEN {condition} THE System SHALL {behavior}
    VERIFY_BY: hitl ({reason})
    HITL_ACTION: {step-by-step human verification}

## Verification Budget
| Category | Count | Method |
|----------|-------|--------|
| Automated | 0 | |
| HITL | 0 | |
| **Total** | **0** | |
AI: 0/0 (0%) | Human: 0/0 (0%)
`;

const designMdTemplate = (phaseN, phaseName) => `# Design: Phase ${phaseN} — ${phaseName}

## Overview
1-2 paragraph technical approach summary.

## Architecture
System diagram (ASCII) + component relationships + tech stack.

## Components and Interfaces
Per-component spec with testability annotation.

## Data Models
Types/interfaces + database schema.

## Error Handling
Error codes, HTTP statuses, strategies.

## Testing Strategy
Unit, integration, property-based approaches.

## Verification Architecture

### Commands
| Stage | Command | Expected |
|-------|---------|----------|
| Lint | \`{cmd}\` | exits 0 |
| Type | \`{cmd}\` | exits 0 |
| Test | \`{cmd}\` | exits 0, all pass |

### CANNOT_VERIFY Items
| Item | Reason | Human Steps |
|------|--------|-------------|

## Simplification Targets
Post-implementation cleanup candidates.
`;

const tasksMdTemplate = (phaseN, phaseName, specAnchor) => `# Tasks: Phase ${phaseN} — ${phaseName}

## Spec Anchor
> ${specAnchor || '(paste from spec-anchor.md)'}

## Verification Environment
| Purpose | Command | Expected |
|---------|---------|----------|
| Build | \`{cmd}\` | exits 0 |
| Tests | \`{cmd}\` | exits 0, all pass |
| Lint | \`{cmd}\` | exits 0 |

## Tasks

- [ ] 1. {Task title}
  - [ ] 1.1 {Subtask}
    - Implementation detail
    - _Requirements: 1.1_
    - **VERIFY**: \`{command}\` exits 0
  - [ ] 1.T {Test subtask} (MANDATORY)
    - **Property 1: {what is tested}**
    - **Validates: Requirements 1.1**
    - **VERIFY**: \`{test command}\` exits 0, N tests PASS

- [ ] **checkpoint**: Phase ${phaseN} integration check
  - **VERIFY_ALL**:
    - \`{full test suite}\` exits 0
    - \`{lint}\` exits 0
  - **CANNOT_VERIFY**:
    - {item} — REASON: {why} — REQUIRES: {human action}
  - **GOLD_TEST**: run all gold tests
  - [HITL] Review + approve
`;

const goldTestsMdTemplate = (featureName) => `# Gold Tests: ${featureName}

Killer scenarios that prove the feature works. Add-only — never delete.

## GT-1: {Scenario Name}
**Added**: Phase {N}
**Description**: {1-2 sentences describing end-to-end scenario}
**Steps**:
1. {step}
2. {step}
3. {step}
**VERIFY**: \`{command}\` exits 0
**Expected**: {what success looks like}
`;

const specAnchorTemplate = (featureName, goal, constraints, phases) => `# Spec Anchor (IMMUTABLE)
Feature: ${featureName}
Goal: ${goal}
Critical constraints: ${constraints}
Phases: ${phases}
`;

module.exports = {
  requirementsMdTemplate,
  designMdTemplate,
  tasksMdTemplate,
  goldTestsMdTemplate,
  specAnchorTemplate,
};
