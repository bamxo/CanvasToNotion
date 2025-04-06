import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/**/tests/',
        'src/**/__tests__/',
        '**/*.d.ts',
        '**/*.config.ts',
      ],
      include: ['src/**/*.{ts,tsx}'],
      all: true,
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
  },
}) 