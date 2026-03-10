'use strict';

/**
 * honest.cjs — R1-R8 Guard Functions
 *
 * Hiro's Honest Failure Protocol, implemented as deterministic JS functions.
 * MC cannot bypass these — functions return { pass, rule, reason } and
 * gate.cjs uses these to block state transitions.
 */

const fs = require('fs');
const path = require('path');

// R1: Evidence가 없으면 완료 불가
// No evidence = not done
function guardR1(evidenceDir, taskId) {
  if (!evidenceDir || !fs.existsSync(evidenceDir)) {
    return { pass: false, rule: 'R1', reason: `Evidence directory missing: ${evidenceDir}` };
  }

  // Look for any evidence file matching the task
  const files = fs.readdirSync(evidenceDir);
  const hasEvidence = files.some(f =>
    f.startsWith(`subtask-${taskId}`) || f.startsWith(`task-${taskId}`) || f === `${taskId}.log`
  );

  if (!hasEvidence) {
    return { pass: false, rule: 'R1', reason: `No evidence file found for task ${taskId} in ${evidenceDir}` };
  }

  // Check that evidence contains EXIT_CODE
  const evidenceFile = files.find(f =>
    f.startsWith(`subtask-${taskId}`) || f.startsWith(`task-${taskId}`) || f === `${taskId}.log`
  );
  const content = fs.readFileSync(path.join(evidenceDir, evidenceFile), 'utf-8');
  if (!content.includes('EXIT_CODE:')) {
    return { pass: false, rule: 'R1', reason: `Evidence file for ${taskId} missing EXIT_CODE` };
  }

  return { pass: true, rule: 'R1' };
}

// R2: Exit code 0만 PASS. 예외 없음.
// Exit code 0 = pass. Non-zero = fail. Always.
function guardR2(exitCode) {
  if (typeof exitCode !== 'number') {
    return { pass: false, rule: 'R2', reason: `Exit code is not a number: ${exitCode}` };
  }
  return {
    pass: exitCode === 0,
    rule: 'R2',
    reason: exitCode === 0 ? null : `Exit code ${exitCode} ≠ 0`,
  };
}

// R3: CANNOT_VERIFY는 spec 타임에만 선언 가능
// CANNOT_VERIFY can only be declared at spec time, not added later
function guardR3(currentCannotVerify, lockedCannotVerify) {
  const locked = lockedCannotVerify || [];
  const current = currentCannotVerify || [];

  const newItems = current.filter(cv => {
    const cvId = typeof cv === 'string' ? cv : cv.what || cv.id;
    return !locked.some(l => {
      const lId = typeof l === 'string' ? l : l.what || l.id;
      return lId === cvId;
    });
  });

  if (newItems.length > 0) {
    const names = newItems.map(cv => typeof cv === 'string' ? cv : cv.what || cv.id);
    return {
      pass: false,
      rule: 'R3',
      reason: `CANNOT_VERIFY added after spec lock: ${names.join(', ')}`,
    };
  }
  return { pass: true, rule: 'R3' };
}

// R4: 검증 기준 약화 감지
// Verification criteria cannot be weakened after lock
function guardR4(currentCriteria, lockedCriteria) {
  if (!lockedCriteria || !currentCriteria) {
    return { pass: true, rule: 'R4' };
  }

  const weakened = [];

  for (const locked of lockedCriteria) {
    const lockedId = locked.id || locked.command;
    const current = currentCriteria.find(c => (c.id || c.command) === lockedId);

    if (!current) {
      weakened.push(`Criteria removed: ${lockedId}`);
      continue;
    }

    // Check if exit code expectation was relaxed
    if (locked.expectedExitCode !== undefined && current.expectedExitCode !== undefined) {
      if (locked.expectedExitCode === 0 && current.expectedExitCode !== 0) {
        weakened.push(`Exit code relaxed for ${lockedId}: was 0, now ${current.expectedExitCode}`);
      }
    }

    // Check if test count was reduced
    if (locked.expectedTestCount !== undefined && current.expectedTestCount !== undefined) {
      if (current.expectedTestCount < locked.expectedTestCount) {
        weakened.push(`Test count reduced for ${lockedId}: was ${locked.expectedTestCount}, now ${current.expectedTestCount}`);
      }
    }

    // Check if command was changed to be less strict
    if (locked.command && current.command && locked.command !== current.command) {
      // Flag as potential weakening — engine can't semantically judge but records the diff
      weakened.push(`Command changed for ${lockedId}: was "${locked.command}", now "${current.command}"`);
    }
  }

  if (weakened.length > 0) {
    return { pass: false, rule: 'R4', reason: `Criteria weakened: ${weakened.join('; ')}` };
  }
  return { pass: true, rule: 'R4' };
}

// R5: Regression guard
// All previous PASS results must still pass when re-run
function guardR5(regressionResults) {
  if (!regressionResults || regressionResults.length === 0) {
    return { pass: true, rule: 'R5' };
  }

  const regressions = regressionResults.filter(r => r.exitCode !== 0);
  if (regressions.length > 0) {
    return {
      pass: false,
      rule: 'R5',
      reason: `Regression detected: ${regressions.map(r => `${r.taskId} (exit ${r.exitCode})`).join(', ')}`,
      regressions,
    };
  }
  return { pass: true, rule: 'R5' };
}

// R6: 3회 실패 시 FULL STOP
// 3 failures = escalate, no more retries
function guardR6(taskId, attemptCount, maxAttempts) {
  const max = maxAttempts || 3;
  if (attemptCount >= max) {
    return {
      pass: false,
      rule: 'R6',
      reason: `Task ${taskId} failed ${attemptCount} times (max: ${max}). FULL STOP.`,
      action: 'ESCALATE',
    };
  }
  return { pass: true, rule: 'R6' };
}

// R7: 스크린샷 설명에 추정 표현 감지
// Screenshot/evidence descriptions must not use speculative language
function guardR7(description) {
  if (!description || typeof description !== 'string') {
    return { pass: true, rule: 'R7' };
  }

  const speculative = [
    'should', 'expected to', 'probably', 'likely',
    'appears to', 'seems like', 'might be', 'could be',
    'looks like it', 'presumably',
  ];

  const found = speculative.filter(w => description.toLowerCase().includes(w));
  if (found.length > 0) {
    return {
      pass: false,
      rule: 'R7',
      reason: `Speculative language in evidence description: "${found.join('", "')}"`,
    };
  }
  return { pass: true, rule: 'R7' };
}

// R8: 외부 검증자 5회 연속 실패 시 HALT
// 5 consecutive external verifier failures = halt
function guardR8(consecutiveFailures, maxFailures) {
  const max = maxFailures || 5;
  if (consecutiveFailures >= max) {
    return {
      pass: false,
      rule: 'R8',
      reason: `External verifier failed ${consecutiveFailures} consecutive times (max: ${max}). HALT.`,
      action: 'VERIFIER_HALT',
    };
  }
  return { pass: true, rule: 'R8' };
}

module.exports = {
  guardR1,
  guardR2,
  guardR3,
  guardR4,
  guardR5,
  guardR6,
  guardR7,
  guardR8,
};
