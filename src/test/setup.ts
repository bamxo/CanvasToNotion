import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Chrome APIs for extension testing
global.chrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: vi.fn(),
    id: 'test-extension-id',
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
} as any

// Mock window.location for content script tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
})

// Mock fetch for API tests
global.fetch = vi.fn()

// Setup console mocks to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} 