import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock CSS modules
vi.mock('../PageSelector.module.css', () => ({
  default: {
    notionDisconnectedContainer: 'notionDisconnectedContainer',
    iconWrapper: 'iconWrapper',
    disconnectedIcon: 'disconnectedIcon',
    disconnectedTitle: 'disconnectedTitle',
    disconnectedMessage: 'disconnectedMessage',
    settingsButton: 'settingsButton',
    settingsIcon: 'settingsIcon',
    checkConnectionButton: 'checkConnectionButton',
  },
}));

// Mock react-icons
vi.mock('react-icons/fa', () => ({
  FaLink: () => <div data-icon="link-icon" />,
  FaCog: () => <div data-icon="cog-icon" />,
}));

// Mock isDevelopment from api.config
vi.mock('../../../services/api.config', () => ({
  isDevelopment: false, // Default to production for tests
}));

// Import the component after mocks
import NotionDisconnected from '../NotionDisconnected';
// Import the mocked module
import * as apiConfig from '../../../services/api.config';

describe('NotionDisconnected Component', () => {
  // Mock Chrome API
  let mockChromeTabs: any;

  // Setup mock onRetry function
  const mockOnRetry = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock Chrome tabs API
    mockChromeTabs = {
      create: vi.fn(),
    };
    
    // Setup global chrome mock
    global.chrome = {
      tabs: mockChromeTabs,
    } as any;
    
    // Mock window.close
    global.window.close = vi.fn();
    
    // Mock setTimeout
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the component with correct elements', () => {
    render(<NotionDisconnected onRetry={mockOnRetry} />);
    
    // Check that all main elements are rendered
    expect(screen.getByText('Connect to Notion')).toBeInTheDocument();
    expect(screen.getByText('Please connect your Notion account to access and select pages.')).toBeInTheDocument();
    expect(screen.getByText('Open Settings')).toBeInTheDocument();
    expect(screen.getByText('Check Connection')).toBeInTheDocument();
  });

  it('applies transition style to component', () => {
    const { container } = render(<NotionDisconnected onRetry={mockOnRetry} />);
    
    // Get the container element
    const notionContainer = container.firstChild as HTMLElement;
    
    // Check that it has a transition style
    expect(notionContainer.style.transition).toBe('opacity 0.5s ease-in-out, transform 0.5s ease-out');
    
    // Check initial state properties exist
    expect(notionContainer.style.opacity).toBeDefined();
    expect(notionContainer.style.transform).toBeDefined();
  });

  it('calls setTimeout on mount', () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    render(<NotionDisconnected onRetry={mockOnRetry} />);
    
    // Verify that setTimeout was called with the correct arguments
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
  });

  it('updates visibility state after timeout', () => {
    // Render the component
    const { container } = render(<NotionDisconnected onRetry={mockOnRetry} />);
    
    // Get the container element before state change
    const notionContainer = container.firstChild as HTMLElement;
    expect(notionContainer.style.opacity).toBe('0');
    expect(notionContainer.style.transform).toBe('scale(0.95)');
    
    // Advance timers to trigger the timeout
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    // Verify that state has changed
    expect(notionContainer.style.opacity).toBe('1');
    expect(notionContainer.style.transform).toBe('scale(1)');
  });

  it('opens settings in production environment when settings button is clicked', () => {
    // Set isDevelopment to false (production)
    vi.mocked(apiConfig).isDevelopment = false;
    
    render(<NotionDisconnected onRetry={mockOnRetry} />);
    
    // Find and click settings button
    const settingsButton = screen.getByText('Open Settings');
    fireEvent.click(settingsButton);
    
    // Check that chrome.tabs.create was called with correct URL
    expect(mockChromeTabs.create).toHaveBeenCalledWith({ 
      url: 'https://canvastonotion.io/settings' 
    });
    
    // Check that window.close was called
    expect(window.close).toHaveBeenCalled();
  });
  
  it('opens settings in development environment when settings button is clicked', () => {
    // Set isDevelopment to true
    vi.mocked(apiConfig).isDevelopment = true;
    
    render(<NotionDisconnected onRetry={mockOnRetry} />);
    
    // Find and click settings button
    const settingsButton = screen.getByText('Open Settings');
    fireEvent.click(settingsButton);
    
    // Check that chrome.tabs.create was called with correct URL for development
    expect(mockChromeTabs.create).toHaveBeenCalledWith({ 
      url: 'http://localhost:5173/settings' 
    });
    
    // Check that window.close was called
    expect(window.close).toHaveBeenCalled();
  });

  it('calls onRetry when check connection button is clicked', () => {
    render(<NotionDisconnected onRetry={mockOnRetry} />);
    
    // Find and click check connection button
    const checkConnectionButton = screen.getByText('Check Connection');
    fireEvent.click(checkConnectionButton);
    
    // Check that onRetry was called with correct argument
    expect(mockOnRetry).toHaveBeenCalledWith(false);
  });

  it('cleans up timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const { unmount } = render(<NotionDisconnected onRetry={mockOnRetry} />);
    
    // Unmount component
    unmount();
    
    // Check that clearTimeout was called
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
}); 