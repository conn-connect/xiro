'use strict';

/**
 * Tests for core.cjs — Project initialization and health check
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { initProject, projectExists, getProjectInfo, healthCheck } = require('../xiro/bin/lib/core.cjs');

// Create a temp directory for each test
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'xiro-test-core-'));
}

// Test: initProject creates .xiro/ with all required files
{
  const tmpDir = makeTempDir();
  const result = initProject('test-feature', { cwd: tmpDir });
  assert(result.success === true, 'initProject: succeeds');
  assert(fs.existsSync(path.join(tmpDir, '.xiro')), 'initProject: creates .xiro/');
  assert(fs.existsSync(path.join(tmpDir, '.xiro', 'config.json')), 'initProject: creates config.json');
  assert(fs.existsSync(path.join(tmpDir, '.xiro', 'STATE.md')), 'initProject: creates STATE.md');
  assert(fs.existsSync(path.join(tmpDir, '.xiro', 'gold-tests.md')), 'initProject: creates gold-tests.md');
  assert(fs.existsSync(path.join(tmpDir, '.xiro', 'shared.md')), 'initProject: creates shared.md');
  assert(fs.existsSync(path.join(tmpDir, '.xiro', 'ledger')), 'initProject: creates ledger/');
  assert(fs.existsSync(path.join(tmpDir, '.xiro', 'memory')), 'initProject: creates memory/');
  assert(fs.existsSync(path.join(tmpDir, '.xiro', 'memory', 'inbox')), 'initProject: creates memory/inbox/');
  fs.rmSync(tmpDir, { recursive: true });
}

// Test: initProject fails if .xiro/ already exists
{
  const tmpDir = makeTempDir();
  initProject('test-feature', { cwd: tmpDir });
  const result = initProject('test-feature', { cwd: tmpDir });
  assert(result.success === false, 'initProject: fails on duplicate');
  fs.rmSync(tmpDir, { recursive: true });
}

// Test: projectExists
{
  const tmpDir = makeTempDir();
  assert(projectExists(tmpDir) === false, 'projectExists: false before init');
  initProject('test-feature', { cwd: tmpDir });
  assert(projectExists(tmpDir) === true, 'projectExists: true after init');
  fs.rmSync(tmpDir, { recursive: true });
}

// Test: healthCheck on valid project
{
  const tmpDir = makeTempDir();
  initProject('test-feature', { cwd: tmpDir });
  const health = healthCheck(tmpDir);
  assert(health.healthy === true, 'healthCheck: healthy project');
  assertEqual(health.issues.length, 0, 'healthCheck: no issues');
  fs.rmSync(tmpDir, { recursive: true });
}

// Test: healthCheck on missing project
{
  const tmpDir = makeTempDir();
  const health = healthCheck(tmpDir);
  assert(health.healthy === false, 'healthCheck: unhealthy without .xiro/');
  fs.rmSync(tmpDir, { recursive: true });
}

// Test: ledger is initialized with FEATURE_CREATED event
{
  const tmpDir = makeTempDir();
  initProject('test-feature', { cwd: tmpDir });
  const ledgerPath = path.join(tmpDir, '.xiro', 'ledger', 'events.ndjson');
  assert(fs.existsSync(ledgerPath), 'initProject: creates ledger');
  const content = fs.readFileSync(ledgerPath, 'utf-8');
  assert(content.includes('FEATURE_CREATED'), 'initProject: ledger has FEATURE_CREATED event');
  fs.rmSync(tmpDir, { recursive: true });
}

// Test: config.json has default values
{
  const tmpDir = makeTempDir();
  initProject('test-feature', { cwd: tmpDir });
  const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.xiro', 'config.json'), 'utf-8'));
  assertEqual(config.verification.external_verifier, 'required', 'initProject: default external_verifier is required');
  assertEqual(config.verification.max_coder_attempts, 3, 'initProject: default max_coder_attempts is 3');
  assertEqual(config.memory.enabled, true, 'initProject: default memory enabled');
  fs.rmSync(tmpDir, { recursive: true });
}
