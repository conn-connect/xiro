'use strict';

/**
 * Tests for honest.cjs — R1-R8 Guard Functions
 *
 * 16 tests: 2 per rule (PASS and FAIL case)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { guardR1, guardR2, guardR3, guardR4, guardR5, guardR6, guardR7, guardR8 } = require('../xiro/bin/lib/honest.cjs');

// Helper: create temp directory with evidence
function createTempEvidence(taskId, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xiro-test-'));
  const fileName = `subtask-${taskId}.log`;
  fs.writeFileSync(path.join(dir, fileName), content, 'utf-8');
  return dir;
}

// ── R1: EVIDENCE_REQUIRED ──

// R1 PASS: evidence file exists with EXIT_CODE
{
  const dir = createTempEvidence('1.1', 'VERIFY: npm test\nEXIT_CODE: 0\nRESULT: PASS\n---\nAll tests passed');
  const result = guardR1(dir, '1.1');
  assert(result.pass === true, 'R1 PASS: evidence exists with EXIT_CODE');
  fs.rmSync(dir, { recursive: true });
}

// R1 FAIL: no evidence directory
{
  const result = guardR1('/nonexistent/path', '1.1');
  assert(result.pass === false, 'R1 FAIL: no evidence directory');
  assertEqual(result.rule, 'R1', 'R1 FAIL: rule is R1');
}

// R1 FAIL: evidence file exists but missing EXIT_CODE
{
  const dir = createTempEvidence('2.1', 'VERIFY: npm test\nSome output without exit code');
  const result = guardR1(dir, '2.1');
  assert(result.pass === false, 'R1 FAIL: evidence missing EXIT_CODE');
  fs.rmSync(dir, { recursive: true });
}

// ── R2: EXIT_CODE_TRUTH ──

// R2 PASS: exit code 0
{
  const result = guardR2(0);
  assert(result.pass === true, 'R2 PASS: exit code 0');
}

// R2 FAIL: exit code 1
{
  const result = guardR2(1);
  assert(result.pass === false, 'R2 FAIL: exit code 1');
  assertEqual(result.rule, 'R2', 'R2 FAIL: rule is R2');
}

// R2 FAIL: exit code not a number
{
  const result = guardR2('success');
  assert(result.pass === false, 'R2 FAIL: exit code is not a number');
}

// ── R3: CANNOT_VERIFY spec-time only ──

// R3 PASS: no new CANNOT_VERIFY after lock
{
  const current = [{ what: 'OAuth flow' }];
  const locked = [{ what: 'OAuth flow' }];
  const result = guardR3(current, locked);
  assert(result.pass === true, 'R3 PASS: no new CANNOT_VERIFY');
}

// R3 FAIL: new CANNOT_VERIFY added after lock
{
  const current = [{ what: 'OAuth flow' }, { what: 'Email delivery' }];
  const locked = [{ what: 'OAuth flow' }];
  const result = guardR3(current, locked);
  assert(result.pass === false, 'R3 FAIL: new CANNOT_VERIFY added');
  assertEqual(result.rule, 'R3', 'R3 FAIL: rule is R3');
}

// ── R4: NO_CRITERIA_WEAKENING ──

// R4 PASS: criteria unchanged
{
  const locked = [{ id: 'test1', command: 'npm test', expectedExitCode: 0 }];
  const current = [{ id: 'test1', command: 'npm test', expectedExitCode: 0 }];
  const result = guardR4(current, locked);
  assert(result.pass === true, 'R4 PASS: criteria unchanged');
}

// R4 FAIL: test count reduced
{
  const locked = [{ id: 'test1', command: 'npm test', expectedTestCount: 10 }];
  const current = [{ id: 'test1', command: 'npm test', expectedTestCount: 5 }];
  const result = guardR4(current, locked);
  assert(result.pass === false, 'R4 FAIL: test count reduced');
  assertEqual(result.rule, 'R4', 'R4 FAIL: rule is R4');
}

// ── R5: REGRESSION_GUARD ──

// R5 PASS: no regressions
{
  const results = [
    { taskId: '1.1', exitCode: 0 },
    { taskId: '1.2', exitCode: 0 },
  ];
  const result = guardR5(results);
  assert(result.pass === true, 'R5 PASS: no regressions');
}

// R5 FAIL: regression detected
{
  const results = [
    { taskId: '1.1', exitCode: 0 },
    { taskId: '1.2', exitCode: 1 },
  ];
  const result = guardR5(results);
  assert(result.pass === false, 'R5 FAIL: regression detected');
  assertEqual(result.rule, 'R5', 'R5 FAIL: rule is R5');
}

// ── R6: 3-STRIKE ESCALATION ──

// R6 PASS: under attempt limit
{
  const result = guardR6('3.1', 2, 3);
  assert(result.pass === true, 'R6 PASS: 2 attempts (under limit of 3)');
}

// R6 FAIL: at attempt limit
{
  const result = guardR6('3.1', 3, 3);
  assert(result.pass === false, 'R6 FAIL: 3 attempts (at limit)');
  assertEqual(result.rule, 'R6', 'R6 FAIL: rule is R6');
  assertEqual(result.action, 'ESCALATE', 'R6 FAIL: action is ESCALATE');
}

// ── R7: NO_SPECULATIVE_LANGUAGE ──

// R7 PASS: no speculative language
{
  const result = guardR7('The test passed with exit code 0. All 5 assertions verified.');
  assert(result.pass === true, 'R7 PASS: no speculative language');
}

// R7 FAIL: speculative language detected
{
  const result = guardR7('The button should work correctly and appears to render properly');
  assert(result.pass === false, 'R7 FAIL: speculative language detected');
  assertEqual(result.rule, 'R7', 'R7 FAIL: rule is R7');
}

// ── R8: VERIFIER_HALT ──

// R8 PASS: under failure limit
{
  const result = guardR8(3, 5);
  assert(result.pass === true, 'R8 PASS: 3 consecutive failures (under limit of 5)');
}

// R8 FAIL: at failure limit
{
  const result = guardR8(5, 5);
  assert(result.pass === false, 'R8 FAIL: 5 consecutive failures (at limit)');
  assertEqual(result.rule, 'R8', 'R8 FAIL: rule is R8');
  assertEqual(result.action, 'VERIFIER_HALT', 'R8 FAIL: action is VERIFIER_HALT');
}
