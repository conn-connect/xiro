#!/usr/bin/env node
'use strict';

/**
 * xiro test runner
 *
 * Runs all test files in tests/ directory.
 * No external dependencies — pure Node.js.
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
let errors = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write('  ✓ ' + message + '\n');
  } else {
    failed++;
    errors.push(message);
    process.stdout.write('  ✗ ' + message + '\n');
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

function assertDeepEqual(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
}

// Make assert functions available globally
global.assert = assert;
global.assertEqual = assertEqual;
global.assertDeepEqual = assertDeepEqual;

// Find and run test files
const testsDir = __dirname;
const testFiles = fs.readdirSync(testsDir)
  .filter(f => f.startsWith('test-') && f.endsWith('.cjs'))
  .sort();

console.log(`\nxiro test suite — ${testFiles.length} test file(s)\n`);

for (const file of testFiles) {
  console.log(`\n${file}:`);
  try {
    require(path.join(testsDir, file));
  } catch (err) {
    failed++;
    errors.push(`${file}: ${err.message}`);
    console.error(`  ERROR: ${err.message}`);
    console.error(err.stack);
  }
}

// Summary
console.log('\n' + '━'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

if (errors.length > 0) {
  console.log('\nFailed tests:');
  for (const err of errors) {
    console.log(`  ✗ ${err}`);
  }
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
