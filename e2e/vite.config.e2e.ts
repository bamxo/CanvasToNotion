/// <reference types="node" />
/// <reference types="vitest/config" />

import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Use node environment for e2e tests with Puppeteer
    testTimeout: 60000, // 60 second timeout for e2e tests
    hookTimeout: 30000, // 30 second timeout for setup/teardown
    include: ['**/*.e2e.test.{ts,tsx}'],
    exclude: [
      'node_modules/',
      'dist/',
      'screenshots/',
      'fixtures/'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'screenshots/',
        'fixtures/',
        'setup.ts'
      ],
    },
    setupFiles: [],
    // Run tests sequentially to avoid browser conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@popup': path.resolve(__dirname, '../src/popup'),
      '@background': path.resolve(__dirname, '../src/background'),
      '@content': path.resolve(__dirname, '../src/content'),
      '@services': path.resolve(__dirname, '../src/services'),
    },
  },
  define: {
    'import.meta.vitest': 'undefined'
  }
} as import("vite").UserConfig & { test: import("vitest").InlineConfig }) 