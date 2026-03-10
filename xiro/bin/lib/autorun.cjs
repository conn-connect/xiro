'use strict';

/**
 * autorun.cjs — Phase Auto-Run Engine
 *
 * The core of xiro's execution model.
 * /run triggers this: it auto-executes the active phase
 * until completion, checkpoint, or hard stop.
 */

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./config.cjs');
const { loadRunState, saveRunState } = require('./state.cjs');
const { parseTasksMd, parseGoldTestsMd } = require('./frontmatter.cjs');
const { getPhaseDir, getActivePhase } = require('./phase.cjs');
const { getXiroRoot } = require('./config.cjs');
const { runVerifyCommand, runGoldTest, checkAntiMockup } = require('./verifier.cjs');
const { writeVerifySummary, writeCheckpointEvidence, logDecision } = require('./evidence.cjs');
const { canCompleteTask, canCompletePhase, canStartRun } = require('./gate.cjs');
const { codexReview } = require('./external-verifier.cjs');
const { notifyEvent } = require('./memory-bridge.cjs');
const { guardR6 } = require('./honest.cjs');

/**
 * Run the active phase to completion or hard stop.
 *
 * @param {Object} opts
 * @param {string} [opts.cwd] - Working directory
 * @param {number} [opts.phase] - Specific phase number (else auto-detect)
 * @param {string} [opts.task] - Specific task ID to run (manual mode)
 * @param {boolean} [opts.manual] - Manual mode: run one task at a time
 * @param {boolean} [opts.noParallel] - Disable parallel execution
 * @returns {Object} { status, report, phase, halted, haltReason }
 */
function runPhase(opts) {
  const cwd = opts?.cwd || process.cwd();
  const config = loadConfig(cwd);

  // Pre-run gate check
  const preCheck = canStartRun(cwd);
  if (!preCheck.pass) {
    return {
      status: 'BLOCKED',
      report: preCheck.message,
      halted: true,
      haltReason: preCheck.failures.map(f => f.reason).join('; '),
    };
  }

  // Determine active phase
  const phase = opts?.phase
    ? { number: opts.phase, dir: getPhaseDir(opts.phase, cwd) }
    : getActivePhase(cwd);

  if (!phase) {
    return { status: 'NO_ACTIVE_PHASE', report: 'No active phase found.', halted: true };
  }

  // Load tasks
  const tasksPath = path.join(phase.dir, 'tasks.md');
  if (!fs.existsSync(tasksPath)) {
    return { status: 'NO_TASKS', report: `No tasks.md found in phase ${phase.number}`, halted: true };
  }

  const tasksMdContent = fs.readFileSync(tasksPath, 'utf-8');
  const tasks = parseTasksMd(tasksMdContent);

  // Build dependency graph
  const graph = buildDependencyGraph(tasks);
  const runState = loadRunState(cwd);

  // Emit phase start event
  notifyEvent({
    type: 'BATCH_STARTED',
    phase: phase.number,
    taskCount: tasks.length,
    timestamp: new Date().toISOString(),
  }, cwd);

  const taskResults = [];

  // If specific task requested
  if (opts?.task) {
    const task = tasks.find(t => t.id === opts.task);
    if (!task) {
      return { status: 'TASK_NOT_FOUND', report: `Task ${opts.task} not found`, halted: true };
    }
    const result = executeTask(task, phase.number, config, runState, cwd);
    taskResults.push(result);
    saveRunState(runState, cwd);
    return buildPhaseReport(phase.number, taskResults, cwd, config);
  }

  // Execute tasks in dependency order
  const executionOrder = getExecutionOrder(graph, tasks);

  for (const group of executionOrder) {
    // Each group contains tasks that can run in parallel
    for (const task of group) {
      if (task.status === 'completed') continue;
      if (task.isCheckpoint) {
        // Run checkpoint verification
        const checkpointResult = runCheckpoint(phase.number, taskResults, task, config, cwd);
        taskResults.push(checkpointResult);
        if (!checkpointResult.pass) {
          saveRunState(runState, cwd);
          return {
            status: 'CHECKPOINT_HITL',
            report: checkpointResult.report,
            phase: phase.number,
            halted: false,
            checkpoint: true,
            taskResults,
          };
        }
        continue;
      }

      if (task.isSimplify) continue; // Simplify is handled post-checkpoint

      const result = executeTask(task, phase.number, config, runState, cwd);
      taskResults.push(result);

      if (result.halted) {
        saveRunState(runState, cwd);
        return {
          status: 'HALTED',
          report: result.haltReason,
          phase: phase.number,
          halted: true,
          haltReason: result.haltReason,
          taskResults,
        };
      }

      if (opts?.manual) {
        saveRunState(runState, cwd);
        return buildPhaseReport(phase.number, taskResults, cwd, config);
      }
    }
  }

  // All tasks done — run phase completion checks
  const phaseResult = runPhaseCompletion(phase.number, taskResults, config, cwd);
  saveRunState(runState, cwd);

  return phaseResult;
}

