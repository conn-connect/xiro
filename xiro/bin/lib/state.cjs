'use strict';

const fs = require('fs');
const path = require('path');
const { getXiroRoot } = require('./config.cjs');

function getStatePath(cwd) {
  return path.join(getXiroRoot(cwd), 'STATE.md');
}

function getRunStatePath(cwd) {
  return path.join(getXiroRoot(cwd), 'state', 'run-state.json');
}

function getDependencyGraphPath(cwd) {
  return path.join(getXiroRoot(cwd), 'state', 'dependency-graph.json');
}

function getVerificationStatePath(cwd) {
  return path.join(getXiroRoot(cwd), 'verification-state.json');
}

function getCriteriaLockPath(cwd) {
  return path.join(getXiroRoot(cwd), 'criteria-lock.json');
}

function loadRunState(cwd) {
  const p = getRunStatePath(cwd);
  if (!fs.existsSync(p)) {
    return {
      active_feature: null,
      active_phase: null,
      status: 'idle',
      tasks: {},
      attempt_counts: {},
      consecutive_verifier_failures: 0,
    };
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveRunState(state, cwd) {
  const dir = path.dirname(getRunStatePath(cwd));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getRunStatePath(cwd), JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

function loadCriteriaLock(cwd) {
  const p = getCriteriaLockPath(cwd);
  if (!fs.existsSync(p)) {
    return { phases: {}, cannot_verify: [] };
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveCriteriaLock(lock, cwd) {
  fs.writeFileSync(getCriteriaLockPath(cwd), JSON.stringify(lock, null, 2) + '\n', 'utf-8');
}

function loadVerificationState(cwd) {
  const p = getVerificationStatePath(cwd);
  if (!fs.existsSync(p)) {
    return { tasks: {}, phases: {} };
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveVerificationState(vs, cwd) {
  fs.writeFileSync(getVerificationStatePath(cwd), JSON.stringify(vs, null, 2) + '\n', 'utf-8');
}

function initStateMd(featureName, cwd) {
  const content = `# xiro State

## Feature
${featureName}

## Status
initialized

## Active Phase
none

## Last Updated
${new Date().toISOString()}
`;
  fs.writeFileSync(getStatePath(cwd), content, 'utf-8');
}

function updateStateMd(updates, cwd) {
  const p = getStatePath(cwd);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf-8');
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`(## ${key}\\n)([^#]*)`, 'i');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${value}\n\n`);
    }
  }
  content = content.replace(
    /(## Last Updated\n)([^#]*)/i,
    `$1${new Date().toISOString()}\n\n`,
  );
  fs.writeFileSync(p, content, 'utf-8');
}

module.exports = {
  getStatePath,
  getRunStatePath,
  getDependencyGraphPath,
  getVerificationStatePath,
  getCriteriaLockPath,
  loadRunState,
  saveRunState,
  loadCriteriaLock,
  saveCriteriaLock,
  loadVerificationState,
  saveVerificationState,
  initStateMd,
  updateStateMd,
};
