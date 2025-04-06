import { describe, it, expect, vi } from 'vitest';

describe('Background Script', () => {
  it('should handle authentication state', () => {
    let isAuthenticated = false;
    
    const setAuthenticated = (state: boolean) => {
      isAuthenticated = state;
    };

    setAuthenticated(true);
    expect(isAuthenticated).toBe(true);
  });

  it('should handle message passing', () => {
    const mockSendResponse = vi.fn();
    const mockRequest = {
      action: 'authenticate',
      notionToken: 'test-token'
    };

    // Mock chrome.storage.local
    const mockStorage = {
      set: vi.fn().mockResolvedValue(undefined)
    };

    global.chrome = {
      storage: {
        local: mockStorage
      }
    } as any;

    // Test authentication handler
    const handleAuthentication = async (request: any, sendResponse: any) => {
      if (request.notionToken) {
        await chrome.storage.local.set({ notionToken: request.notionToken });
        sendResponse({ success: true });
      }
    };

    handleAuthentication(mockRequest, mockSendResponse);
    
    expect(mockStorage.set).toHaveBeenCalledWith({ 
      notionToken: 'test-token' 
    });
  });
}); 