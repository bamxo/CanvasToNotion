import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the popup components
vi.mock('./popup/components/LoginRedirect', () => ({
  default: () => <div data-testid="login-redirect">LoginRedirect Component</div>
}));

vi.mock('./popup/components/Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard Component</div>
}));

vi.mock('./popup/components/PageSelector', () => ({
  default: ({ onPageSelect }: { onPageSelect: () => void }) => (
    <div data-testid="page-selector">
      <button onClick={onPageSelect}>Select Page</button>
    </div>
  )
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Setup chrome API mocks with proper structure
    global.chrome = {
      ...global.chrome,
      storage: {
        ...global.chrome.storage,
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      runtime: {
        ...global.chrome.runtime,
        connect: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    // Mock chrome.tabs.query to simulate checking current page
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get to simulate checking auth state
    (chrome.storage.local.get as any).mockImplementation((_: any, _callback: any) => {
      // Don't call callback immediately to keep in loading state
    });

    render(<App />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render LoginRedirect when not authenticated', async () => {
    // Mock chrome.tabs.query to simulate checking current page
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get to return no auth token
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: null, selectedPage: null });
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });
  });

  it('should render PageSelector when authenticated but no page selected', async () => {
    // Mock chrome.tabs.query to simulate checking current page
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get to return auth token but no selected page
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: 'test-token', selectedPage: null });
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Select Page')).toBeInTheDocument();
    });
  });

  it('should render Dashboard when authenticated and page selected', async () => {
    // Mock chrome.tabs.query to simulate checking current page
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get to return auth token and selected page
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: 'test-token', selectedPage: true });
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
    });
  });

  it('should detect Canvas page correctly', async () => {
    // Mock chrome.tabs.query to simulate Canvas page
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://canvas.instructure.com/courses/123' }]);
    });

    // Mock chrome.storage.local.get to return no auth token
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: null, selectedPage: null });
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });
  });

  it('should handle page selection correctly', async () => {
    // Mock chrome.tabs.query
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get to return auth token but no selected page
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: 'test-token', selectedPage: null });
    });

    // Mock chrome.storage.local.set
    (chrome.storage.local.set as any).mockImplementation((_: any, callback?: any) => {
      if (callback) callback();
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Select Page')).toBeInTheDocument();
    });

    // Click the select page button
    const selectButton = screen.getByText('Select Page');
    selectButton.click();

    // Verify chrome.storage.local.set was called
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ selectedPage: true });
  });

  it('should handle cleanup on unmount', async () => {
    // Mock chrome.tabs.query
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: null, selectedPage: null });
    });

    const { unmount } = render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });

    // Unmount the component to trigger cleanup
    unmount();

    // Verify cleanup functions were called
    expect(chrome.storage.onChanged.removeListener).toHaveBeenCalled();
    expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalled();
  });

  it('should handle tabs query with empty results', async () => {
    // Mock chrome.tabs.query to return empty array
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([]);
    });

    // Mock chrome.storage.local.get
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: null, selectedPage: null });
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });
  });

  it('should handle tabs query with undefined URL', async () => {
    // Mock chrome.tabs.query to return tab with undefined URL
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: undefined }]);
    });

    // Mock chrome.storage.local.get
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: null, selectedPage: null });
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });
  });

  it('should handle storage change events', async () => {
    // Mock chrome.tabs.query
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: null, selectedPage: null });
    });

    let storageChangeListener: any;
    (chrome.storage.onChanged.addListener as any).mockImplementation((listener: any) => {
      storageChangeListener = listener;
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });

    // Simulate storage change for canvasToken
    storageChangeListener({
      canvasToken: { newValue: 'new-token' },
    });

    await waitFor(() => {
      expect(screen.getByText('Select Page')).toBeInTheDocument();
    });

    // Simulate storage change for selectedPage
    storageChangeListener({
      selectedPage: { newValue: true },
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
    });
  });

  it('should handle runtime message events', async () => {
    // Mock chrome.tabs.query
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: null, selectedPage: null });
    });

    let messageListener: any;
    (chrome.runtime.onMessage.addListener as any).mockImplementation((listener: any) => {
      messageListener = listener;
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });

    // Simulate LOGIN_SUCCESS message
    messageListener({ type: 'LOGIN_SUCCESS' });

    await waitFor(() => {
      expect(screen.getByText('Select Page')).toBeInTheDocument();
    });

    // Simulate LOGOUT_SUCCESS message
    messageListener({ type: 'LOGOUT_SUCCESS' });

    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });

    // Simulate LOGOUT message
    messageListener({ type: 'LOGOUT' });

    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });
  });

  it('should handle storage changes with null values', async () => {
    // Mock chrome.tabs.query
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: 'test-token', selectedPage: true });
    });

    let storageChangeListener: any;
    (chrome.storage.onChanged.addListener as any).mockImplementation((listener: any) => {
      storageChangeListener = listener;
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
    });

    // Simulate storage change with null values
    storageChangeListener({
      canvasToken: { newValue: null },
      selectedPage: { newValue: null },
    });

    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });
  });

  it('should apply correct container styles based on authentication state', async () => {
    // Mock chrome.tabs.query for non-Canvas page
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get to return no auth token
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: null, selectedPage: null });
    });

    const { container } = render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });

    const extensionContainer = container.querySelector('.extension-container');
    expect(extensionContainer).toHaveStyle({ height: '420px' });
  });

  it('should apply correct container styles for Canvas page', async () => {
    // Mock chrome.tabs.query for Canvas page
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://canvas.instructure.com/courses/123' }]);
    });

    // Mock chrome.storage.local.get to return no auth token
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: null, selectedPage: null });
    });

    const { container } = render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('LoginRedirect Component')).toBeInTheDocument();
    });

    const extensionContainer = container.querySelector('.extension-container');
    expect(extensionContainer).toHaveStyle({ height: '388px' });
  });

  it('should apply correct container styles when authenticated', async () => {
    // Mock chrome.tabs.query
    (chrome.tabs.query as any).mockImplementation((_: any, callback: any) => {
      callback([{ url: 'https://example.com' }]);
    });

    // Mock chrome.storage.local.get to return auth token and selected page
    (chrome.storage.local.get as any).mockImplementation((_: any, callback: any) => {
      callback({ canvasToken: 'test-token', selectedPage: true });
    });

    const { container } = render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
    });

    const extensionContainer = container.querySelector('.extension-container');
    expect(extensionContainer).toHaveClass('authenticated');
    expect(extensionContainer).toHaveStyle({ height: 'auto', minHeight: '388px' });
  });
}); 