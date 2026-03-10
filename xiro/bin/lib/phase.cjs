'use strict';

const fs = require('fs');
const path = require('path');
const { getXiroRoot } = require('./config.cjs');

function getPhasesDir(cwd) {
  return path.join(getXiroRoot(cwd), 'phases');
}

function getPhaseDir(phaseN, cwd) {
  const phasesDir = getPhasesDir(cwd);
  if (!fs.existsSync(phasesDir)) return null;
  const entries = fs.readdirSync(phasesDir);
  const match = entries.find(e => e.startsWith(`${phaseN}-`));
  if (match) return path.join(phasesDir, match);
  return path.join(phasesDir, `${phaseN}`);
}

function listPhases(cwd) {
  const phasesDir = getPhasesDir(cwd);
  if (!fs.existsSync(phasesDir)) return [];
  return fs.readdirSync(phasesDir)
    .filter(e => fs.statSync(path.join(phasesDir, e)).isDirectory())
    .sort((a, b) => {
      const na = parseInt(a.split('-')[0], 10);
      const nb = parseInt(b.split('-')[0], 10);
      return na - nb;
    })
    .map(name => {
      const num = parseInt(name.split('-')[0], 10);
      return { name, number: num, dir: path.join(phasesDir, name) };
    });
}

function getPhaseFiles(phaseN, cwd) {
  const dir = getPhaseDir(phaseN, cwd);
  if (!dir || !fs.existsSync(dir)) return null;
  return {
    requirements: path.join(dir, 'requirements.md'),
    design: path.join(dir, 'design.md'),
    tasks: path.join(dir, 'tasks.md'),
    goldTests: path.join(dir, 'gold-tests.md'),
  };
}

function readPhaseFile(phaseN, fileName, cwd) {
  const dir = getPhaseDir(phaseN, cwd);
  if (!dir) return null;
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function createPhaseDir(phaseN, phaseName, cwd) {
  const dirName = `${phaseN}-${phaseName}`;
  const dir = path.join(getPhasesDir(cwd), dirName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getActivePhase(cwd) {
  const phases = listPhases(cwd);
  if (phases.length === 0) return null;

  for (const phase of phases) {
    const tasksPath = path.join(phase.dir, 'tasks.md');
    if (!fs.existsSync(tasksPath)) continue;
    const content = fs.readFileSync(tasksPath, 'utf-8');
    // If any task is pending or in-progress, this is active
    if (/- \[[ \-]\]/.test(content)) {
      return phase;
    }
  }

  return null;
}

module.exports = {
  getPhasesDir,
  getPhaseDir,
  listPhases,
  getPhaseFiles,
  readPhaseFile,
  createPhaseDir,
  getActivePhase,
};
