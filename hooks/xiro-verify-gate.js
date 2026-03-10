/**
 * xiro-verify-gate.js — Claude Code PostToolUse Hook
 *
 * Monitors for unauthorized state changes.
 * Blocks task completion that bypasses the gate.
 *
 * Hook config (in .claude/settings.json):
 * {
 *   "hooks": {
 *     "PostToolUse": [{
 *       "matcher": "Edit|Write",
 *       "command": "node xiro/hooks/xiro-verify-gate.js"
 *     }]
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

function main() {
  // Read hook input from stdin
  let input = '';
  try {
    input = fs.readFileSync('/dev/stdin', 'utf-8');
  } catch {
    process.exit(0);
  }

  let hookData;
  try {
    hookData = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const xiroRoot = path.join(process.cwd(), '.xiro');
  if (!fs.existsSync(xiroRoot)) {
    process.exit(0);
  }

  const filePath = hookData?.tool_input?.file_path || hookData?.tool_input?.path || '';

  // Guard: MC trying to edit tasks.md checkboxes directly
  if (filePath.includes('tasks.md') && filePath.includes('.xiro/')) {
    const content = hookData?.tool_input?.new_string || hookData?.tool_input?.content || '';
    // Check for status marker changes
    if (/\[x\]/.test(content) || /\[FAILED\]/.test(content)) {
      // Only Clerk agent should do this — check if we're in a clerk context
      const isClerk = process.env.XIRO_AGENT === 'clerk';
      if (!isClerk) {
        process.stderr.write(
          '[xiro-gate] BLOCKED: Direct task status modification detected. ' +
          'Task status can only be updated by the Clerk agent after gate check passes. ' +
          'Use /xiro run to execute tasks through the proper pipeline.\n'
        );
        // Output JSON to block the action
        const result = {
          decision: 'block',
          reason: 'Task status can only be modified by the Clerk agent after verification gate passes.',
        };
        process.stdout.write(JSON.stringify(result));
        process.exit(0);
      }
    }
  }

  // Guard: MC trying to write evidence files directly
  if (filePath.includes('.xiro/evidence/') && !filePath.includes('decisions.log')) {
    const isEngine = process.env.XIRO_AGENT === 'engine' || process.env.XIRO_AGENT === 'clerk';
    if (!isEngine) {
      process.stderr.write(
        '[xiro-gate] BLOCKED: Direct evidence file modification detected. ' +
        'Evidence is written by the engine (verifier.cjs), not by the MC.\n'
      );
      const result = {
        decision: 'block',
        reason: 'Evidence files are written by the engine, not by the MC or agents.',
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
  }

  // Guard: MC trying to modify criteria-lock.json
  if (filePath.includes('criteria-lock.json')) {
    process.stderr.write(
      '[xiro-gate] WARNING: criteria-lock.json modification detected. ' +
      'Criteria can only be locked during /xiro plan-phase with HITL approval.\n'
    );
  }
}

main();
