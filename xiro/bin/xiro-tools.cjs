#!/usr/bin/env node
'use strict';

/**
 * xiro-tools.cjs — CLI entry point for xiro engine
 *
 * Provides tool functions that slash commands invoke.
 * This is NOT called directly by MC — it's the runtime backbone
 * that slash command prompts reference.
 */

const { initProject, projectExists, getProjectInfo, healthCheck } = require('./lib/core.cjs');
const { loadConfig, saveConfig, getXiroRoot } = require('./lib/config.cjs');
const { loadRunState, saveRunState, loadCriteriaLock, saveCriteriaLock } = require('./lib/state.cjs');
const { listPhases, getActivePhase, createPhaseDir, getPhaseFiles, readPhaseFile } = require('./lib/phase.cjs');
const { parseTasksMd, parseGoldTestsMd } = require('./lib/frontmatter.cjs');
const { runPhase, runNext, buildDependencyGraph, getExecutionOrder } = require('./lib/autorun.cjs');
const { runVerifyCommand, runVerifySpec, runGoldTest, checkAntiMockup } = require('./lib/verifier.cjs');
const { canCompleteTask, canCompletePhase, canStartRun } = require('./lib/gate.cjs');
const { codexReview, codexSpecReview } = require('./lib/external-verifier.cjs');
const { notifyEvent, readLedger, getMemorySummary, getPatterns } = require('./lib/memory-bridge.cjs');
const { guardR1, guardR2, guardR3, guardR4, guardR5, guardR6, guardR7, guardR8 } = require('./lib/honest.cjs');
const {
  writeEvidence, writeCodexEvidence, writeVerifySummary,
  writeGoldEvidence, writeCheckpointEvidence, logDecision,
  readEvidence, parseExitCode, loadCodexReview,
} = require('./lib/evidence.cjs');
const {
  requirementsMdTemplate, designMdTemplate, tasksMdTemplate,
  goldTestsMdTemplate, specAnchorTemplate,
} = require('./lib/template.cjs');

const fs = require('fs');
const path = require('path');

// CLI dispatch (for direct invocation or tool calls)
const command = process.argv[2];

if (command) {
  const result = dispatch(command, process.argv.slice(3));
  if (result) {
    process.stdout.write(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    process.stdout.write('\n');
  }
}

function dispatch(cmd, args) {
  switch (cmd) {
    case 'init':
      return initProject(args[0] || 'unnamed', { cwd: process.cwd() });

    case 'info':
      return getProjectInfo(process.cwd());

    case 'health':
      return healthCheck(process.cwd());

    case 'status': {
      const info = getProjectInfo(process.cwd());
      if (!info) return 'No xiro project found. Run /xiro new-project first.';
      const runState = loadRunState(process.cwd());
      return {
        feature: info.feature,
        status: runState.status,
        activePhase: info.activePhase,
        phases: info.phases,
        attemptCounts: runState.attempt_counts,
        consecutiveVerifierFailures: runState.consecutive_verifier_failures,
      };
    }

    case 'run':
      return runPhase({
        cwd: process.cwd(),
        phase: args.includes('--phase') ? parseInt(args[args.indexOf('--phase') + 1], 10) : undefined,
        task: args.includes('--task') ? args[args.indexOf('--task') + 1] : undefined,
        manual: args.includes('--manual') || args.includes('--next'),
        noParallel: args.includes('--no-parallel'),
      });

    case 'run-next':
      return runNext({ cwd: process.cwd() });

    case 'gate-check': {
      const phaseN = parseInt(args[0], 10);
      const taskN = args[1];
      const tasksContent = readPhaseFile(phaseN, 'tasks.md', process.cwd());
      if (!tasksContent) return { pass: false, reason: 'tasks.md not found' };
      const tasks = parseTasksMd(tasksContent);
      const task = tasks.find(t => t.id === taskN);
      if (!task) return { pass: false, reason: `Task ${taskN} not found` };
      return canCompleteTask(phaseN, taskN, task.subtasks, { cwd: process.cwd() });
    }

    case 'verify': {
      const verifyCmd = args.join(' ');
      return runVerifyCommand({
        command: verifyCmd,
        taskId: 'cli',
        phaseN: 0,
        taskN: 0,
        cwd: process.cwd(),
      });
    }

    case 'codex-review':
      return codexReview({
        changedFiles: args,
        taskSpec: 'CLI review request',
        phaseN: 0,
        taskN: 0,
        cwd: process.cwd(),
      });

    case 'ledger':
      return readLedger(process.cwd(), {
        limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : 50,
        type: args.includes('--type') ? args[args.indexOf('--type') + 1] : undefined,
      });

    case 'memory':
      return getMemorySummary(process.cwd());

    case 'patterns':
      return getPatterns(process.cwd());

    case 'pre-check':
      return canStartRun(process.cwd());

    case 'config':
      return loadConfig(process.cwd());

    default:
      return `Unknown command: ${cmd}. Available: init, info, health, status, run, run-next, gate-check, verify, codex-review, ledger, memory, patterns, pre-check, config`;
  }
}

// Export everything for use by slash commands and hooks
module.exports = {
  // Core
  initProject, projectExists, getProjectInfo, healthCheck,

  // Config
  loadConfig, saveConfig, getXiroRoot,

  // State
  loadRunState, saveRunState, loadCriteriaLock, saveCriteriaLock,

  // Phase
  listPhases, getActivePhase, createPhaseDir, getPhaseFiles, readPhaseFile,

  // Frontmatter
  parseTasksMd, parseGoldTestsMd,

  // Autorun
  runPhase, runNext, buildDependencyGraph, getExecutionOrder,

  // Verifier
  runVerifyCommand, runVerifySpec, runGoldTest, checkAntiMockup,

  // Gate
  canCompleteTask, canCompletePhase, canStartRun,

  // External verifier
  codexReview, codexSpecReview,

  // Memory
  notifyEvent, readLedger, getMemorySummary, getPatterns,

  // Honest guards
  guardR1, guardR2, guardR3, guardR4, guardR5, guardR6, guardR7, guardR8,

  // Evidence
  writeEvidence, writeCodexEvidence, writeVerifySummary,
  writeGoldEvidence, writeCheckpointEvidence, logDecision,
  readEvidence, parseExitCode, loadCodexReview,

  // Templates
  requirementsMdTemplate, designMdTemplate, tasksMdTemplate,
  goldTestsMdTemplate, specAnchorTemplate,
};
