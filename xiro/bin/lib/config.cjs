'use strict';

const fs = require('fs');
const path = require('path');

const XIRO_DIR = '.xiro';
const CONFIG_FILE = 'config.json';

const DEFAULT_CONFIG = {
  model_profile: 'balanced',
  commit_docs: true,
  branching_strategy: 'phase',
  parallelization: true,

  verification: {
    enabled: true,
    mode: 'auto',
    max_coder_attempts: 3,
    max_verifier_failures: 5,
    regression_on_change: true,
    anti_mockup: true,
    gold_tests: true,
    evidence_capture: true,
    external_verifier: 'required',
    external_verifier_command: 'codex exec',
    external_verifier_model: 'codex-mini-latest',
    criteria_lock_on_approval: true,
  },

  memory: {
    enabled: true,
    model: 'haiku',
    filter: 'adaptive',
  },
};

function getXiroRoot(cwd) {
  return path.join(cwd || process.cwd(), XIRO_DIR);
}

function getConfigPath(cwd) {
  return path.join(getXiroRoot(cwd), CONFIG_FILE);
}

function loadConfig(cwd) {
  const configPath = getConfigPath(cwd);
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return deepMerge(DEFAULT_CONFIG, parsed);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(config, cwd) {
  const xiroRoot = getXiroRoot(cwd);
  if (!fs.existsSync(xiroRoot)) {
    fs.mkdirSync(xiroRoot, { recursive: true });
  }
  fs.writeFileSync(getConfigPath(cwd), JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function deepMerge(defaults, overrides) {
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    if (
      overrides[key] &&
      typeof overrides[key] === 'object' &&
      !Array.isArray(overrides[key]) &&
      defaults[key] &&
      typeof defaults[key] === 'object'
    ) {
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}

module.exports = {
  XIRO_DIR,
  DEFAULT_CONFIG,
  getXiroRoot,
  getConfigPath,
  loadConfig,
  saveConfig,
  deepMerge,
};