/**
 * Execute a single task through the full pipeline.
 */
function executeTask(task, phaseN, config, runState, cwd) {
  const attemptKey = `${phaseN}.${task.id}`;

  // Emit task assignment
  notifyEvent({
    type: 'TASK_ASSIGNED',
    phase: phaseN,
    task: task.id,
    title: task.title,
    timestamp: new Date().toISOString(),
  }, cwd);

  // R6: Check attempt count before even starting
  const attempts = runState.attempt_counts?.[attemptKey] || 0;
  const r6 = guardR6(attemptKey, attempts, config.verification.max_coder_attempts);
  if (!r6.pass) {
    notifyEvent({
      type: 'ESCALATION',
      phase: phaseN,
      task: task.id,
      reason: r6.reason,
      timestamp: new Date().toISOString(),
    }, cwd);
    return {
      id: task.id,
      title: task.title,
      pass: false,
      halted: true,
      haltReason: r6.reason,
    };
  }

  // Increment attempt count
  if (!runState.attempt_counts) runState.attempt_counts = {};
  runState.attempt_counts[attemptKey] = attempts + 1;

  // The actual execution pipeline is delegated to sub-agents by MC.
  // This function provides the STRUCTURE — MC spawns coder, then engine verifies.
  // In the tool-based model, this returns a plan for MC to execute.
  return {
    id: task.id,
    title: task.title,
    phase: phaseN,
    subtasks: task.subtasks,
    verify: task.verify || [],
    status: 'ready_for_execution',
    pass: null, // Will be determined after verification pipeline
    attempt: runState.attempt_counts[attemptKey],
    maxAttempts: config.verification.max_coder_attempts,
    pipeline: [
      'spawn_coder',
      'run_verification',
      'run_codex_review',
      'check_anti_mockup',
      'gate_check',
      'spawn_clerk',
      'notify_memory',
    ],
  };
}

/**
 * Run checkpoint verification.
 */
function runCheckpoint(phaseN, taskResults, checkpointTask, config, cwd) {
  const passedTasks = taskResults.filter(t => t.pass);
  const failedTasks = taskResults.filter(t => t.pass === false);

  // Load and run gold tests if enabled
  let goldTestResults = [];
  if (config.verification.gold_tests) {
    const goldTestsPath = path.join(getXiroRoot(cwd), 'gold-tests.md');
    const phaseGoldPath = path.join(getPhaseDir(phaseN, cwd) || '', 'gold-tests.md');

    for (const gPath of [goldTestsPath, phaseGoldPath]) {
      if (fs.existsSync(gPath)) {
        const content = fs.readFileSync(gPath, 'utf-8');
        const goldTests = parseGoldTestsMd(content);
        for (const gt of goldTests) {
          const result = runGoldTest(gt, cwd);
          goldTestResults.push(result);

          notifyEvent({
            type: 'GOLD_TEST',
            id: gt.id,
            pass: result.pass,
            exitCode: result.exitCode,
            timestamp: new Date().toISOString(),
          }, cwd);

          if (!result.pass) break; // Stop on first gold test failure
        }
      }
    }
  }

  // Phase gate check
  const phaseGate = canCompletePhase(phaseN, taskResults, {
    cwd,
    goldTestResults,
  });

  // Write checkpoint evidence
  writeCheckpointEvidence(phaseN, checkpointTask.id, 'gold-test-results', {
    results: goldTestResults.map(g => ({
      id: g.id,
      name: g.name,
      pass: g.pass,
      exitCode: g.exitCode,
    })),
  }, cwd);

  notifyEvent({
    type: 'CHECKPOINT_OPENED',
    phase: phaseN,
    checkpoint: checkpointTask.id,
    passedTasks: passedTasks.length,
    failedTasks: failedTasks.length,
    goldTestsPassed: goldTestResults.filter(g => g.pass).length,
    goldTestsTotal: goldTestResults.length,
    timestamp: new Date().toISOString(),
  }, cwd);

  const report = buildCheckpointReport(phaseN, taskResults, goldTestResults, checkpointTask);

  return {
    id: checkpointTask.id,
    isCheckpoint: true,
    pass: phaseGate.pass,
    report,
    goldTestResults,
    taskResults,
    failures: phaseGate.failures,
  };
}

/**
 * Run phase completion checks.
 */
