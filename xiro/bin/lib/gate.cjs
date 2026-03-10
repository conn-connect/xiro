'use strict';

/**
 * gate.cjs — State Transition Guard
 *
 * The gatekeeper. No task or phase can transition to COMPLETE
 * unless ALL guards pass. MC cannot bypass this.
 */

const fs = require('fs');
const path = require('path');
const { guardR1, guardR2, guardR3, guardR4, guardR5, guardR6, guardR7, guardR8 } = require('./honest.cjs');
const { getTaskEvidenceDir, loadCodexReview, parseExitCode, readEvidence } = require('./evidence.cjs');
const { loadConfig } = require('./config.cjs');
const { loadCriteriaLock, loadRunState } = require('./state.cjs');
const { checkAntiMockup } = require('./verifier.cjs');

/**
 * Check if a task can be marked as complete.
 * Returns { pass, failures, message }
 */
function canCompleteTask(phaseN, taskN, subtasks, opts) {
  const cwd = opts?.cwd || process.cwd();
  const config = loadConfig(cwd);
  const checks = [];
  const evidenceDir = getTaskEvidenceDir(phaseN, taskN, cwd);

  // R1: Every subtask must have evidence
  for (const subtask of subtasks) {
    if (subtask.cannotVerify && subtask.cannotVerify.length > 0) continue;
    checks.push(guardR1(evidenceDir, subtask.id));
  }

  // R2: All exit codes must be 0
  for (const subtask of subtasks) {
    if (subtask.cannotVerify && subtask.cannotVerify.length > 0) continue;
    const evidenceContent = readEvidence(phaseN, taskN, subtask.id, cwd);
    const exitCode = parseExitCode(evidenceContent);
    if (exitCode !== null) {
      checks.push(guardR2(exitCode));
    }
  }

  // R3: No new CANNOT_VERIFY after lock
  const criteriaLock = loadCriteriaLock(cwd);
  if (criteriaLock.phases && criteriaLock.phases[phaseN]) {
    const lockedCV = criteriaLock.phases[phaseN].cannot_verify || [];
    const currentCV = subtasks.flatMap(s => s.cannotVerify || []);
    checks.push(guardR3(currentCV, lockedCV));
  }

  // R4: Criteria not weakened
  if (criteriaLock.phases && criteriaLock.phases[phaseN]) {
    const lockedCriteria = criteriaLock.phases[phaseN].criteria || [];
    const currentCriteria = subtasks.flatMap(s =>
      (s.verify || []).flatMap(v =>
        v.commands.map(c => ({
          id: `${subtask?.id || taskN}.${c.command}`,
          command: c.command,
          expectedExitCode: c.expectedExitCode,
          expectedTestCount: c.expectedTestCount,
        }))
      )
    );
    if (lockedCriteria.length > 0) {
      checks.push(guardR4(currentCriteria, lockedCriteria));
    }
  }

  // R6: Check attempt count
  const runState = loadRunState(cwd);
  const attemptKey = `${phaseN}.${taskN}`;
  const attempts = runState.attempt_counts?.[attemptKey] || 0;
  if (attempts > 0) {
    checks.push(guardR6(attemptKey, attempts, config.verification.max_coder_attempts));
  }

  // External verifier (Codex)
  if (config.verification.external_verifier === 'required') {
    const codexResult = loadCodexReview(phaseN, taskN, cwd);
    if (!codexResult) {
      checks.push({ pass: false, rule: 'CODEX', reason: 'No Codex review found. External verification is required.' });
    } else if (!codexResult.pass) {
      checks.push({
        pass: false,
        rule: 'CODEX',
        reason: `Codex verdict: ${codexResult.verdict}. ${codexResult.findings.join('; ')}`,
      });
    }
  }

  // Anti-mockup check
  if (config.verification.anti_mockup) {
    const changedFiles = opts?.changedFiles || [];
    if (changedFiles.length > 0) {
      const mockups = checkAntiMockup(changedFiles, cwd);
      if (mockups.length > 0) {
        checks.push({
          pass: false,
          rule: 'ANTI_MOCKUP',
          reason: `Mockup/placeholder patterns detected: ${mockups.join('; ')}`,
        });
      }
    }
  }

  const failures = checks.filter(c => !c.pass);
  return {
    pass: failures.length === 0,
    failures,
    message: failures.length === 0
      ? 'All gates passed'
      : `Blocked by: ${failures.map(f => `${f.rule}: ${f.reason}`).join(' | ')}`,
    checks,
  };
}

/**
 * Check if a phase can be marked as complete.
 * Includes regression check and gold test verification.
 */
function canCompletePhase(phaseN, taskResults, opts) {
  const cwd = opts?.cwd || process.cwd();
  const config = loadConfig(cwd);
  const checks = [];

  // All tasks must have passed
  for (const task of taskResults) {
    if (!task.pass) {
      checks.push({
        pass: false,
        rule: 'TASK_INCOMPLETE',
        reason: `Task ${task.id} did not pass verification`,
      });
    }
  }

  // R5: Regression check results
  if (opts?.regressionResults) {
    checks.push(guardR5(opts.regressionResults));
  }

  // Gold test results
  if (config.verification.gold_tests && opts?.goldTestResults) {
    const failedGold = opts.goldTestResults.filter(g => !g.pass);
    if (failedGold.length > 0) {
      checks.push({
        pass: false,
        rule: 'GOLD_TEST',
        reason: `Gold tests failed: ${failedGold.map(g => g.id).join(', ')}`,
      });
    }
  }

  // R8: Consecutive verifier failures
  const runState = loadRunState(cwd);
  if (runState.consecutive_verifier_failures > 0) {
    checks.push(guardR8(
      runState.consecutive_verifier_failures,
      config.verification.max_verifier_failures,
    ));
  }

  const failures = checks.filter(c => !c.pass);
  return {
    pass: failures.length === 0,
    failures,
    message: failures.length === 0
      ? 'Phase gate passed'
      : `Phase blocked by: ${failures.map(f => `${f.rule}: ${f.reason}`).join(' | ')}`,
  };
}

/**
 * Pre-run gate: check if the system can start a run at all.
 */
function canStartRun(cwd) {
  const config = loadConfig(cwd);
  const checks = [];

  // Check if .xiro/ exists
  const { getXiroRoot } = require('./config.cjs');
  if (!fs.existsSync(getXiroRoot(cwd))) {
    checks.push({
      pass: false,
      rule: 'NO_PROJECT',
      reason: '.xiro/ directory not found. Run /xiro new-project first.',
    });
  }

  // Check if external verifier is available when required
  if (config.verification.external_verifier === 'required') {
    const codexAvailable = checkCodexAvailable();
    if (!codexAvailable) {
      checks.push({
        pass: false,
        rule: 'NO_CODEX',
        reason: 'External verifier (Codex) is required but not available. Install Codex CLI or set external_verifier to "optional".',
      });
    }
  }

  const failures = checks.filter(c => !c.pass);
  return {
    pass: failures.length === 0,
    failures,
    message: failures.length === 0
      ? 'Ready to run'
      : `Cannot start: ${failures.map(f => f.reason).join(' | ')}`,
  };
}

function checkCodexAvailable() {
  try {
    const { execSync } = require('child_process');
    execSync('which codex 2>/dev/null || where codex 2>nul', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    // Also check if OPENAI_API_KEY is set (for API-based verification)
    return !!process.env.OPENAI_API_KEY;
  }
}

module.exports = {
  canCompleteTask,
  canCompletePhase,
  canStartRun,
  checkCodexAvailable,
};
