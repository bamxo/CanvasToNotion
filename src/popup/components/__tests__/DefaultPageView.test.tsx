import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component to test
import DefaultPageView from '../DefaultPageView';
import * as apiConfig from '../../../services/api.config';

// Mock react-icons
vi.mock('react-icons/fa', () => ({
  FaFile: () => <span data-testid="mock-file-icon">📄</span>,
  FaExclamationCircle: () => <span data-testid="mock-exclamation-icon">⚠️</span>,
  FaCog: () => <span data-testid="mock-cog-icon">⚙️</span>
}));

// Mock CSS modules
vi.mock('../PageSelector.module.css', () => ({
  default: {
    headerContainer: 'header-container-mock',
    title: 'title-mock',
    subtext: 'subtext-mock',
    refreshIndicator: 'refresh-indicator-mock',
    pageList: 'page-list-mock',
    pageItem: 'page-item-mock',
    pageIcon: 'page-icon-mock',
    defaultPageIcon: 'default-page-icon-mock',
    pageTitle: 'page-title-mock',
    notionDisconnectedContainer: 'notion-disconnected-container-mock',
    iconWrapper: 'icon-wrapper-mock',
    disconnectedIcon: 'disconnected-icon-mock',
    disconnectedTitle: 'disconnected-title-mock',
    disconnectedMessage: 'disconnected-message-mock',
    settingsButton: 'settings-button-mock',
    settingsIcon: 'settings-icon-mock',
    defaultPageWrapper: 'default-page-wrapper-mock'
  }
}));

