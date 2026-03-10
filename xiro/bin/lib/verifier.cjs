'use strict';

/**
 * verifier.cjs — VERIFY Command Runner (Runner role)
 *
 * Deterministic, non-LLM execution of declared VERIFY commands.
 * Captures stdout/stderr/exit code. Does NOT interpret results semantically.
 */

const { execSync } = require('child_process');
const path = require('path');
const { writeEvidence, writeGoldEvidence } = require('./evidence.cjs');

/**
 * Execute a single VERIFY command and capture evidence.
 *
 * @param {Object} opts
 * @param {string} opts.command - The shell command to execute
 * @param {string} opts.taskId - Task/subtask identifier
 * @param {number} opts.phaseN - Phase number
 * @param {number} opts.taskN - Task number
 * @param {number} [opts.attempt] - Attempt number
 * @param {string} [opts.cwd] - Working directory
 * @param {number} [opts.timeout] - Timeout in ms (default 120000)
 * @returns {Object} { exitCode, output, evidencePath, pass }
 */
function runVerifyCommand(opts) {
  const { command, taskId, phaseN, taskN, attempt, cwd, timeout } = opts;
  const timeoutMs = timeout || 120000;
  let output = '';
  let exitCode = 1;

  try {
    output = execSync(command, {
      cwd: cwd || process.cwd(),
      timeout: timeoutMs,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    exitCode = 0;
  } catch (err) {
    exitCode = err.status || 1;
    output = (err.stdout || '') + '\n' + (err.stderr || '');
    if (err.killed) {
      exitCode = 124; // timeout convention
      output += '\n[TIMEOUT: command exceeded time limit]';
    }
  }

  const evidencePath = writeEvidence(phaseN, taskN, taskId, {
    command,
    taskId,
    exitCode,
    output: output.trim(),
    timestamp: new Date().toISOString(),
    attempt: attempt || 1,
  }, cwd);

  return {
    exitCode,
    output: output.trim(),
    evidencePath,
    pass: exitCode === 0,
  };
}

/**
 * Execute a parsed VERIFY spec (from frontmatter.cjs).
 * Handles compound commands (AND), test count checks, contains/matches.
 */
function runVerifySpec(verifySpec, opts) {
  const results = [];

  for (const cmd of verifySpec.commands) {
    const result = runVerifyCommand({
      ...opts,
      command: cmd.command,
    });

    // Additional checks beyond exit code
    if (result.pass && cmd.expectedTestCount) {
      const testCountMatch = result.output.match(/(\d+)\s+passed/i) ||
                              result.output.match(/(\d+)\s+tests?\s+passed/i) ||
                              result.output.match(/passed[:\s]+(\d+)/i);
      if (testCountMatch) {
        const actual = parseInt(testCountMatch[1], 10);
        if (actual < cmd.expectedTestCount) {
          result.pass = false;
          result.testCountError = `Expected ${cmd.expectedTestCount} tests, got ${actual}`;
        }
      }
    }

    if (result.pass && cmd.contains) {
      if (!result.output.includes(cmd.contains)) {
        result.pass = false;
        result.containsError = `Output does not contain "${cmd.contains}"`;
      }
    }

    if (result.pass && cmd.matches) {
      try {
        const regex = new RegExp(cmd.matches);
        if (!regex.test(result.output)) {
          result.pass = false;
          result.matchesError = `Output does not match /${cmd.matches}/`;
        }
      } catch {
        result.pass = false;
        result.matchesError = `Invalid regex: ${cmd.matches}`;
      }
    }

    results.push(result);
  }

  const allPassed = results.every(r => r.pass);
  return {
    pass: allPassed,
    results,
    evidencePaths: results.map(r => r.evidencePath),
  };
}

/**
 * Run a gold test command and capture evidence.
 */
function runGoldTest(goldTest, cwd) {
  let output = '';
  let exitCode = 1;

  try {
    output = execSync(goldTest.command, {
      cwd: cwd || process.cwd(),
      timeout: 180000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    exitCode = 0;
  } catch (err) {
    exitCode = err.status || 1;
    output = (err.stdout || '') + '\n' + (err.stderr || '');
  }

  const evidencePath = writeGoldEvidence(goldTest.id, {
    command: goldTest.command,
    taskId: goldTest.id,
    exitCode,
    output: output.trim(),
    timestamp: new Date().toISOString(),
  }, cwd);

  return {
    id: goldTest.id,
    name: goldTest.name,
    exitCode,
    pass: exitCode === 0,
    output: output.trim(),
    evidencePath,
  };
}

/**
 * Check for anti-mockup patterns in changed files.
 * Returns list of detected mockup symptoms.
 */
function checkAntiMockup(changedFiles, cwd) {
  const symptoms = [];
  const baseCwd = cwd || process.cwd();

  const mockupPatterns = [
    { pattern: /onClick=\{?\s*\(\)\s*=>\s*\{\s*\}\s*\}?/g, desc: 'Empty onClick handler' },
    { pattern: /onSubmit=\{?\s*\(\)\s*=>\s*\{\s*\}\s*\}?/g, desc: 'Empty onSubmit handler' },
    { pattern: /TODO:\s*implement/gi, desc: 'TODO: implement placeholder' },
    { pattern: /placeholder|coming\s+soon|not\s+implemented/gi, desc: 'Placeholder text' },
    { pattern: /return\s+null\s*;?\s*\/\/\s*TODO/gi, desc: 'Return null with TODO' },
    { pattern: /stub|mock.*response|hardcoded.*data/gi, desc: 'Stub/mock/hardcoded indicator' },
    { pattern: /console\.log\(['"]TODO/gi, desc: 'Console TODO' },
  ];

  for (const file of changedFiles || []) {
    const filePath = path.isAbsolute(file) ? file : path.join(baseCwd, file);
    if (!require('fs').existsSync(filePath)) continue;

    // Only check source files
    if (!/\.(js|jsx|ts|tsx|py|rb|go|rs|java|vue|svelte)$/.test(file)) continue;

    const content = require('fs').readFileSync(filePath, 'utf-8');
    for (const { pattern, desc } of mockupPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        symptoms.push(`${file}: ${desc}`);
      }
    }
  }

  return symptoms;
}

module.exports = {
  runVerifyCommand,
  runVerifySpec,
  runGoldTest,
  checkAntiMockup,
};
