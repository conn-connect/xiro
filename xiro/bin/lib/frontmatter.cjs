'use strict';

/**
 * frontmatter.cjs — Parse VERIFY/CODEX_VERIFY/CANNOT_VERIFY syntax from tasks.md
 *
 * Extracts structured verification data from markdown task files.
 */

function parseTasksMd(content) {
  const lines = content.split('\n');
  const tasks = [];
  let currentTask = null;
  let currentSubtask = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Checkpoint: - [ ] **checkpoint**: description
    const checkpointMatch = line.match(/^- \[([x \-])\]\s+\*\*checkpoint\*\*:\s*(.*)/i);
    if (checkpointMatch) {
      currentTask = {
        id: `checkpoint-${tasks.length + 1}`,
        title: checkpointMatch[2].trim(),
        status: parseStatus(checkpointMatch[1]),
        subtasks: [],
        dependencies: [],
        isCheckpoint: true,
        isSimplify: false,
        verifyAll: [],
        runGoldTests: false,
      };
      currentSubtask = null;
      tasks.push(currentTask);
      continue;
    }

    // Simplify: - [ ] **simplify**: description
    const simplifyMatch = line.match(/^- \[([x \-])\]\s+\*\*simplify\*\*:\s*(.*)/i);
    if (simplifyMatch) {
      currentTask = {
        id: `simplify-${tasks.length + 1}`,
        title: simplifyMatch[2].trim(),
        status: parseStatus(simplifyMatch[1]),
        subtasks: [],
        dependencies: [],
        isCheckpoint: false,
        isSimplify: true,
      };
      currentSubtask = null;
      tasks.push(currentTask);
      continue;
    }

    // Top-level task: - [ ] N. Title or - [x] N. Title
    const taskMatch = line.match(/^- \[([x \-])\]\s+(\d+)\.\s+(.*)/);
    if (taskMatch) {
      currentTask = {
        id: taskMatch[2],
        title: taskMatch[3].trim(),
        status: parseStatus(taskMatch[1]),
        subtasks: [],
        dependencies: [],
        isCheckpoint: false,
        isSimplify: false,
      };
      currentSubtask = null;
      tasks.push(currentTask);
      continue;
    }

    // Subtask: - [ ] N.M description
    const subtaskMatch = line.match(/^\s+- \[([x \-])\]\s+(\d+\.\d+)\s+(.*)/);
    if (subtaskMatch && currentTask) {
      currentSubtask = {
        id: subtaskMatch[2],
        title: subtaskMatch[3].trim(),
        status: parseStatus(subtaskMatch[1]),
        verify: [],
        codexVerify: [],
        cannotVerify: [],
        requirements: [],
      };
      currentTask.subtasks.push(currentSubtask);
      continue;
    }

    // Test subtask: - [ ] N.T description
    const testSubtaskMatch = line.match(/^\s+- \[([x \-])\]\s+(\d+\.T)\s+(.*)/i);
    if (testSubtaskMatch && currentTask) {
      currentSubtask = {
        id: testSubtaskMatch[2],
        title: testSubtaskMatch[3].trim(),
        status: parseStatus(testSubtaskMatch[1]),
        verify: [],
        codexVerify: [],
        cannotVerify: [],
        requirements: [],
        isTest: true,
      };
      currentTask.subtasks.push(currentSubtask);
      continue;
    }

    if (!currentTask) continue;

    // VERIFY command
    const verifyMatch = line.match(/\*\*VERIFY\*\*:\s*(.+)/);
    if (verifyMatch) {
      const target = currentSubtask || currentTask;
      target.verify = target.verify || [];
      target.verify.push(parseVerifyCommand(verifyMatch[1].trim()));
      continue;
    }

    // VERIFY_ALL (checkpoint)
    const verifyAllMatch = line.match(/\*\*VERIFY_ALL\*\*:/);
    if (verifyAllMatch && currentTask.isCheckpoint) {
      currentTask.verifyAll = [];
      // Read subsequent indented lines
      for (let j = i + 1; j < lines.length; j++) {
        const vLine = lines[j];
        const vCmd = vLine.match(/^\s+-\s+`([^`]+)`\s*(.*)/);
        if (vCmd) {
          currentTask.verifyAll.push(parseVerifyCommand(`\`${vCmd[1]}\` ${vCmd[2]}`.trim()));
        } else if (vLine.trim() === '' || /^\s*-\s+\*\*/.test(vLine) || /^- /.test(vLine)) {
          break;
        }
      }
      continue;
    }

    // CODEX_VERIFY
    const codexMatch = line.match(/\*\*CODEX_VERIFY\*\*:\s*(.+)/);
    if (codexMatch) {
      const target = currentSubtask || currentTask;
      target.codexVerify = target.codexVerify || [];
      target.codexVerify.push(codexMatch[1].trim());
      continue;
    }

    // CANNOT_VERIFY
    const cannotMatch = line.match(/\*\*CANNOT_VERIFY\*\*:\s*(.+)/);
    if (cannotMatch) {
      const target = currentSubtask || currentTask;
      target.cannotVerify = target.cannotVerify || [];
      const cv = { what: cannotMatch[1].trim() };
      // Look for REASON and REQUIRES on following lines
      for (let j = i + 1; j < lines.length; j++) {
        const nLine = lines[j];
        const reasonMatch = nLine.match(/REASON:\s*(.+)/);
        if (reasonMatch) { cv.reason = reasonMatch[1].trim(); continue; }
        const reqMatch = nLine.match(/REQUIRES:\s*(.+)/);
        if (reqMatch) { cv.requires = reqMatch[1].trim(); continue; }
        const workMatch = nLine.match(/WORKAROUND:\s*(.+)/);
        if (workMatch) { cv.workaround = workMatch[1].trim(); continue; }
        break;
      }
      target.cannotVerify.push(cv);
      continue;
    }

    // Dependencies
    const depMatch = line.match(/_depends:\s*([\d,\s]+)_/);
    if (depMatch && currentTask) {
      currentTask.dependencies = depMatch[1].split(',').map(s => s.trim());
      continue;
    }

    // Requirements reference
    const reqMatch = line.match(/_Requirements?:\s*([\d.,\s]+)_/);
    if (reqMatch && currentSubtask) {
      currentSubtask.requirements = reqMatch[1].split(',').map(s => s.trim());
      continue;
    }

    // GOLD_TEST
    if (/\*\*GOLD_TEST\*\*/.test(line) && currentTask.isCheckpoint) {
      currentTask.runGoldTests = true;
      continue;
    }
  }

  return tasks;
}

