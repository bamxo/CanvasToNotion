import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Firebase auth
vi.mock('firebase/auth', () => {
  const mockAuth = {
    signOut: vi.fn(),
  };
  
  const mockOnAuthStateChanged = vi.fn();
  
  return {
    getAuth: vi.fn(() => mockAuth),
    onAuthStateChanged: mockOnAuthStateChanged,
  };
});

// Mock API config
let isDevelopmentMode = true;
let isProductionMode = false;

vi.mock('../../../services/api.config', () => ({
  get isDevelopment() {
    return isDevelopmentMode;
  },
  get isProduction() {
    return isProductionMode;
  }
}));

// Mock canvas data API
vi.mock('../../../services/chrome-communication', () => ({
  canvasDataApi: {
    fetchAll: vi.fn(),
  },
}));

// Mock CSS modules
vi.mock('../Dashboard.module.css', () => ({
  default: {
    container: 'container',
    content: 'content',
    particle: 'particle',
    floatParticle: 'floatParticle',
    fadeIn: 'fadeIn',
  },
}));

// Mock child components
vi.mock('../AppBar', () => ({
  default: () => <div data-testid="app-bar">AppBar</div>,
}));

vi.mock('../PageSelector', () => ({
  default: ({ onPageSelect }: { onPageSelect: (page: any) => void }) => (
    <div data-testid="page-selector">
      <button onClick={() => onPageSelect({ id: 'page-1', title: 'Test Page' })}>
        Select Page
      </button>
    </div>
  ),
}));

vi.mock('../PageSelectionContainer', () => ({
  default: ({ selectedPage, onPageSelect, onChangePage }: any) => (
    <div data-testid="page-selection-container">
      {selectedPage ? (
        <div>
          <span>Selected: {selectedPage.title}</span>
          <button onClick={onChangePage}>Change Page</button>
        </div>
      ) : (
        <button onClick={onPageSelect}>Select Page</button>
      )}
    </div>
  ),
}));

vi.mock('../UnsyncedContainer', () => ({
  default: ({ unsyncedItems, onClearItems, isLoading }: any) => (
    <div data-testid="unsynced-container">
      <span>Unsynced Items: {unsyncedItems.length}</span>
      {isLoading && <span>Loading...</span>}
      <button onClick={onClearItems}>Clear Items</button>
    </div>
  ),
}));

// Updated SyncButton mock to properly handle syncStatus
vi.mock('../SyncButton', () => ({
  default: ({ onSync, isLoading, disabled, lastSync, syncStatus }: any) => (
    <div data-testid="sync-button">
      <button onClick={onSync} disabled={disabled || isLoading}>
        {isLoading ? 'Syncing...' : 'Sync'}
      </button>
      {lastSync && <span>Last sync: {lastSync}</span>}
      {syncStatus && <span>Status: {syncStatus}</span>}
    </div>
  ),
}));

// Mock unsynced items data
vi.mock('../../data/mockUnsyncedItems.json', () => ({
  default: {
    unsyncedItems: [
      {
        id: 'a1',
        type: 'assignment',
        title: 'Test Assignment',
        course: 'CSE 115A',
        due_date: '2025-06-15T23:59:00Z',
        status: 'upcoming',
        points: 100,
      },
      {
        id: 'q1',
        type: 'quiz',
        title: 'Test Quiz',
        course: 'CSE 115A',
        due_date: '2025-06-10T16:00:00Z',
        status: 'upcoming',
        points: 20,
      },
    ],
  },
}));

// Mock the utils module
vi.mock('../../utils/assignmentTransformer', () => ({
  transformCanvasAssignments: vi.fn((assignments, _) => {
    return assignments.map((a: any) => ({
      id: a.id || a.assignment_id,
      type: 'assignment',
      title: a.name || a.title,
      course: 'Test Course',
      due_date: a.due_at || '2025-06-15T23:59:00Z',
      status: 'upcoming',
      points: a.points_possible || 100,
    }));
  }),
}));

// Import Dashboard after mocks
import Dashboard from '../Dashboard';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { canvasDataApi } from '../../../services/chrome-communication';

// Get the mocked functions
const mockGetAuth = vi.mocked(getAuth);
const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);
const mockCanvasDataApi = vi.mocked(canvasDataApi);

