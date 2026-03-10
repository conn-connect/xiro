'use strict';

/**
 * evidence.cjs — Evidence capture, storage, and validation
 *
 * All evidence is written by the engine (fs.writeFileSync), never by MC.
 * Evidence format: VERIFY command + TIMESTAMP + EXIT_CODE + RESULT + full output.
 */

const fs = require('fs');
const path = require('path');
const { getXiroRoot } = require('./config.cjs');

function getEvidenceRoot(cwd) {
  return path.join(getXiroRoot(cwd), 'evidence');
}

function getPhaseEvidenceDir(phaseN, cwd) {
  return path.join(getEvidenceRoot(cwd), `phase-${phaseN}`);
}

function getTaskEvidenceDir(phaseN, taskN, cwd) {
  return path.join(getPhaseEvidenceDir(phaseN, cwd), `task-${taskN}`);
}

function getCheckpointDir(phaseN, checkpointN, cwd) {
  return path.join(getPhaseEvidenceDir(phaseN, cwd), `checkpoint-${checkpointN}`);
}

function getGoldEvidenceDir(cwd) {
  return path.join(getEvidenceRoot(cwd), 'gold');
}

function getDecisionsLogPath(cwd) {
  return path.join(getEvidenceRoot(cwd), 'decisions.log');
}

/**
 * Write evidence for a subtask verification.
 * This is the ONLY way evidence gets created.
 */
function writeEvidence(phaseN, taskN, subtaskId, data, cwd) {
  const dir = getTaskEvidenceDir(phaseN, taskN, cwd);
  fs.mkdirSync(dir, { recursive: true });

  const attempt = data.attempt || 1;
  const fileName = attempt > 1
    ? `subtask-${subtaskId}.attempt-${attempt}.log`
    : `subtask-${subtaskId}.log`;

  const content = formatEvidence(data);
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Write a Codex review result as evidence.
 */
function writeCodexEvidence(phaseN, taskN, data, cwd) {
  const dir = getTaskEvidenceDir(phaseN, taskN, cwd);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, 'codex-review.md');
  const content = formatCodexEvidence(data);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Write a verify summary for a task.
 */
function writeVerifySummary(phaseN, taskN, results, cwd) {
  const dir = getTaskEvidenceDir(phaseN, taskN, cwd);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, 'verify-summary.md');
  const lines = [`# Verification Summary: Task ${taskN}`, '', '| Subtask | Command | Result | Attempts | Evidence |', '|---------|---------|--------|----------|----------|'];

  for (const r of results) {
    lines.push(`| ${r.subtaskId} | \`${r.command || 'N/A'}\` | ${r.result} | ${r.attempts || 1} | ${r.evidenceFile || 'N/A'} |`);
  }

  const passed = results.filter(r => r.result === 'PASS').length;
  lines.push('', `Overall: ${passed === results.length ? 'PASS' : 'FAIL'} (${passed}/${results.length} subtasks)`);

  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
  return filePath;
}

/**
 * Write gold test evidence.
 */
function writeGoldEvidence(testId, data, cwd) {
  const dir = getGoldEvidenceDir(cwd);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${testId.toLowerCase()}.log`);
  const content = formatEvidence(data);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Write checkpoint evidence (regression results, gold test results).
 */
function writeCheckpointEvidence(phaseN, checkpointN, type, data, cwd) {
  const dir = getCheckpointDir(phaseN, checkpointN, cwd);
  fs.mkdirSync(dir, { recursive: true });

  const fileName = `${type}.md`;
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

/**
 * Append to decisions log.
 */
function logDecision(decision, cwd) {
  const dir = getEvidenceRoot(cwd);
  fs.mkdirSync(dir, { recursive: true });

  const logPath = getDecisionsLogPath(cwd);
  const entry = `[${new Date().toISOString()}] DECISION: ${decision.what}\nREASON: ${decision.reason}\n${decision.anchorCheck ? `ANCHOR_CHECK: ${decision.anchorCheck}` : ''}\n\n`;
  fs.appendFileSync(logPath, entry, 'utf-8');
}

/**
 * Read evidence for a subtask.
 */
function readEvidence(phaseN, taskN, subtaskId, cwd) {
  const dir = getTaskEvidenceDir(phaseN, taskN, cwd);
  if (!fs.existsSync(dir)) return null;

  // Find the latest evidence file for this subtask
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith(`subtask-${subtaskId}`))
    .sort()
    .reverse();

  if (files.length === 0) return null;
  return fs.readFileSync(path.join(dir, files[0]), 'utf-8');
}

/**
 * Parse exit code from evidence content.
 */
function parseExitCode(evidenceContent) {
  if (!evidenceContent) return null;
  const match = evidenceContent.match(/EXIT_CODE:\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if Codex review exists and passed.
 */
function loadCodexReview(phaseN, taskN, cwd) {
  const dir = getTaskEvidenceDir(phaseN, taskN, cwd);
  const filePath = path.join(dir, 'codex-review.md');
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const verdictMatch = content.match(/VERDICT:\s*(PASS|FAIL|INSUFFICIENT_EVIDENCE|HITL_REQUIRED)/);
  if (!verdictMatch) return null;

  const findingsMatch = content.match(/## Findings\n([\s\S]*?)(?:\n##|$)/);
  const findings = findingsMatch
    ? findingsMatch[1].trim().split('\n').filter(l => l.trim())
    : [];

  return {
    pass: verdictMatch[1] === 'PASS',
    verdict: verdictMatch[1],
    findings,
    evidencePath: filePath,
  };
}

function formatEvidence(data) {
  const lines = [
    `VERIFY: ${data.command || 'N/A'}`,
    `TASK: ${data.taskId || 'N/A'}`,
    `TIMESTAMP: ${data.timestamp || new Date().toISOString()}`,
    `EXIT_CODE: ${data.exitCode}`,
    `RESULT: ${data.exitCode === 0 ? 'PASS' : 'FAIL'}`,
    '---',
    data.output || '',
  ];
  return lines.join('\n') + '\n';
}

function formatCodexEvidence(data) {
  const lines = [
    `# Codex Review: ${data.taskId || 'N/A'}`,
    '',
    `TIMESTAMP: ${data.timestamp || new Date().toISOString()}`,
    `VERDICT: ${data.verdict || 'UNKNOWN'}`,
    `MODEL: ${data.model || 'N/A'}`,
    '',
    '## Findings',
    ...(data.findings || []).map(f => `- ${f}`),
    '',
    '## Raw Output',
    data.rawOutput || 'N/A',
  ];
  return lines.join('\n') + '\n';
}

module.exports = {
  getEvidenceRoot,
  getPhaseEvidenceDir,
  getTaskEvidenceDir,
  getCheckpointDir,
  getGoldEvidenceDir,
  getDecisionsLogPath,
  writeEvidence,
  writeCodexEvidence,
  writeVerifySummary,
  writeGoldEvidence,
  writeCheckpointEvidence,
  logDecision,
  readEvidence,
  parseExitCode,
  loadCodexReview,
};
