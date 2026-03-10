'use strict';

/**
 * memory-bridge.cjs — Haiku Memory Recorder Bridge
 *
 * Bridge between JS engine events and the Haiku memory agent.
 * All events are written to:
 * 1. ledger/events.ndjson (canonical, engine-owned, always written)
 * 2. memory/inbox/{timestamp}.json (for Haiku agent consumption)
 */

const fs = require('fs');
const path = require('path');
const { getXiroRoot } = require('./config.cjs');

function getLedgerPath(cwd) {
  return path.join(getXiroRoot(cwd), 'ledger', 'events.ndjson');
}

function getMemoryDir(cwd) {
  return path.join(getXiroRoot(cwd), 'memory');
}

function getInboxDir(cwd) {
  return path.join(getMemoryDir(cwd), 'inbox');
}

/**
 * Emit a structured event.
 * Written to both the canonical ledger and the memory inbox.
 *
 * Event types:
 * - FEATURE_CREATED, SPEC_GENERATED, PHASE_APPROVED
 * - BATCH_STARTED, TASK_ASSIGNED, DIFF_PRODUCED
 * - VERIFY_PASS, VERIFY_FAIL, VERIFY_EXECUTED
 * - CODEX_FINDING, CODEX_PASS, CODEX_FAIL
 * - REGRESSION, CHECKPOINT_OPENED
 * - DECISION, ESCALATION
 * - GOLD_TEST, GOLD_TEST_FAIL
 * - RUN_HALT, RUN_RESUME
 * - MERGE_COMPLETED, COMMIT_RECORDED
 * - BLOCKER_RECORDED, PHASE_COMPLETE
 */
function notifyEvent(event, cwd) {
  const workDir = cwd || process.cwd();

  // Ensure timestamp
  if (!event.timestamp) {
    event.timestamp = new Date().toISOString();
  }

  // 1. Write to canonical ledger (append, ndjson)
  const ledgerPath = getLedgerPath(workDir);
  const ledgerDir = path.dirname(ledgerPath);
  if (!fs.existsSync(ledgerDir)) {
    fs.mkdirSync(ledgerDir, { recursive: true });
  }
  fs.appendFileSync(ledgerPath, JSON.stringify(event) + '\n', 'utf-8');

  // 2. Write to memory inbox (individual JSON files for Haiku agent)
  const inboxDir = getInboxDir(workDir);
  if (!fs.existsSync(inboxDir)) {
    fs.mkdirSync(inboxDir, { recursive: true });
  }
  const ts = event.timestamp.replace(/[:.]/g, '-');
  const inboxFile = path.join(inboxDir, `${ts}-${event.type}.json`);
  fs.writeFileSync(inboxFile, JSON.stringify(event, null, 2) + '\n', 'utf-8');
}

/**
 * Read the event ledger.
 * Returns array of parsed events.
 */
function readLedger(cwd, opts) {
  const ledgerPath = getLedgerPath(cwd);
  if (!fs.existsSync(ledgerPath)) return [];

  const content = fs.readFileSync(ledgerPath, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.trim());

  let events = lines.map(line => {
    try { return JSON.parse(line); }
    catch { return null; }
  }).filter(Boolean);

  // Filter by type
  if (opts?.type) {
    events = events.filter(e => e.type === opts.type);
  }

  // Filter by phase
  if (opts?.phase !== undefined) {
    events = events.filter(e => e.phase === opts.phase);
  }

  // Limit
  if (opts?.limit) {
    events = events.slice(-opts.limit);
  }

  return events;
}

/**
 * Get memory summary for session recovery.
 * Reads the latest memory summary if available,
 * otherwise reconstructs from ledger.
 */
function getMemorySummary(cwd) {
  const memDir = getMemoryDir(cwd);
  const latestPath = path.join(memDir, 'latest.md');

  if (fs.existsSync(latestPath)) {
    return fs.readFileSync(latestPath, 'utf-8');
  }

  // Reconstruct from ledger
  const events = readLedger(cwd);
  if (events.length === 0) return 'No events recorded yet.';

  const summary = [];
  summary.push('# Memory Summary (Auto-generated from ledger)');
  summary.push('');

  // Group by phase
  const phases = {};
  for (const event of events) {
    const phase = event.phase || 'global';
    if (!phases[phase]) phases[phase] = [];
    phases[phase].push(event);
  }

  for (const [phase, phaseEvents] of Object.entries(phases)) {
    summary.push(`## Phase ${phase}`);
    const important = phaseEvents.filter(e =>
      ['VERIFY_FAIL', 'ESCALATION', 'RUN_HALT', 'DECISION',
       'PHASE_COMPLETE', 'GOLD_TEST', 'BLOCKER_RECORDED',
       'REGRESSION'].includes(e.type)
    );
    for (const event of important) {
      summary.push(`- [${event.timestamp}] ${event.type}: ${event.reason || event.task || JSON.stringify(event.summary || '')}`);
    }
    summary.push('');
  }

  return summary.join('\n');
}

/**
 * Get recurring patterns from memory.
 */
function getPatterns(cwd) {
  const patternsPath = path.join(getMemoryDir(cwd), 'patterns.md');
  if (fs.existsSync(patternsPath)) {
    return fs.readFileSync(patternsPath, 'utf-8');
  }

  // Auto-detect patterns from ledger
  const events = readLedger(cwd);
  const failCounts = {};

  for (const event of events) {
    if (event.type === 'VERIFY_FAIL') {
      const key = event.task || 'unknown';
      failCounts[key] = (failCounts[key] || 0) + 1;
    }
  }

  const patterns = [];
  for (const [task, count] of Object.entries(failCounts)) {
    if (count >= 2) {
      patterns.push(`- Task ${task}: failed ${count} times`);
    }
  }

  return patterns.length > 0
    ? `# Detected Patterns\n\n${patterns.join('\n')}\n`
    : 'No patterns detected yet.';
}

/**
 * Process inbox events (called by Haiku agent).
 * Reads unprocessed events from inbox, processes them,
 * and updates the memory summary.
 */
function processInbox(cwd) {
  const inboxDir = getInboxDir(cwd);
  if (!fs.existsSync(inboxDir)) return [];

  const files = fs.readdirSync(inboxDir).sort();
  const events = [];

  for (const file of files) {
    const filePath = path.join(inboxDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      events.push(JSON.parse(content));
      // Remove processed file
      fs.unlinkSync(filePath);
    } catch {
      // Skip malformed files
    }
  }

  return events;
}

module.exports = {
  getLedgerPath,
  getMemoryDir,
  getInboxDir,
  notifyEvent,
  readLedger,
  getMemorySummary,
  getPatterns,
  processInbox,
};
