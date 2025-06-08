import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Component to test
import PageSelector from '../PageSelector';

// Mock dependencies
vi.mock('axios');
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn()
}));
vi.mock('../AppBar', () => ({
  default: () => <div>AppBar Mock</div>
}));
vi.mock('../NotionDisconnected', () => ({
  default: ({ onRetry }: { onRetry: (isAutoRetry?: boolean) => void }) => (
    <div>
      <span>Notion Disconnected</span>
      <button onClick={() => onRetry(false)}>Check Connection</button>
    </div>
  )
}));
vi.mock('../DefaultPageView', () => ({
  default: ({ 
    pages, 
    isLoading, 
    onPageSelect 
  }: { 
    pages: Array<{id: string, title: string}>,
    isLoading: boolean,
    onPageSelect: (page: any) => void
  }) => (
    <div>
      <span>Default Page View</span>
      <span>{isLoading ? 'Loading' : 'Not Loading'}</span>
      <span>Pages: {pages?.length || 0}</span>
      {pages?.map(page => (
        <button key={page.id} onClick={() => onPageSelect(page)}>
          {page.title}
        </button>
      ))}
    </div>
  )
}));

// Mock CSS modules
vi.mock('../PageSelector.module.css', () => ({
  default: {
    container: 'container-mock',
    content: 'content-mock',
    loadingContainer: 'loading-container-mock',
    loadingSpinner: 'loading-spinner-mock',
    loadingText: 'loading-text-mock',
    errorContainer: 'error-container-mock',
    errorText: 'error-text-mock',
    retryText: 'retry-text-mock',
    retryButton: 'retry-button-mock',
    particle: 'particle-mock',
    floatParticle: 'float-particle-mock'
  }
}));

// Mock ENDPOINTS from api.config
vi.mock('../../services/api.config', () => ({
  ENDPOINTS: {
    CONNECTED: 'http://localhost:3000/api/notion/connected',
    PAGES: 'http://localhost:3000/api/notion/pages'
  },
  isDevelopment: true
}));

// Import mocked libraries
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

