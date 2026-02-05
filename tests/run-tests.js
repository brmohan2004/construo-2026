#!/usr/bin/env node
/**
 * Sequential Test Runner for CONSTRUO 2026
 * 
 * This script runs all E2E tests in sequence to ensure proper state management
 * between test steps and avoid conflicts from parallel execution.
 */

const { execSync } = require('child_process');
const path = require('path');

const testFiles = [
  'e2e/all-steps.spec.js',
  'e2e/step11-footer.spec.js',
  'e2e/step12-registrations.spec.js',
  'security/security.spec.js'
];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTestFile(testFile) {
  const testPath = path.join(__dirname, testFile);
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`Running: ${testFile}`, 'bright');
  log('='.repeat(60), 'blue');
  
  try {
    execSync(`npx playwright test "${testPath}" --reporter=list`, {
      stdio: 'inherit',
      cwd: __dirname
    });
    log(`✅ PASSED: ${testFile}`, 'green');
    return true;
  } catch (error) {
    log(`❌ FAILED: ${testFile}`, 'red');
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('  CONSTRUO 2026 - Sequential Test Runner', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  for (const testFile of testFiles) {
    if (runTestFile(testFile)) {
      passed++;
    } else {
      failed++;
      // Continue running remaining tests even if one fails
      log('\n⚠️  Continuing with remaining tests...\n', 'yellow');
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  log('\n' + '='.repeat(60), 'bright');
  log('  TEST SUMMARY', 'bright');
  log('='.repeat(60), 'bright');
  log(`Total Tests: ${testFiles.length}`, 'bright');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Duration: ${duration}s`, 'blue');
  log('='.repeat(60) + '\n', 'bright');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n💥 Fatal Error: ${error.message}`, 'red');
  process.exit(1);
});