describe('DefaultPageView Component', () => {
  // Common test data
  const mockPages = [
    { id: 'page1', title: 'Page 1' },
    { id: 'page2', title: 'Page 2', icon: '📘' },
    { id: 'page3', title: 'Page 3', type: 'database' }
  ];
  
  const mockOnPageSelect = vi.fn();
  let mockChromeTabs: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock timer functions for animation testing
    vi.useFakeTimers();

    // Mock Chrome tabs API
    mockChromeTabs = {
      create: vi.fn()
    };

    // Set up global chrome mock
    global.chrome = {
      tabs: mockChromeTabs
    } as any;

    // Mock window.close
    global.window.close = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the component with correct title and subtext', () => {
      render(
        <DefaultPageView 
          pages={mockPages} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      expect(screen.getByText('Select a Page')).toBeInTheDocument();
      expect(screen.getByText('Choose a Notion page to export to. You can switch pages again at any time.')).toBeInTheDocument();
    });

    it('should render loading indicator when isLoading is true', () => {
      render(
        <DefaultPageView 
          pages={mockPages} 
          isLoading={true} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });

    it('should not render loading indicator when isLoading is false', () => {
      render(
        <DefaultPageView 
          pages={mockPages} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      expect(screen.queryByText('Refreshing...')).not.toBeInTheDocument();
    });

    it('should render the correct number of page items', () => {
      render(
        <DefaultPageView 
          pages={mockPages} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      // Find all page buttons
      const pageButtons = screen.getAllByRole('button');
      expect(pageButtons).toHaveLength(mockPages.length);
    });

    it('should render page with custom icon when provided', () => {
      render(
        <DefaultPageView 
          pages={mockPages} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      // Check that Page 2 has its custom icon
      expect(screen.getByText('📘')).toBeInTheDocument();
    });

    it('should render default file icon when no custom icon is provided', () => {
      render(
        <DefaultPageView 
          pages={mockPages} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      // Mock file icons should be rendered for pages without custom icons
      const fileIcons = screen.getAllByTestId('mock-file-icon');
      // Two pages without custom icons (Page 1 and Page 3)
      expect(fileIcons).toHaveLength(2);
    });

    it('should render an empty list when no pages are provided', () => {
      render(
        <DefaultPageView 
          pages={[]} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      // No page items should be rendered, but there should be a settings button
      const pageButtons = screen.queryAllByRole('button');
      expect(pageButtons).toHaveLength(1); // There's one "Open Settings" button
      expect(screen.getByText('Open Settings')).toBeInTheDocument();
    });

    it('should render no pages view with expected elements', () => {
      render(
        <DefaultPageView 
          pages={[]} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );
      
      // Check for expected elements in no pages view
      expect(screen.getByText('No Pages Found')).toBeInTheDocument();
      expect(screen.getByText('You need to connect to Notion and select pages to sync with in settings.')).toBeInTheDocument();
      expect(screen.getByTestId('mock-exclamation-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mock-cog-icon')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should start with opacity 0 and scale 0.95', () => {
      render(
        <DefaultPageView 
          pages={mockPages} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      // Get the main container div (first div in the component)
      const container = screen.getByText('Select a Page').parentElement?.parentElement;
      expect(container).toHaveStyle('opacity: 0');
      expect(container).toHaveStyle('transform: scale(0.95)');
    });

    it('should animate to opacity 1 and scale 1 after mounting', () => {
      render(
        <DefaultPageView 
          pages={mockPages} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      // Advance timers to trigger the animation
      act(() => {
        vi.advanceTimersByTime(200); // Advance a bit more to ensure the timeout has been triggered
      });

      // Get the main container div
      const container = screen.getByText('Select a Page').parentElement?.parentElement;
      expect(container).toHaveStyle('opacity: 1');
      expect(container).toHaveStyle('transform: scale(1)');
    });

    it('should apply animation styles to empty state as well', () => {
      // Force reset the timers to ensure clean state
      vi.useRealTimers();
      vi.useFakeTimers();
      
      const { container: renderedContainer } = render(
        <DefaultPageView 
          pages={[]} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );
      
      // The animation style should be applied inline
      // Since the test is having issues with opacity, let's directly check the style attribute
      const noPageContainer = renderedContainer.querySelector('div[style*="opacity"]');
      expect(noPageContainer).toBeTruthy();
      
      // Check that transform scale is applied 
      expect(noPageContainer?.getAttribute('style')).toContain('scale(0.95)');

      // Advance timers and check final state
      act(() => {
        vi.advanceTimersByTime(200);
      });
      
      // After animation
      expect(noPageContainer?.getAttribute('style')).toContain('opacity: 1');
      expect(noPageContainer?.getAttribute('style')).toContain('scale(1)');
    });
  });

  describe('Interactions', () => {
    it('should call onPageSelect with the correct page when a page item is clicked', () => {
      render(
        <DefaultPageView 
          pages={mockPages} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      // Click on the first page
      fireEvent.click(screen.getByText('Page 1'));
      expect(mockOnPageSelect).toHaveBeenCalledWith(mockPages[0]);

      // Click on the second page
      fireEvent.click(screen.getByText('Page 2'));
      expect(mockOnPageSelect).toHaveBeenCalledWith(mockPages[1]);

      // Click on the third page
      fireEvent.click(screen.getByText('Page 3'));
      expect(mockOnPageSelect).toHaveBeenCalledWith(mockPages[2]);

      // Verify onPageSelect was called exactly 3 times
      expect(mockOnPageSelect).toHaveBeenCalledTimes(3);
    });

    it('should handle page selection with various page properties correctly', () => {
      const customPages = [
        { id: 'page1', title: 'Regular Page' },
        { id: 'page2', title: 'Page With Icon', icon: '🌟' },
        { id: 'page3', title: 'Database Page', type: 'database' }
      ];

      render(
        <DefaultPageView 
          pages={customPages} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      // Test selecting a page with icon
      fireEvent.click(screen.getByText('Page With Icon'));
      expect(mockOnPageSelect).toHaveBeenCalledWith(customPages[1]);

      // Test selecting a database page
      fireEvent.click(screen.getByText('Database Page'));
      expect(mockOnPageSelect).toHaveBeenCalledWith(customPages[2]);
    });

    it('should open settings in development environment when Open Settings is clicked', () => {
      // Mock development environment
      vi.spyOn(apiConfig, 'isDevelopment', 'get').mockReturnValue(true);
      
      render(
        <DefaultPageView 
          pages={[]} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      // Click the settings button
      fireEvent.click(screen.getByText('Open Settings'));
      
      // Verify correct URL was used
      expect(mockChromeTabs.create).toHaveBeenCalledWith({ 
        url: 'http://localhost:5173/settings' 
      });
      expect(window.close).toHaveBeenCalled();
    });

    it('should open settings in production environment when Open Settings is clicked', () => {
      // Mock production environment
      vi.spyOn(apiConfig, 'isDevelopment', 'get').mockReturnValue(false);
      
      render(
        <DefaultPageView 
          pages={[]} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      // Click the settings button
      fireEvent.click(screen.getByText('Open Settings'));
      
      // Verify correct URL was used
      expect(mockChromeTabs.create).toHaveBeenCalledWith({ 
        url: 'https://canvastonotion.netlify.app/settings' 
      });
      expect(window.close).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(
        <DefaultPageView 
          pages={mockPages} 
          isLoading={false} 
          onPageSelect={mockOnPageSelect} 
        />
      );

      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
}); 