'use strict';

/**
 * external-verifier.cjs — Codex CLI / OpenAI API as External Process
 *
 * Verification must cross a tooling boundary (child_process).
 * MC cannot call Codex directly — only the engine can.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { writeCodexEvidence } = require('./evidence.cjs');
const { loadConfig } = require('./config.cjs');

/**
 * Run Codex review on changed files for a task.
 *
 * @param {Object} opts
 * @param {string[]} opts.changedFiles - List of changed file paths
 * @param {string} opts.taskSpec - The task specification text
 * @param {number} opts.phaseN - Phase number
 * @param {number} opts.taskN - Task number
 * @param {string} [opts.cwd] - Working directory
 * @returns {Object} { pass, verdict, findings, evidencePath }
 */
function codexReview(opts) {
  const { changedFiles, taskSpec, phaseN, taskN, cwd } = opts;
  const config = loadConfig(cwd);
  const workDir = cwd || process.cwd();

  // Build review prompt
  const prompt = buildReviewPrompt(changedFiles, taskSpec, workDir);

  let result;
  try {
    // Try Codex CLI first
    result = runCodexCli(prompt, config, workDir);
  } catch {
    // Fall back to OpenAI API
    if (process.env.OPENAI_API_KEY) {
      result = runOpenAIApi(prompt, config);
    } else {
      return {
        pass: false,
        verdict: 'VERIFIER_UNAVAILABLE',
        findings: ['Codex CLI not available and OPENAI_API_KEY not set'],
        evidencePath: null,
      };
    }
  }

  // Parse the result
  const parsed = parseCodexOutput(result);

  // Write evidence
  const evidencePath = writeCodexEvidence(phaseN, taskN, {
    taskId: `${phaseN}.${taskN}`,
    verdict: parsed.verdict,
    findings: parsed.findings,
    model: config.verification.external_verifier_model,
    rawOutput: result,
    timestamp: new Date().toISOString(),
  }, cwd);

  return {
    pass: parsed.verdict === 'PASS',
    verdict: parsed.verdict,
    findings: parsed.findings,
    evidencePath,
  };
}

/**
 * Run Codex spec review (for /spec command).
 */
function codexSpecReview(specContent, opts) {
  const config = loadConfig(opts?.cwd);

  const prompt = `Review this specification for completeness and testability.

Check for:
1. Every requirement has a VERIFY_BY declaration
2. No vague acceptance criteria
3. All UI interactions have interaction-level (not render-level) criteria
4. CANNOT_VERIFY items have REASON and REQUIRES
5. Test subtasks (N.T) exist for every task
6. No placeholder or stub expectations

Return your assessment as:
VERDICT: PASS | FAIL | INSUFFICIENT_EVIDENCE
FINDINGS:
- finding 1
- finding 2

SPECIFICATION:
${specContent}`;

  let result;
  try {
    result = runCodexCli(prompt, config, opts?.cwd || process.cwd());
  } catch {
    if (process.env.OPENAI_API_KEY) {
      result = runOpenAIApi(prompt, config);
    } else {
      return { pass: false, verdict: 'VERIFIER_UNAVAILABLE', findings: ['Codex not available'] };
    }
  }

  return parseCodexOutput(result);
}

function buildReviewPrompt(changedFiles, taskSpec, workDir) {
  const diffs = [];
  for (const file of changedFiles) {
    const filePath = path.isAbsolute(file) ? file : path.join(workDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      diffs.push(`--- ${file} ---\n${content.slice(0, 5000)}\n`);
    }
  }

  return `Review this code implementation against its task specification.

TASK SPECIFICATION:
${taskSpec}

CHANGED FILES:
${diffs.join('\n')}

Check for:
1. Does the implementation match the specification?
2. Are there placeholder implementations (empty handlers, TODO comments, stub responses)?
3. Are there buttons/controls that render but don't function?
4. Are there forms without wired submit effects?
5. Are there fake success responses without real persistence?
6. Does the code have obvious bugs or security issues?

Return your assessment in this exact format:
VERDICT: PASS | FAIL | INSUFFICIENT_EVIDENCE | HITL_REQUIRED
FINDINGS:
- finding 1
- finding 2
(list each finding on a separate line starting with "- ")`;
}

function runCodexCli(prompt, config, workDir) {
  const cmd = config.verification.external_verifier_command || 'codex exec';
  const model = config.verification.external_verifier_model || 'codex-mini-latest';

  // Escape prompt for shell
  const escapedPrompt = prompt.replace(/'/g, "'\\''");

  const result = execSync(
    `${cmd} '${escapedPrompt}' --model ${model}`,
    {
      timeout: 120000,
      encoding: 'utf-8',
      cwd: workDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );

  return result;
}

function runOpenAIApi(prompt, config) {
  const model = config.verification.external_verifier_model || 'codex-mini-latest';

  // Synchronous HTTP request using child_process
  const script = `
const https = require('https');
const data = JSON.stringify({
  model: '${model}',
  messages: [{ role: 'user', content: ${JSON.stringify(prompt)} }],
  max_tokens: 2000,
});
const options = {
  hostname: 'api.openai.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
    'Content-Length': Buffer.byteLength(data),
  },
};
const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      process.stdout.write(json.choices[0].message.content);
    } catch(e) {
      process.stdout.write('VERDICT: FAIL\\nFINDINGS:\\n- API response parse error: ' + e.message);
    }
  });
});
req.on('error', (e) => {
  process.stdout.write('VERDICT: FAIL\\nFINDINGS:\\n- API request error: ' + e.message);
});
req.write(data);
req.end();
`;

  return execSync(`node -e ${JSON.stringify(script)}`, {
    timeout: 120000,
    encoding: 'utf-8',
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function parseCodexOutput(output) {
  if (!output || typeof output !== 'string') {
    return {
      verdict: 'INSUFFICIENT_EVIDENCE',
      findings: ['No output from external verifier'],
    };
  }

  // Extract verdict
  const verdictMatch = output.match(/VERDICT:\s*(PASS|FAIL|INSUFFICIENT_EVIDENCE|HITL_REQUIRED)/i);
  const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : 'INSUFFICIENT_EVIDENCE';

  // Extract findings
  const findings = [];
  const findingsSection = output.match(/FINDINGS:\s*\n([\s\S]*?)(?:\n\n|$)/i);
  if (findingsSection) {
    const lines = findingsSection[1].split('\n');
    for (const line of lines) {
      const finding = line.replace(/^\s*-\s*/, '').trim();
      if (finding) findings.push(finding);
    }
  }

  // Default bias: ambiguous → INSUFFICIENT_EVIDENCE (P6, Section 7/8.4)
  if (verdict === 'PASS' && findings.length > 0) {
    const hasConcerns = findings.some(f =>
      /placeholder|stub|empty|mock|todo|not.*implement/i.test(f)
    );
    if (hasConcerns) {
      return { verdict: 'FAIL', findings };
    }
  }

  return { verdict, findings };
}

module.exports = {
  codexReview,
  codexSpecReview,
  buildReviewPrompt,
  parseCodexOutput,
};
