/**
 * xiro-context-monitor.js — Claude Code Hook
 *
 * Monitors context for drift from spec-anchor.
 * Runs as a PreToolUse hook to inject reminders.
 *
 * Hook config (in .claude/settings.json):
 * {
 *   "hooks": {
 *     "PreToolUse": [{
 *       "matcher": "Agent",
 *       "command": "node xiro/hooks/xiro-context-monitor.js"
 *     }]
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

function main() {
  const xiroRoot = path.join(process.cwd(), '.xiro');

  // Only run if xiro project exists
  if (!fs.existsSync(xiroRoot)) {
    process.exit(0);
  }

  // Read spec anchor for context injection
  const anchorPath = path.join(xiroRoot, 'spec-anchor.md');
  if (fs.existsSync(anchorPath)) {
    const anchor = fs.readFileSync(anchorPath, 'utf-8').trim();
    // Output as CLAUDE_CONTEXT for hook injection
    process.stderr.write(`[xiro] Spec Anchor: ${anchor.split('\n').slice(1).join(' | ')}\n`);
  }

  // Check for pending HITL decisions
  const runStatePath = path.join(xiroRoot, 'state', 'run-state.json');
  if (fs.existsSync(runStatePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(runStatePath, 'utf-8'));
      if (state.status === 'halted') {
        process.stderr.write(`[xiro] WARNING: Run is HALTED. Use /xiro resume to continue.\n`);
      }
    } catch {
      // Ignore parse errors
    }
  }
}

main();
