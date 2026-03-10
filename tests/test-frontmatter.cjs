'use strict';

/**
 * Tests for frontmatter.cjs — VERIFY syntax parsing
 */

const { parseTasksMd, parseVerifyCommand, parseGoldTestsMd } = require('../xiro/bin/lib/frontmatter.cjs');

// Test: parse basic task structure
{
  const md = `# Tasks: Phase 1

- [ ] 1. Setup project
  - [ ] 1.1 Create structure
    - _Requirements: 1.1_
    - **VERIFY**: \`npm run build\` exits 0
  - [ ] 1.T Tests
    - **VERIFY**: \`npm test\` exits 0, 5 tests PASS

- [x] 2. Add models
  - [x] 2.1 User model
    - **VERIFY**: \`npm test -- --grep "user"\` exits 0
`;

  const tasks = parseTasksMd(md);
  assertEqual(tasks.length, 2, 'parseTasksMd: finds 2 tasks');
  assertEqual(tasks[0].id, '1', 'parseTasksMd: first task id is 1');
  assertEqual(tasks[0].status, 'pending', 'parseTasksMd: first task is pending');
  assertEqual(tasks[1].status, 'completed', 'parseTasksMd: second task is completed');
  assertEqual(tasks[0].subtasks.length, 2, 'parseTasksMd: first task has 2 subtasks');
}

// Test: parse VERIFY command variants
{
  const v1 = parseVerifyCommand('`npm run build` exits 0');
  assertEqual(v1.commands[0].command, 'npm run build', 'parseVerifyCommand: extracts command');
  assertEqual(v1.commands[0].expectedExitCode, 0, 'parseVerifyCommand: exit code 0');
}

{
  const v2 = parseVerifyCommand('`npm test` exits 0, 8 tests PASS');
  assertEqual(v2.commands[0].expectedTestCount, 8, 'parseVerifyCommand: test count 8');
}

{
  const v3 = parseVerifyCommand('`curl localhost:3000/health` contains "ok"');
  assertEqual(v3.commands[0].contains, 'ok', 'parseVerifyCommand: contains check');
}

// Test: parse gold tests
{
  const md = `# Gold Tests: auth

## GT-1: Login Flow
**Added**: Phase 1
**VERIFY**: \`pytest tests/gold/test_login.py\` exits 0

## GT-2: Invalid Creds
**Added**: Phase 1
**VERIFY**: \`pytest tests/gold/test_invalid.py\` exits 0
`;

  const tests = parseGoldTestsMd(md);
  assertEqual(tests.length, 2, 'parseGoldTestsMd: finds 2 gold tests');
  assertEqual(tests[0].id, 'GT-1', 'parseGoldTestsMd: first test id');
  assertEqual(tests[0].command, 'pytest tests/gold/test_login.py', 'parseGoldTestsMd: command');
  assertEqual(tests[1].addedPhase, 1, 'parseGoldTestsMd: addedPhase');
}

// Test: parse checkpoint
{
  const md = `# Tasks: Phase 1

- [ ] **checkpoint**: Phase 1 check
  - **VERIFY_ALL**:
    - \`npm test\` exits 0
    - \`npm run lint\` exits 0
  - **GOLD_TEST**: run all gold tests
`;

  const tasks = parseTasksMd(md);
  assert(tasks.length >= 1, 'parseTasksMd: finds checkpoint task');
  assert(tasks[0].isCheckpoint === true, 'parseTasksMd: identifies checkpoint');
  assert(tasks[0].runGoldTests === true, 'parseTasksMd: identifies GOLD_TEST');
}

// Test: parse dependencies
{
  const md = `# Tasks: Phase 1

- [ ] 1. First task
  - [ ] 1.1 Sub
    - **VERIFY**: \`echo ok\` exits 0

- [ ] 2. Second task
  - [ ] 2.1 Sub
    - **VERIFY**: \`echo ok\` exits 0
  _depends: 1_
`;

  const tasks = parseTasksMd(md);
  assertEqual(tasks.length, 2, 'parseTasksMd deps: finds 2 tasks');
  assertDeepEqual(tasks[1].dependencies, ['1'], 'parseTasksMd deps: task 2 depends on 1');
}
