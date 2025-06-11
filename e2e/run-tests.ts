#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TestSuite {
  name: string;
  description: string;
  testFile: string;
  expectedToFail?: boolean;
}

interface TestResult {
  suite: TestSuite;
  success: boolean;
  output: string;
}

const testSuites: TestSuite[] = [
  {
    name: 'Signup',
    description: 'User registration and database saving',
    testFile: 'signup.e2e.test.ts'
  },
  {
    name: 'Login',
    description: 'Extension login from webapp',
    testFile: 'login.e2e.test.ts'
  },
  {
    name: 'Notion Connection',
    description: 'Connecting Notion account',
    testFile: 'notion-connection.e2e.test.ts'
  },
  {
    name: 'Page Selection',
    description: 'Selecting Notion page in extension',
    testFile: 'notion-page-selection.e2e.test.ts'
  },
  {
    name: 'Unsynced Assignments',
    description: 'Checking unsynced assignments (expected to fail without Canvas account)',
    testFile: 'unsynced-assignments.e2e.test.ts',
    expectedToFail: true
  },
  {
    name: 'Syncing',
    description: 'Assignment syncing functionality (expected to fail without Canvas account)',
    testFile: 'syncing.e2e.test.ts',
    expectedToFail: true
  }
];

function checkTestFiles(): boolean {
  const testsDir = path.join(__dirname, 'tests');
  
  for (const suite of testSuites) {
    const testPath = path.join(testsDir, suite.testFile);
    if (!fs.existsSync(testPath)) {
      return false;
    }
  }
  
  return true;
}

function runTest(testFile: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const vitestProcess = spawn('npx', ['vitest', 'run', `e2e/tests/${testFile}`, '--config', 'e2e/vite.config.e2e.ts'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' } // Force colors in output
    });

    let output = '';
    let errorOutput = '';

    vitestProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    vitestProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    vitestProcess.on('close', (code) => {
      const fullOutput = output + errorOutput;
      resolve({
        success: code === 0,
        output: fullOutput
      });
    });
  });
}

function extractTestSummary(output: string): string {
  // Extract the summary line that shows test results
  const lines = output.split('\n');
  for (const line of lines) {
    // Look for lines like "❯ e2e/tests/6-syncing.e2e.test.ts (6 tests | 5 failed) 27121ms"
    // or "✓ e2e/tests/1-signup.e2e.test.ts (1 test) 10249ms"
    if (line.includes('.e2e.test.ts') && line.includes('test') && 
        (line.includes('❯') || line.includes('✓'))) {
      return line.trim();
    }
  }
  return '';
}

async function runAllTests() {
  if (!checkTestFiles()) {
    process.exit(1);
  }

  const results: TestResult[] = [];
  const summaries: string[] = [];

  for (const suite of testSuites) {
    const result = await runTest(suite.testFile);
    results.push({ suite, success: result.success, output: result.output });
    
    // Output the raw Vitest result with colors
    console.log(result.output);
    
    // Extract and store the summary line
    const summary = extractTestSummary(result.output);
    if (summary) {
      summaries.push(summary);
    }
  }

  // Print consolidated summary at the end
  summaries.forEach(summary => {
    console.log(summary);
  });
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const suiteArg = args[0];
  const suite = testSuites.find(s => s.name.toLowerCase().includes(suiteArg.toLowerCase()));
  
  if (suite) {
    runTest(suite.testFile).then(result => {
      console.log(result.output);
      process.exit(result.success ? 0 : 1);
    });
  } else {
    process.exit(1);
  }
} else {
  runAllTests().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

export { runAllTests as runE2ETests }; 