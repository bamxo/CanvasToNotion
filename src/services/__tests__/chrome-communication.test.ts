import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Chrome Communication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should send messages between extension components', async () => {
    const mockMessage = { action: 'test', data: 'test-data' }
    const mockResponse = { success: true }
    
    // Mock chrome.runtime.sendMessage
    const mockSendMessage = vi.fn().mockResolvedValue(mockResponse)
    global.chrome.runtime.sendMessage = mockSendMessage

    // Simulate sending a message
    const response = await chrome.runtime.sendMessage(mockMessage)
    
    expect(mockSendMessage).toHaveBeenCalledWith(mockMessage)
    expect(response).toEqual(mockResponse)
  })

  it('should handle message listeners', () => {
    const mockListener = vi.fn()
    
    // Mock chrome.runtime.onMessage.addListener
    const mockAddListener = vi.fn()
    global.chrome.runtime.onMessage.addListener = mockAddListener

    // Simulate adding a message listener
    chrome.runtime.onMessage.addListener(mockListener)
    
    expect(mockAddListener).toHaveBeenCalledWith(mockListener)
  })

  it('should send messages to content scripts', async () => {
    const tabId = 123
    const mockMessage = { action: 'contentAction', data: 'content-data' }
    const mockResponse = { received: true }
    
    // Mock chrome.tabs.sendMessage
    const mockTabsSendMessage = vi.fn().mockResolvedValue(mockResponse)
    global.chrome.tabs.sendMessage = mockTabsSendMessage

    // Simulate sending a message to a content script
    const response = await chrome.tabs.sendMessage(tabId, mockMessage)
    
    expect(mockTabsSendMessage).toHaveBeenCalledWith(tabId, mockMessage)
    expect(response).toEqual(mockResponse)
  })
}) 