function runPhaseCompletion(phaseN, taskResults, config, cwd) {
  // Regression suite
  let regressionResults = [];
  if (config.verification.regression_on_change) {
    // Re-run all previously passed verify commands
    const passedTasks = taskResults.filter(t => t.pass);
    // (Regression implementation delegated to verify commands re-execution)
  }

  // Gold tests cumulative
  let goldTestResults = [];
  if (config.verification.gold_tests) {
    const goldTestsPath = path.join(getXiroRoot(cwd), 'gold-tests.md');
    if (fs.existsSync(goldTestsPath)) {
      const content = fs.readFileSync(goldTestsPath, 'utf-8');
      const goldTests = parseGoldTestsMd(content);
      for (const gt of goldTests) {
        const result = runGoldTest(gt, cwd);
        goldTestResults.push(result);
      }
    }
  }

  const phaseGate = canCompletePhase(phaseN, taskResults, {
    cwd,
    regressionResults,
    goldTestResults,
  });

  notifyEvent({
    type: 'PHASE_COMPLETE',
    phase: phaseN,
    pass: phaseGate.pass,
    summary: {
      passed: taskResults.filter(t => t.pass).length,
      failed: taskResults.filter(t => t.pass === false).length,
      total: taskResults.length,
      goldTests: {
        passed: goldTestResults.filter(g => g.pass).length,
        total: goldTestResults.length,
      },
    },
    timestamp: new Date().toISOString(),
  }, cwd);

  return {
    status: phaseGate.pass ? 'PHASE_COMPLETE' : 'PHASE_BLOCKED',
    report: buildPhaseCompletionReport(phaseN, taskResults, goldTestResults, phaseGate),
    phase: phaseN,
    halted: !phaseGate.pass,
    haltReason: phaseGate.pass ? null : phaseGate.message,
    checkpoint: true,
    taskResults,
    goldTestResults,
  };
}

/**
 * Build dependency graph from parsed tasks.
 */
function buildDependencyGraph(tasks) {
  const graph = {};
  for (const task of tasks) {
    graph[task.id] = {
      id: task.id,
      dependencies: task.dependencies || [],
      dependents: [],
    };
  }

  // Build reverse edges
  for (const task of tasks) {
    for (const dep of task.dependencies || []) {
      if (graph[dep]) {
        graph[dep].dependents.push(task.id);
      }
    }
  }

  return graph;
}

/**
 * Get execution order respecting dependencies.
 * Returns array of groups that can run in parallel.
 */
function getExecutionOrder(graph, tasks) {
  const groups = [];
  const completed = new Set();
  const remaining = new Set(tasks.map(t => t.id));

  while (remaining.size > 0) {
    const ready = [];
    for (const id of remaining) {
      const node = graph[id];
      if (!node) { ready.push(id); continue; }
      const depsReady = node.dependencies.every(d => completed.has(d));
      if (depsReady) ready.push(id);
    }

    if (ready.length === 0) {
      // Circular dependency or broken graph — just add remaining
      const group = [...remaining].map(id => tasks.find(t => t.id === id)).filter(Boolean);
      groups.push(group);
      break;
    }

    const group = ready.map(id => tasks.find(t => t.id === id)).filter(Boolean);
    groups.push(group);
    for (const id of ready) {
      completed.add(id);
      remaining.delete(id);
    }
  }

  return groups;
}

function buildCheckpointReport(phaseN, taskResults, goldTestResults, checkpointTask) {
  const passed = taskResults.filter(t => t.pass).length;
  const total = taskResults.length;
  const goldPassed = goldTestResults.filter(g => g.pass).length;
  const goldTotal = goldTestResults.length;

  return `## Checkpoint: Phase ${phaseN}

**Tasks**: ${passed}/${total}
**Gold tests**: ${goldPassed}/${goldTotal}

### Task Results
${taskResults.map(t => `- ${t.id} ${t.title || ''}: ${t.pass ? 'PASS' : t.pass === false ? 'FAIL' : 'PENDING'}`).join('\n')}

### Gold Tests
${goldTestResults.map(g => `- ${g.id}: ${g.pass ? 'PASS' : 'FAIL'}`).join('\n') || 'None configured'}

### Options
- [Approve] → proceed to next phase
- [Fix] → specify what to fix
- [Stop] → halt development`;
}

function buildPhaseCompletionReport(phaseN, taskResults, goldTestResults, gateResult) {
  return `## Phase ${phaseN} Completion Report

**Status**: ${gateResult.pass ? 'READY FOR APPROVAL' : 'BLOCKED'}
**Tasks**: ${taskResults.filter(t => t.pass).length}/${taskResults.length}
**Gold Tests**: ${goldTestResults.filter(g => g.pass).length}/${goldTestResults.length}

${gateResult.pass ? '' : `### Blockers\n${gateResult.failures.map(f => `- ${f.rule}: ${f.reason}`).join('\n')}`}

### Options
- [Approve] → proceed to next phase
- [Changes] → request modifications
- [Abort] → halt development`;
}

function buildPhaseReport(phaseN, taskResults, cwd, config) {
  return {
    status: 'PARTIAL',
    report: `Phase ${phaseN}: ${taskResults.length} task(s) processed`,
    phase: phaseN,
    taskResults,
    halted: false,
  };
}

/**
 * Run next incomplete task.
 */
function runNext(opts) {
  return runPhase({ ...opts, manual: true });
}

module.exports = {
  runPhase,
  runNext,
  executeTask,
  runCheckpoint,
  runPhaseCompletion,
  buildDependencyGraph,
  getExecutionOrder,
};
