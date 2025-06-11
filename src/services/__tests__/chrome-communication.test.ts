import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendMessage, canvasDataApi } from '../chrome-communication'

// Mock chrome API
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    lastError: null as any
  }
}

// Set up global chrome mock
Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true
})

describe('Chrome Communication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset chrome.runtime.lastError
    mockChrome.runtime.lastError = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Environment Setup', () => {
    it('should have chrome API available and functions exported', () => {
      expect(global.chrome).toBeDefined()
      expect(global.chrome.runtime).toBeDefined()
      expect(global.chrome.runtime.sendMessage).toBeDefined()
      expect(sendMessage).toBeDefined()
      expect(canvasDataApi).toBeDefined()
      expect(canvasDataApi.fetchAll).toBeDefined()
    })
  })

  describe('sendMessage', () => {
    it('should resolve with response data when message is successful', async () => {
      const mockMessage = { action: 'test', data: 'test-data' }
      const mockResponseData = { userId: 123, name: 'Test User' }
      const mockResponse = { success: true, data: mockResponseData }

      // Mock chrome.runtime.sendMessage to call callback with successful response
      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse)
      })

      const result = await sendMessage(mockMessage)

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(mockMessage, expect.any(Function))
      expect(result).toEqual(mockResponseData)
    })

    it('should reject with chrome runtime error when lastError is present', async () => {
      const mockMessage = { action: 'test' }
      const mockError = { message: 'Extension context invalidated.' }

      // Set up chrome.runtime.lastError
      mockChrome.runtime.lastError = mockError

      // Mock chrome.runtime.sendMessage to call callback
      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({})
      })

      await expect(sendMessage(mockMessage)).rejects.toEqual(mockError)
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(mockMessage, expect.any(Function))
    })

    it('should reject with response error when response has error property', async () => {
      const mockMessage = { action: 'test' }
      const mockResponse = { success: false, error: 'Custom error message' }

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse)
      })

      await expect(sendMessage(mockMessage)).rejects.toThrow('Custom error message')
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(mockMessage, expect.any(Function))
    })

    it('should reject with "Unknown error" when response is unsuccessful without error message', async () => {
      const mockMessage = { action: 'test' }
      const mockResponse = { success: false }

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse)
      })

      await expect(sendMessage(mockMessage)).rejects.toThrow('Unknown error')
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(mockMessage, expect.any(Function))
    })

    it('should reject with "Unknown error" when response is null', async () => {
      const mockMessage = { action: 'test' }

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(null)
      })

      await expect(sendMessage(mockMessage)).rejects.toThrow('Unknown error')
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(mockMessage, expect.any(Function))
    })

    it('should reject with "Unknown error" when response is undefined', async () => {
      const mockMessage = { action: 'test' }

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(undefined)
      })

      await expect(sendMessage(mockMessage)).rejects.toThrow('Unknown error')
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(mockMessage, expect.any(Function))
    })

    it('should handle response without success property as unsuccessful', async () => {
      const mockMessage = { action: 'test' }
      const mockResponse = { data: 'some data' } // No success property

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse)
      })

      await expect(sendMessage(mockMessage)).rejects.toThrow('Unknown error')
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(mockMessage, expect.any(Function))
    })
  })

  describe('canvasDataApi', () => {
    it('should call sendMessage with fetchAll action', async () => {
      const mockResponseData = { courses: [], assignments: [] }
      const mockResponse = { success: true, data: mockResponseData }

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse)
      })

      const result = await canvasDataApi.fetchAll()

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        { action: 'fetchAll' },
        expect.any(Function)
      )
      expect(result).toEqual(mockResponseData)
    })

    it('should propagate errors from sendMessage', async () => {
      const mockError = { message: 'Network error' }
      mockChrome.runtime.lastError = mockError

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({})
      })

      await expect(canvasDataApi.fetchAll()).rejects.toEqual(mockError)
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
        { action: 'fetchAll' },
        expect.any(Function)
      )
    })
  })
}) 