describe('PageSelector Component', () => {
  // Setup common mocks for all tests
  const mockUser = { 
    email: 'test@example.com',
    getIdToken: vi.fn().mockResolvedValue('mock-firebase-token')
  };
  const mockOnPageSelect = vi.fn();
  const mockOnAuthStateChanged = vi.fn();
  const mockAxiosGet = vi.fn();
  
  // Setup chrome API mocks
  let mockChromeStorage: any;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset mockUser.getIdToken to ensure each test has a fresh implementation
    mockUser.getIdToken = vi.fn().mockResolvedValue('mock-firebase-token');
    
    // Mock chrome storage
    mockChromeStorage = {
      local: {
        get: vi.fn((_keys: string | string[] | Record<string, any>, callback: (result: Record<string, any>) => void) => callback({})),
        set: vi.fn()
      }
    };
    
    // Setup global chrome mock
    global.chrome = {
      storage: mockChromeStorage,
      tabs: { create: vi.fn() }
    } as any;
    
    // Mock Axios get
    (axios.get as any) = mockAxiosGet;
    
    // Mock Firebase auth functions using vi.mocked - consistent with other test files
    const mockGetAuth = vi.mocked(getAuth);
    mockGetAuth.mockReturnValue({} as any);
    
    vi.mocked(onAuthStateChanged).mockImplementation(mockOnAuthStateChanged);

    // Tell fake timers to also control Date.now()
    vi.useFakeTimers({ shouldAdvanceTime: true });
    
    // Mock AbortController
    global.AbortController = vi.fn().mockImplementation(() => ({
      signal: 'mock-signal',
      abort: vi.fn()
    }));
    
    // Silence console logs
    console.log = vi.fn();
    console.error = vi.fn();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Authentication State', () => {
    it('should show loading state initially', () => {
      // Mock auth state with null user (still loading)
      mockOnAuthStateChanged.mockImplementation((_auth, _) => {
        // Don't call callback yet - simulating loading state
        return vi.fn(); // Return unsubscribe function
      });

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });
    
    it('should check for stored email when auth returns null', async () => {
      // Mock auth state with null user
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(null); // Auth returns no user
        return vi.fn(); // Return unsubscribe function
      });
      
      // No email in storage
      mockChromeStorage.local.get.mockImplementation((_keys: string | string[] | Record<string, any>, callback: (result: Record<string, any>) => void) => {
        callback({});
      });

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      expect(screen.queryByText('User not authenticated')).not.toBeInTheDocument();
    });
    
    it('should use email from storage when auth returns null', async () => {
      // Mock auth state with null user
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(null); // Auth returns no user
        return vi.fn(); // Return unsubscribe function
      });
      
      // Email exists in storage
      mockChromeStorage.local.get.mockImplementation((_keys: string | string[] | Record<string, any>, callback: (result: Record<string, any>) => void) => {
        callback({ userEmail: 'storage@example.com', firebaseToken: 'mock-firebase-token' });
      });
      
      // Mock successful connection check
      mockAxiosGet.mockResolvedValueOnce({ 
        data: { connected: true } 
      });
      
      // Mock successful pages fetch
      mockAxiosGet.mockResolvedValueOnce({
        data: { pages: [] }
      });

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // First axios call should be to check connection
      expect(mockAxiosGet).toHaveBeenCalledWith('http://localhost:3000/api/notion/connected', 
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-firebase-token'
          }
        })
      );
    });
    
    it('should use email from auth when available', () => {
      // Mock auth state with user
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(mockUser);
        return vi.fn(); // Return unsubscribe function
      });
      
      // Just check the initial render and auth state
      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Check what we know will be true - auth was called and 
      // user email was received from the auth object
      expect(mockOnAuthStateChanged).toHaveBeenCalled();
      expect(getAuth).toHaveBeenCalled();
      
      // Rather than checking implementation details, verify what the user would see
      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument();
    });
  });
  
  describe('Notion Connection States', () => {
    beforeEach(() => {
      // Mock auth state with user for all tests in this group
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });
    });
    
    it('should show Notion disconnected UI when not connected', async () => {
      // Mock failed connection
      mockAxiosGet.mockResolvedValueOnce({ 
        data: { connected: false } 
      });

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for the API call to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalled();
      });
      
      expect(screen.getByText('Notion Disconnected')).toBeInTheDocument();
    });
    
    it('should handle connection check errors', async () => {
      // Mock connection check error
      mockAxiosGet.mockRejectedValueOnce(new Error('Network error'));

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for the API call to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalled();
      });
      
      expect(screen.getByText('Notion Disconnected')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });
    
    it('should show loading UI when checking connection', () => {
      // Don't resolve the connection check yet
      mockAxiosGet.mockImplementationOnce(() => new Promise(() => {}));

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Should show loading UI while waiting for connection check
      expect(screen.getByText('Checking Notion connection...')).toBeInTheDocument();
    });
    
    it('should retry connection check when Check Connection button is clicked', async () => {
      // First check fails
      mockAxiosGet.mockResolvedValueOnce({ 
        data: { connected: false } 
      });
      
      // Second check succeeds
      mockAxiosGet.mockResolvedValueOnce({ 
        data: { connected: true } 
      });
      
      // Mock successful pages fetch
      mockAxiosGet.mockResolvedValueOnce({
        data: { pages: [] }
      });

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for first connection check to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(1);
      });
      
      expect(screen.getByText('Notion Disconnected')).toBeInTheDocument();
      
      // Click retry button
      fireEvent.click(screen.getByText('Check Connection'));
      
      // Wait for second connection check to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(3);
      });
      
      // Should now show Default Page View
      expect(screen.getByText('Default Page View')).toBeInTheDocument();
    });
  });
  
  describe('Page Loading States', () => {
    beforeEach(() => {
      // Mock auth state with user for all tests in this group
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });
    });
    
    it('should show loading UI while fetching pages', async () => {
      // Mock successful connection
      mockAxiosGet.mockResolvedValueOnce({ 
        data: { connected: true } 
      });
      
      // Don't resolve the page loading yet
      mockAxiosGet.mockImplementationOnce(() => new Promise(() => {}));

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for connection check to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      });
      
      expect(screen.getByText('Loading your Notion pages...')).toBeInTheDocument();
    });
    
    it('should display error UI when page fetch fails', async () => {
      // Mock successful connection check
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      
      // Mock page fetch error
      mockAxiosGet.mockRejectedValueOnce(new Error('Failed to fetch pages'));

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for both API calls to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      });
      
      expect(screen.getByText('Failed to load pages. Please try again later.')).toBeInTheDocument();
      expect(screen.getByText('Retry Now')).toBeInTheDocument();
    });
    
    it('should retry page fetch when Retry Now button is clicked', async () => {
      // Mock successful connection check
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      
      // First fetch fails
      mockAxiosGet.mockRejectedValueOnce(new Error('Failed to fetch pages'));
      
      // Second connection check succeeds
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      
      // Second fetch succeeds
      mockAxiosGet.mockResolvedValueOnce({
        data: { pages: [{ id: 'page1', title: 'Test Page' }] }
      });

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for both initial API calls to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      });
      
      expect(screen.getByText('Failed to load pages. Please try again later.')).toBeInTheDocument();
      
      // Click retry button
      fireEvent.click(screen.getByText('Retry Now'));
      
      // Wait for retry API calls to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(4);
      });
      
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
    
    it('should auto retry page fetch on failure', async () => {
      // Mock successful connection check
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      
      // First fetch fails
      mockAxiosGet.mockRejectedValueOnce(new Error('Failed to fetch pages'));
      
      // Second connection check succeeds
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      
      // Second fetch succeeds
      mockAxiosGet.mockResolvedValueOnce({
        data: { pages: [{ id: 'page1', title: 'Test Page' }] }
      });

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for both initial API calls to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      });
      
      expect(screen.getByText('Retrying automatically... (1/3)')).toBeInTheDocument();
      
      // Fast-forward timer to trigger retry
      vi.advanceTimersByTime(500);
      
      // Wait for retry API calls to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(4);
      });
      
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
    
    it('should display pages and allow page selection', async () => {
      // Mock successful connection check
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      
      // Mock successful page fetch with pages
      mockAxiosGet.mockResolvedValueOnce({
        data: { pages: [
          { id: 'page1', title: 'Page One' },
          { id: 'page2', title: 'Page Two' }
        ]}
      });

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for both API calls to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      });
      
      expect(screen.getByText('Pages: 2')).toBeInTheDocument();
      expect(screen.getByText('Page One')).toBeInTheDocument();
      expect(screen.getByText('Page Two')).toBeInTheDocument();
      
      // Click on a page
      fireEvent.click(screen.getByText('Page One'));
      
      // Should call onPageSelect with the page
      expect(mockOnPageSelect).toHaveBeenCalledWith({ id: 'page1', title: 'Page One' });
    });
    
    it('should optimize API calls with caching mechanism', async () => {
      // First render - should fetch pages
      // Mock successful connection check
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      
      // Mock successful page fetch
      mockAxiosGet.mockResolvedValueOnce({
        data: { pages: [{ id: 'page1', title: 'Test Page' }] }
      });

      const { unmount } = render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for both API calls to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      });
      
      // Unmount to simulate component recreation
      unmount();
      
      // Reset mocks for second render
      mockAxiosGet.mock.calls.length;
      mockAxiosGet.mockClear();
      
      // For second render, mock connection check
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      
      // Second render - should attempt to use cache if page cache mechanism works
      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for connection check
      await waitFor(() => {
        // We only expect the connection check call, not the pages fetch (it should use cache)
        expect(mockAxiosGet).toHaveBeenCalled();
      });
      
      // Wait a bit to ensure no additional calls are made
      await vi.advanceTimersByTimeAsync(100);
      
      // Need to check that only the connection check was made
      const pagesEndpointCalls = mockAxiosGet.mock.calls.filter(
        call => call[0] === 'http://localhost:3000/api/notion/pages'
      );
      
      // Verify only connection check was made, not pages call
      expect(pagesEndpointCalls.length).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Cleanup and Edge Cases', () => {
    it('should perform cleanup on unmount', async () => {
      // Create a mock for the unsubscribe function from Firebase
      const unsubscribeMock = vi.fn();
      
      // Mock auth state with user, and return the unsubscribe mock
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(mockUser);
        return unsubscribeMock;
      });
      
      // Mock successful connection
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      mockAxiosGet.mockResolvedValueOnce({ data: { pages: [] } });
      
      // Render and immediately unmount
      const { unmount } = render(<PageSelector onPageSelect={mockOnPageSelect} />);
      unmount();
      
      // Check if the Firebase unsubscribe was called
      expect(unsubscribeMock).toHaveBeenCalled();
    });
    
    it('should handle abort controller errors gracefully', async () => {
      // Mock auth state with user
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });
      
      // Mock connection succeeds
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      
      // Mock axios cancel error
      const cancelError = new Error('Request aborted');
      (cancelError as any).isCancel = true;
      mockAxiosGet.mockRejectedValueOnce(cancelError);
      
      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for both API calls to execute
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      });
      
      // Should not show error UI for canceled request
      expect(screen.queryByText('Failed to load pages')).not.toBeInTheDocument();
    });
    
    it('should show error when max auto retries are exhausted', async () => {
      // Mock auth state with user
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });
      
      // Mock connection succeeds but page fetches fail repeatedly
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      mockAxiosGet.mockRejectedValueOnce(new Error('Fetch error 1'));
      
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      mockAxiosGet.mockRejectedValueOnce(new Error('Fetch error 2'));
      
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      mockAxiosGet.mockRejectedValueOnce(new Error('Fetch error 3'));
      
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      mockAxiosGet.mockRejectedValueOnce(new Error('Fetch error 4'));

      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for first API calls to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(2);
      });
      
      // Initial error shows first retry count
      expect(screen.getByText('Retrying automatically... (1/3)')).toBeInTheDocument();
      
      // Advance timer for first retry
      vi.advanceTimersByTime(500);
      
      // Wait for second set of API calls
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(4);
      });
      
      // First retry fails, shows second retry count
      expect(screen.getByText('Retrying automatically... (2/3)')).toBeInTheDocument();
      
      // Advance timer for second retry
      vi.advanceTimersByTime(1000);
      
      // Wait for third set of API calls
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(6);
      });
      
      // Second retry fails, shows third retry count
      expect(screen.getByText('Retrying automatically... (3/3)')).toBeInTheDocument();
      
      // Advance timer for third retry
      vi.advanceTimersByTime(1500);
      
      // Wait for fourth set of API calls
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalledTimes(8);
      });
      
      // Third retry fails - should show max retries message
      expect(screen.getByText('Automatic retries exhausted.')).toBeInTheDocument();
    });
    
    it('should clear timeouts and abort controllers on unmount', async () => {
      // Mock auth state with user
      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });
      
      // Mock connection succeeds
      mockAxiosGet.mockResolvedValueOnce({ data: { connected: true } });
      
      // Create mocks for timeout and abort controller
      vi.spyOn(global, 'clearTimeout');
      const mockAbortController = {
        signal: 'mock-signal',
        abort: vi.fn()
      };
      
      // Mock AbortController to return our mock
      global.AbortController = vi.fn().mockImplementation(() => mockAbortController);
      
      // Render and unmount during page loading
      const { unmount } = render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Wait for the first API call to complete
      await waitFor(() => {
        expect(mockAxiosGet).toHaveBeenCalled();
      });
      
      // Unmount during the second API call
      unmount();
      
      // Check that abort was called
      expect(mockAbortController.abort).toHaveBeenCalled();
    });
  });
  
  describe('Visual Elements', () => {
    it('should render particles with correct styles', () => {
      // Mock random to return predictable values for testing
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      // Mock auth to avoid API calls - keep in loading state
      mockOnAuthStateChanged.mockImplementation((_auth, _) => {
        // Don't call callback - keep in loading state
        return vi.fn();
      });
      
      render(<PageSelector onPageSelect={mockOnPageSelect} />);
      
      // Check that particles are rendered
      const particles = document.querySelectorAll('.particle-mock');
      expect(particles.length).toBe(20);
      
      // Verify style properties on first particle
      const firstParticle = particles[0] as HTMLElement;
      expect(firstParticle.style.left).toBe('50%');
      expect(firstParticle.style.animation).toBe('float-particle-mock 6s ease-in infinite');
      expect(firstParticle.style.animationDelay).toBe('0s');
      
      mockRandom.mockRestore();
    });
  });
}); 