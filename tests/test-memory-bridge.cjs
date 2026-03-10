'use strict';

/**
 * Tests for memory-bridge.cjs — Event ledger and memory inbox
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { initProject } = require('../xiro/bin/lib/core.cjs');
const { notifyEvent, readLedger, getMemorySummary, processInbox } = require('../xiro/bin/lib/memory-bridge.cjs');

function makeTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xiro-test-mem-'));
  initProject('test-feature', { cwd: dir });
  return dir;
}

// Test: notifyEvent writes to ledger
{
  const dir = makeTempProject();
  notifyEvent({ type: 'VERIFY_PASS', task: '1.1', evidence: 'ok' }, dir);
  const events = readLedger(dir);
  // Should have FEATURE_CREATED + VERIFY_PASS
  assert(events.length >= 2, 'notifyEvent: events written to ledger');
  assert(events.some(e => e.type === 'VERIFY_PASS'), 'notifyEvent: VERIFY_PASS in ledger');
  fs.rmSync(dir, { recursive: true });
}

// Test: notifyEvent writes to inbox
{
  const dir = makeTempProject();
  notifyEvent({ type: 'VERIFY_FAIL', task: '2.1', attempt: 2 }, dir);
  const inboxDir = path.join(dir, '.xiro', 'memory', 'inbox');
  const files = fs.readdirSync(inboxDir);
  assert(files.some(f => f.includes('VERIFY_FAIL')), 'notifyEvent: inbox file created');
  fs.rmSync(dir, { recursive: true });
}

// Test: readLedger with type filter
{
  const dir = makeTempProject();
  notifyEvent({ type: 'VERIFY_PASS', task: '1.1' }, dir);
  notifyEvent({ type: 'VERIFY_FAIL', task: '1.2' }, dir);
  notifyEvent({ type: 'VERIFY_PASS', task: '1.3' }, dir);
  const passEvents = readLedger(dir, { type: 'VERIFY_PASS' });
  assertEqual(passEvents.length, 2, 'readLedger: filters by type');
  fs.rmSync(dir, { recursive: true });
}

// Test: processInbox reads and removes files
{
  const dir = makeTempProject();
  notifyEvent({ type: 'ESCALATION', task: '3.1', reason: 'test' }, dir);
  const inboxBefore = fs.readdirSync(path.join(dir, '.xiro', 'memory', 'inbox'));
  // Filter out the FEATURE_CREATED event that initProject creates
  const escalationFiles = inboxBefore.filter(f => f.includes('ESCALATION'));
  assert(escalationFiles.length >= 1, 'processInbox: inbox has files before processing');

  const events = processInbox(dir);
  assert(events.length >= 1, 'processInbox: returns events');

  const inboxAfter = fs.readdirSync(path.join(dir, '.xiro', 'memory', 'inbox'));
  assertEqual(inboxAfter.length, 0, 'processInbox: inbox empty after processing');
  fs.rmSync(dir, { recursive: true });
}

// Test: getMemorySummary generates summary from ledger
{
  const dir = makeTempProject();
  notifyEvent({ type: 'VERIFY_FAIL', task: '1.1', reason: 'timeout', phase: 1 }, dir);
  notifyEvent({ type: 'PHASE_COMPLETE', phase: 1, summary: { passed: 3, total: 4 } }, dir);
  const summary = getMemorySummary(dir);
  assert(typeof summary === 'string', 'getMemorySummary: returns string');
  assert(summary.includes('VERIFY_FAIL'), 'getMemorySummary: includes VERIFY_FAIL');
  assert(summary.includes('PHASE_COMPLETE'), 'getMemorySummary: includes PHASE_COMPLETE');
  fs.rmSync(dir, { recursive: true });
}
