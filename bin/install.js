#!/usr/bin/env node

/**
 * xiro installer
 *
 * Installs xiro as a Claude Code skill by copying files to the
 * Claude Code skills directory.
 *
 * Usage: npx xiro@latest
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_DIR_CANDIDATES = [
  path.join(process.env.HOME || '', '.claude', 'skills', 'xiro'),
  path.join(process.env.APPDATA || '', 'claude', 'skills', 'xiro'),
];

function main() {
  console.log('xiro — Verification-enforced spec-driven development for Claude Code');
  console.log('');

  const packageRoot = path.resolve(__dirname, '..');
  const skillDir = findOrCreateSkillDir();

  if (!skillDir) {
    console.error('Could not find Claude Code skills directory.');
    console.error('Please create ~/.claude/skills/ and try again.');
    process.exit(1);
  }

  console.log(`Installing to: ${skillDir}`);

  // Copy skill files
  const filesToCopy = [
    'SKILL.md',
    'commands',
    'agents',
    'xiro',
    'hooks',
    'references',
  ];

  for (const item of filesToCopy) {
    const src = path.join(packageRoot, item);
    const dst = path.join(skillDir, item);

    if (!fs.existsSync(src)) {
      console.log(`  Skipping ${item} (not found)`);
      continue;
    }

    copyRecursive(src, dst);
    console.log(`  Copied ${item}`);
  }

  console.log('');
  console.log('Installation complete!');
  console.log('');
  console.log('Restart Claude Code, then use:');
  console.log('  /xiro new-project    — Start a new project');
  console.log('  /xiro help           — See all commands');
}

function findOrCreateSkillDir() {
  for (const candidate of SKILL_DIR_CANDIDATES) {
    const parent = path.dirname(candidate);
    if (fs.existsSync(parent)) {
      if (!fs.existsSync(candidate)) {
        fs.mkdirSync(candidate, { recursive: true });
      }
      return candidate;
    }
  }
  // Try creating the default
  const defaultDir = SKILL_DIR_CANDIDATES[0];
  try {
    fs.mkdirSync(defaultDir, { recursive: true });
    return defaultDir;
  } catch {
    return null;
  }
}

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dst, child));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

main();