function parseVerifyCommand(raw) {
  const result = { raw, commands: [], expectedExitCode: 0 };

  // Handle compound: cmd1 AND cmd2
  if (raw.includes(' AND ')) {
    const parts = raw.split(/\s+AND\s+/);
    result.commands = parts.map(p => parseSingleVerify(p));
    result.isCompound = true;
    return result;
  }

  const single = parseSingleVerify(raw);
  result.commands = [single];
  return result;
}

function parseSingleVerify(raw) {
  const result = { raw };

  // Extract command from backticks
  const cmdMatch = raw.match(/`([^`]+)`/);
  if (cmdMatch) {
    result.command = cmdMatch[1];
  }

  // Exit code
  const exitMatch = raw.match(/exits?\s+(\d+)/);
  if (exitMatch) {
    result.expectedExitCode = parseInt(exitMatch[1], 10);
  } else {
    result.expectedExitCode = 0;
  }

  // Test count
  const testMatch = raw.match(/(\d+)\s+tests?\s+PASS/i);
  if (testMatch) {
    result.expectedTestCount = parseInt(testMatch[1], 10);
  }

  // Contains check
  const containsMatch = raw.match(/contains?\s+"([^"]+)"/);
  if (containsMatch) {
    result.contains = containsMatch[1];
  }

  // Matches check
  const matchesMatch = raw.match(/matches?\s+`([^`]+)`/);
  if (matchesMatch) {
    result.matches = matchesMatch[1];
  }

  return result;
}

function parseStatus(marker) {
  switch (marker) {
    case 'x': return 'completed';
    case '-': return 'in_progress';
    case ' ': return 'pending';
    default: return 'pending';
  }
}

function parseGoldTestsMd(content) {
  const tests = [];
  const sections = content.split(/^## GT-/m);
  for (let i = 1; i < sections.length; i++) {
    const section = 'GT-' + sections[i];
    const headerMatch = section.match(/^GT-(\d+):\s*(.+)/);
    if (!headerMatch) continue;
    const gt = {
      id: `GT-${headerMatch[1]}`,
      name: headerMatch[2].trim(),
    };
    const verifyMatch = section.match(/\*\*VERIFY\*\*:\s*`([^`]+)`\s*(.*)/);
    if (verifyMatch) {
      gt.command = verifyMatch[1];
      gt.criteria = verifyMatch[2].trim();
    }
    const addedMatch = section.match(/\*\*Added\*\*:\s*Phase\s*(\d+)/);
    if (addedMatch) {
      gt.addedPhase = parseInt(addedMatch[1], 10);
    }
    tests.push(gt);
  }
  return tests;
}

module.exports = {
  parseTasksMd,
  parseVerifyCommand,
  parseSingleVerify,
  parseStatus,
  parseGoldTestsMd,
};