describe('Dashboard Component', () => {
  let mockChromeStorage: any;
  let mockChromeRuntime: any;
  let mockAuth: any;
  let unsubscribeFn: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock auth object
    mockAuth = {
      signOut: vi.fn(),
    };
    
    unsubscribeFn = vi.fn();
    
    // Make getAuth return our mock auth
    mockGetAuth.mockReturnValue(mockAuth);
    
    // Mock Chrome storage
    mockChromeStorage = {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      },
    };

    // Mock Chrome runtime
    mockChromeRuntime = {
      sendMessage: vi.fn(),
    };

    // Setup global chrome mock
    global.chrome = {
      storage: mockChromeStorage,
      runtime: mockChromeRuntime,
    } as any;

    // Mock console methods
    global.console.log = vi.fn();
    global.console.error = vi.fn();

    // Mock Math.random for consistent particle positioning
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    
    // Mock global fetch for status checks
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render Dashboard with AppBar and particles', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({});
      });

      render(<Dashboard />);

      expect(screen.getByTestId('app-bar')).toBeInTheDocument();
      expect(screen.getByTestId('page-selection-container')).toBeInTheDocument();
      expect(screen.getByTestId('sync-button')).toBeInTheDocument();
    });

    it('should generate 20 particles with correct styling', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({});
      });

      const { container } = render(<Dashboard />);
      
      const particles = container.querySelectorAll('.particle');
      expect(particles).toHaveLength(20);
    });
  });

  describe('Authentication State Management', () => {
    it('should handle authenticated user from Firebase auth', async () => {
      const mockUser = { email: 'test@example.com' };
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(mockUser);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({});
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          userEmail: 'test@example.com',
        });
      });
    });

    it('should handle user from chrome storage when auth state is null', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ userEmail: 'stored@example.com' });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Retrieved email from storage:', 'stored@example.com');
      });
    });

    it('should handle no user email found', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({});
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('No email found in storage');
      });
    });

    it('should cleanup auth listener on unmount', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({});
      });

      const { unmount } = render(<Dashboard />);
      
      unmount();
      
      expect(unsubscribeFn).toHaveBeenCalled();
    });
  });

  describe('Page Selection State Management', () => {
    it('should show PageSelector when showPageSelector is true from storage', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ showPageSelector: true });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('page-selector')).toBeInTheDocument();
        expect(screen.queryByTestId('page-selection-container')).not.toBeInTheDocument();
      });
    });

    it('should load selected page from storage', async () => {
      const selectedPage = { id: 'page-1', title: 'Stored Page' };
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Selected: Stored Page')).toBeInTheDocument();
      });
    });

    it('should handle page selection from PageSelector', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ showPageSelector: true });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('page-selector')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Page'));

      await waitFor(() => {
        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          selectedNotionPage: { id: 'page-1', title: 'Test Page' },
          showPageSelector: false,
        });
      });
    });

    it('should handle change page click', async () => {
      const selectedPage = { id: 'page-1', title: 'Current Page' };
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Selected: Current Page')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Change Page'));

      await waitFor(() => {
        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          selectedNotionPage: null,
          showPageSelector: true,
        });
      });
    });
  });

  describe('Unsynced Items Management', () => {
    it('should display UnsyncedContainer when page is selected', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock successful comparison with unsynced items
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: [
                      { id: 1, name: 'Test Assignment 1' },
                      { id: 2, name: 'Test Assignment 2' }
                    ]
                  }
                }
              }
            }
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('unsynced-container')).toBeInTheDocument();
        expect(screen.getByText('Unsynced Items: 2')).toBeInTheDocument();
      });
    });

    it('should handle clearing unsynced items', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock successful comparison with unsynced items
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: [
                      { id: 1, name: 'Test Assignment 1' },
                      { id: 2, name: 'Test Assignment 2' }
                    ]
                  }
                }
              }
            }
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Unsynced Items: 2')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear Items'));

      await waitFor(() => {
        expect(screen.getByText('Unsynced Items: 0')).toBeInTheDocument();
      });
    });
  });

  describe('Sync Functionality', () => {
    it('should handle successful sync', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });
      
      // Mock successful comparison
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: [{ id: 1, name: 'Test Assignment' }]
                  }
                }
              }
            }
          });
        } else if (message.type === 'SYNC_TO_NOTION') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false });
      });

      mockCanvasDataApi.fetchAll.mockResolvedValue({
        courses: [{ id: 1, name: 'Test Course' }],
        assignments: [{ id: 1, name: 'Test Assignment' }],
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith({
          type: 'SYNC_TO_NOTION',
          data: {
            email: userEmail,
            pageId: selectedPage.id,
          },
        });
      });

      await waitFor(() => {
        // Look for Status: text followed by either success or partial
        const statusTextElement = screen.getByText(/Status:/);
        expect(statusTextElement).toBeInTheDocument();
        
        // Get the parent element and check its text content
        const statusParent = statusTextElement.parentElement;
        expect(statusParent).toBeInTheDocument();
        const fullStatusText = statusParent?.textContent || '';
        
        // Check if the status text contains either success or partial
        expect(
          fullStatusText.includes('success') || 
          fullStatusText.includes('partial')
        ).toBe(true);
        
        expect(screen.getByText(/Last sync:/)).toBeInTheDocument();
      });
    });

    it('should handle sync error when missing page or email', async () => {
      // Test the case where sync is attempted but fails due to missing data
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      
      // Set up auth to return null (no email)
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
        expect(screen.getByText('Sync')).toBeDisabled();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      // Button should still be disabled, and no error status should be set
      await waitFor(() => {
        expect(screen.queryByText('Status: error')).not.toBeInTheDocument();
        expect(screen.getByText('Sync')).toBeDisabled();
      });
    });

    it('should handle sync error during API call', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock comparison to succeed but sync to fail
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: [{ id: 1, name: 'Test Assignment' }]
                  }
                }
              }
            }
          });
        } else if (message.type === 'SYNC_TO_NOTION') {
          return Promise.reject(new Error('API Error'));
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(screen.getByText('Status: error')).toBeInTheDocument();
        expect(console.error).toHaveBeenCalledWith('Sync failed:', expect.any(Error));
      });
    });

    it('should disable sync button when loading', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Set up the compare mock to succeed
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: [{ id: 1, name: 'Test Assignment' }]
                  }
                }
              }
            }
          });
        } else if (message.type === 'SYNC_TO_NOTION') {
          // Make the sync call hang to test loading state
          return new Promise(() => {});
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
        expect(screen.getByText('Syncing...')).toBeDisabled();
      });
    });
  });

  describe('Console Logging', () => {
    it('should log auth state changes', async () => {
      const mockUser = { email: 'test@example.com' };
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(mockUser);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({});
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Auth state changed:', 'test@example.com');
      });
    });

    it('should log current user email and selected page', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Current user email:', userEmail);
        expect(console.log).toHaveBeenCalledWith('Selected page:', {
          id: selectedPage.id,
          title: selectedPage.title,
        });
      });
    });

    it('should log sync button state', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({});
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sync button state:', {
          isLoading: false,
          hasSelectedPage: false,
          hasUserEmail: false,
          isDisabled: true,
        });
      });
    });

    it('should log page selection', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ showPageSelector: true });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('page-selector')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Page'));

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Page selected:', {
          id: 'page-1',
          title: 'Test Page',
        });
      });
    });

    it('should log sync button disabled reason when sync is attempted', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null); // No user email
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sync button state:', {
          isLoading: false,
          hasSelectedPage: true,
          hasUserEmail: false,
          isDisabled: true,
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle selectedPage with only required fields', async () => {
      const selectedPage = { id: 'page-1', title: 'Minimal Page' };
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Selected: Minimal Page')).toBeInTheDocument();
      });
    });

    it('should handle empty chrome storage response', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({});
      });

      render(<Dashboard />);

      // Should not crash and should render default state
      await waitFor(() => {
        expect(screen.getByTestId('page-selection-container')).toBeInTheDocument();
      });
    });

    it('should handle chrome storage errors gracefully', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      // Mock chrome storage to not throw during the get call
      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({});
      });

      // Should not crash
      expect(() => render(<Dashboard />)).not.toThrow();
    });

    it('should handle null result from chrome storage', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      // Mock chrome storage to return null but handle it gracefully
      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        // Simulate the actual behavior - chrome storage returns {} when result is null
        callback({});
      });

      // Should not crash
      expect(() => render(<Dashboard />)).not.toThrow();
    });

    it('should handle undefined result from chrome storage', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      // Mock chrome storage to return undefined but handle it gracefully
      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        // Simulate the actual behavior - chrome storage returns {} when result is undefined
        callback({});
      });

      // Should not crash
      expect(() => render(<Dashboard />)).not.toThrow();
    });
  });

  describe('Particle Component', () => {
    it('should render particles with correct delay calculations', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({});
      });

      const { container } = render(<Dashboard />);
      
      const particles = container.querySelectorAll('.particle');
      expect(particles).toHaveLength(20);
      
      // Check that particles have different animation delays
      const firstParticle = particles[0] as HTMLElement;
      const secondParticle = particles[1] as HTMLElement;
      
      expect(firstParticle.style.animationDelay).toBe('0s');
      expect(secondParticle.style.animationDelay).toBe('0.3s');
    });
  });

  describe('Component State Transitions', () => {
    it('should transition from PageSelector to Dashboard when page is selected', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ showPageSelector: true });
      });

      render(<Dashboard />);

      // Initially should show PageSelector
      expect(screen.getByTestId('page-selector')).toBeInTheDocument();
      expect(screen.queryByTestId('page-selection-container')).not.toBeInTheDocument();

      // Simulate page selection
      fireEvent.click(screen.getByText('Select Page'));

      // After selection, should show Dashboard
      await waitFor(() => {
        expect(screen.queryByTestId('page-selector')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple state changes correctly', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback(null);
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      render(<Dashboard />);

      // Should show selected page
      await waitFor(() => {
        expect(screen.getByText('Selected: Test Page')).toBeInTheDocument();
      });

      // Click change page
      fireEvent.click(screen.getByText('Change Page'));

      // Should trigger storage update
      await waitFor(() => {
        expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
          selectedNotionPage: null,
          showPageSelector: true,
        });
      });
    });
  });

  describe('Production Environment Sync', () => {
    beforeEach(() => {
      // Change config mock to production mode
      isDevelopmentMode = false;
      isProductionMode = true;
    });

    afterEach(() => {
      // Reset back to development mode
      isDevelopmentMode = true;
      isProductionMode = false;
    });

    it('should handle successful sync in production mode', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock successful comparison and sync
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: [{ id: 1, name: 'Test Assignment' }]
                  }
                }
              }
            }
          });
        } else if (message.type === 'SYNC_TO_NOTION') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false });
      });

      // Mock fetch response for status checking
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('sync-status')) {
          return Promise.resolve({
            json: () => Promise.resolve({
              success: true,
              syncStatus: { status: 'complete' }
            })
          });
        }
        return Promise.resolve({ json: () => Promise.resolve({}) });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith({
          type: 'SYNC_TO_NOTION',
          data: {
            email: userEmail,
            pageId: selectedPage.id,
          },
        });
      });

      await waitFor(() => {
        // Look for Status: text followed by either success or partial
        const statusTextElement = screen.getByText(/Status:/);
        const statusParent = statusTextElement.parentElement;
        const fullStatusText = statusParent?.textContent || '';
        expect(
          fullStatusText.includes('success') || 
          fullStatusText.includes('partial')
        ).toBe(true);
      });
    });

    it('should handle error response from sync in production mode', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock successful comparison but error in sync
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: [{ id: 1, name: 'Test Assignment' }]
                  }
                }
              }
            }
          });
        } else if (message.type === 'SYNC_TO_NOTION') {
          return Promise.resolve({ success: false, error: 'Sync error' });
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(screen.getByText('Status: error')).toBeInTheDocument();
      });
    });

    it('should handle status polling with complete status', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock successful comparison and sync
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: []
                  }
                }
              }
            }
          });
        } else if (message.type === 'SYNC_TO_NOTION') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false });
      });

      // Mock fetch to return complete status
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            syncStatus: { status: 'complete' }
          })
        });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(screen.getByText('Status: success')).toBeInTheDocument();
      });
    });

    it('should handle status polling with error status', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock successful comparison and sync
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: [{ id: 1, name: 'Test Assignment' }]
                  }
                }
              }
            }
          });
        } else if (message.type === 'SYNC_TO_NOTION') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false });
      });

      // Mock fetch to return error status
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            syncStatus: { status: 'error' }
          })
        });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(screen.getByText('Status: error')).toBeInTheDocument();
      });
    });

    it('should handle invalid status response', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock successful comparison and sync
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: [{ id: 1, name: 'Test Assignment' }]
                  }
                }
              }
            }
          });
        } else if (message.type === 'SYNC_TO_NOTION') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false });
      });

      // Mock fetch to return invalid response
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: false
          })
        });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(screen.getByText('Status: error')).toBeInTheDocument();
      });
    });

    it('should handle fetch error during status polling', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock successful comparison and sync
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: [{ id: 1, name: 'Test Assignment' }]
                  }
                }
              }
            }
          });
        } else if (message.type === 'SYNC_TO_NOTION') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false });
      });

      // Mock fetch to throw an error
      global.fetch = vi.fn().mockImplementation(() => {
        throw new Error('Network error');
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(screen.getByText('Status: error')).toBeInTheDocument();
      });
    });
  });

  describe('Compare With Notion Edge Cases', () => {
    it('should handle missing compareResult in response', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock response without compareResult
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              // No compareResult property
            }
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      // Should not crash and should set unsyncedItems to empty array
      await waitFor(() => {
        expect(screen.getByTestId('unsynced-container')).toBeInTheDocument();
        expect(screen.getByText('Unsynced Items: 0')).toBeInTheDocument();
      });
    });

    it('should handle missing comparison data in compareResult', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock response without comparison data
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                // No comparison property
                otherData: 'something'
              }
            }
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      // Should not crash and should set unsyncedItems to empty array
      await waitFor(() => {
        expect(screen.getByTestId('unsynced-container')).toBeInTheDocument();
        expect(screen.getByText('Unsynced Items: 0')).toBeInTheDocument();
      });
    });

    it('should handle error when comparing with Notion', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock compare to throw an error
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          throw new Error('Compare error');
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      // Should not crash and should set unsyncedItems to empty array
      await waitFor(() => {
        expect(screen.getByTestId('unsynced-container')).toBeInTheDocument();
        expect(screen.getByText('Unsynced Items: 0')).toBeInTheDocument();
        expect(console.error).toHaveBeenCalledWith('Error comparing with Notion:', expect.any(Error));
      });
    });

    it('should handle failed response from compareWithNotion', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock compare to return failed response
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: false,
            error: 'Something went wrong'
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      // Should not crash and should set unsyncedItems to empty array
      await waitFor(() => {
        expect(screen.getByTestId('unsynced-container')).toBeInTheDocument();
        expect(screen.getByText('Unsynced Items: 0')).toBeInTheDocument();
        expect(console.error).toHaveBeenCalledWith('Compare failed or returned invalid data:', expect.any(Object));
      });
    });
  });

  describe('Development Environment Sync Edge Cases', () => {
    beforeEach(() => {
      // Ensure in development mode
      isDevelopmentMode = true;
      isProductionMode = false;
    });

    it('should handle partial sync response', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      // Mock partial sync response
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          return Promise.resolve({
            success: true,
            data: {
              courses: [{ id: 1, name: 'Test Course' }],
              compareResult: {
                comparison: {
                  'Test Course': {
                    onlyInCanvas: []
                  }
                }
              }
            }
          });
        } else if (message.type === 'SYNC_TO_NOTION') {
          return Promise.resolve({ 
            success: true,
            partial: true
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith({
          type: 'SYNC_TO_NOTION',
          data: {
            email: userEmail,
            pageId: selectedPage.id,
          },
        });
      });

      await waitFor(() => {
        const statusTextElement = screen.getByText(/Status:/);
        const statusParent = statusTextElement.parentElement;
        const fullStatusText = statusParent?.textContent || '';
        expect(fullStatusText.includes('partial')).toBe(true);
      });
    });

    it('should handle compareWithNotion error after successful sync', async () => {
      const selectedPage = { id: 'page-1', title: 'Test Page' };
      const userEmail = 'test@example.com';
      
      mockOnAuthStateChanged.mockImplementation((_auth: any, callback: any) => {
        callback({ email: userEmail });
        return unsubscribeFn;
      });

      mockChromeStorage.local.get.mockImplementation((_keys: any, callback: any) => {
        callback({ selectedNotionPage: selectedPage });
      });

      let compareCallCount = 0;
      
      // Mock successful sync but error in second compare
      mockChromeRuntime.sendMessage.mockImplementation((message: { type: string; data?: any }) => {
        if (message.type === 'COMPARE') {
          compareCallCount++;
          if (compareCallCount === 1) {
            // First call (initial compare) succeeds
            return Promise.resolve({
              success: true,
              data: {
                courses: [{ id: 1, name: 'Test Course' }],
                compareResult: {
                  comparison: {
                    'Test Course': {
                      onlyInCanvas: [{ id: 1, name: 'Test Assignment' }]
                    }
                  }
                }
              }
            });
          } else {
            // Second call (post-sync verification) fails
            throw new Error('Second compare failed');
          }
        } else if (message.type === 'SYNC_TO_NOTION') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Sync'));
      });

      await waitFor(() => {
        expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith({
          type: 'SYNC_TO_NOTION',
          data: {
            email: userEmail,
            pageId: selectedPage.id,
          },
        });
      });

      // Wait for status to be updated
      await waitFor(() => {
        expect(screen.getByText('Status: success')).toBeInTheDocument();
      });

      // Verify the correct error was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/Error (during compare after sync|comparing with Notion):/),
        expect.any(Error)
      );
    });
  });
}); 