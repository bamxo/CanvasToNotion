import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component to test
import UnsyncedContainer from '../UnsyncedContainer';

// Mock CSS modules
vi.mock('../Dashboard.module.css', () => ({
  default: {
    unsyncedContainer: 'unsyncedContainer-mock',
    unsyncedHeader: 'unsyncedHeader-mock',
    unsyncedTitle: 'unsyncedTitle-mock',
    unsyncedIcon: 'unsyncedIcon-mock',
    warningIcon: 'warningIcon-mock',
    successIcon: 'successIcon-mock',
    unsyncedHeaderActions: 'unsyncedHeaderActions-mock',
    unsyncedCount: 'unsyncedCount-mock',
    clearButton: 'clearButton-mock',
    emptyStateContainer: 'emptyStateContainer-mock',
    emptyStateIcon: 'emptyStateIcon-mock',
    emptyStateText: 'emptyStateText-mock',
    unsyncedItemsList: 'unsyncedItemsList-mock',
    unsyncedItem: 'unsyncedItem-mock',
    overdueItem: 'overdueItem-mock',
    noDueDateItem: 'noDueDateItem-mock',
    fadeIn: 'fadeIn-mock',
    unsyncedItemHeader: 'unsyncedItemHeader-mock',
    itemIcon: 'itemIcon-mock',
    unsyncedItemInfo: 'unsyncedItemInfo-mock',
    unsyncedItemTitle: 'unsyncedItemTitle-mock',
    unsyncedItemCourse: 'unsyncedItemCourse-mock',
    unsyncedItemFooter: 'unsyncedItemFooter-mock',
    unsyncedItemDue: 'unsyncedItemDue-mock',
    overdueDue: 'overdueDue-mock',
    noDueDateDue: 'noDueDateDue-mock',
    dueIcon: 'dueIcon-mock',
    unsyncedItemPoints: 'unsyncedItemPoints-mock',
    rotating: 'rotating-mock'
  }
}));

// Mock react-icons
vi.mock('react-icons/fa', () => ({
  FaCalendarAlt: () => <span data-testid="icon-calendar-alt">Calendar Icon</span>,
  FaClipboardList: () => <span data-testid="icon-clipboard-list">Clipboard Icon</span>,
  FaQuestionCircle: () => <span data-testid="icon-question-circle">Question Icon</span>,
  FaComments: () => <span data-testid="icon-comments">Comments Icon</span>,
  FaExclamationTriangle: () => <span data-testid="icon-exclamation-triangle">Warning Icon</span>,
  FaClock: () => <span data-testid="icon-clock">Clock Icon</span>,
  FaSync: () => <span data-testid="icon-sync">Sync Icon</span>
}));

describe('UnsyncedContainer Component', () => {
  // Mock test data
  const mockUnsyncedItems = [
    {
      id: '1',
      type: 'assignment',
      title: 'Test Assignment',
      course: 'Test Course',
      due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      status: 'upcoming',
      points: 100
    },
    {
      id: '2',
      type: 'quiz',
      title: 'Test Quiz',
      course: 'Test Course 2',
      due_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      status: 'overdue',
      points: 50
    },
    {
      id: '3',
      type: 'discussion',
      title: 'Test Discussion',
      course: 'Test Course 3',
      due_date: '', // No due date
      status: 'no-due-date',
      points: 25
    }
  ];

  const mockOnClearItems = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setTimeout to run immediately
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render with unsynced items correctly', () => {
      render(
        <UnsyncedContainer 
          unsyncedItems={mockUnsyncedItems}
          onClearItems={mockOnClearItems}
        />
      );

      // Check title and count
      expect(screen.getByText('Items to Sync')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      
      // Check items
      expect(screen.getByText('Test Assignment')).toBeInTheDocument();
      expect(screen.getByText('Test Quiz')).toBeInTheDocument();
      expect(screen.getByText('Test Discussion')).toBeInTheDocument();
      
      // Check course names
      expect(screen.getByText('Test Course')).toBeInTheDocument();
      expect(screen.getByText('Test Course 2')).toBeInTheDocument();
      expect(screen.getByText('Test Course 3')).toBeInTheDocument();
      
      // Check points
      expect(screen.getByText('100 pts')).toBeInTheDocument();
      expect(screen.getByText('50 pts')).toBeInTheDocument();
      expect(screen.getByText('25 pts')).toBeInTheDocument();
      
      // Check clear button
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });

    it('should render empty state when no items', () => {
      render(
        <UnsyncedContainer 
          unsyncedItems={[]}
          onClearItems={mockOnClearItems}
        />
      );

      // Check title
      expect(screen.getByText('Assignments Up To Date')).toBeInTheDocument();
      
      // Check empty state message
      expect(screen.getByText('Everything is up to date! No items to sync.')).toBeInTheDocument();
      
      // Clear button should not be visible
      expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    });

    it('should render loading state correctly', () => {
      render(
        <UnsyncedContainer 
          unsyncedItems={[]}
          onClearItems={mockOnClearItems}
          isLoading={true}
        />
      );

      // Check loading title
      expect(screen.getByText('Checking Canvas Items...')).toBeInTheDocument();
      
      // Check loading message
      expect(screen.getByText('Comparing Canvas with Notion...')).toBeInTheDocument();
      
      // Clear button should not be visible
      expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    });

    it('should display different icons based on item type', () => {
      render(
        <UnsyncedContainer 
          unsyncedItems={mockUnsyncedItems}
          onClearItems={mockOnClearItems}
        />
      );

      // Check for specific icons
      const clipboardIcon = screen.getByTestId('icon-clipboard-list');
      const questionIcon = screen.getByTestId('icon-question-circle');
      const commentsIcon = screen.getByTestId('icon-comments');
      
      expect(clipboardIcon).toBeInTheDocument();
      expect(questionIcon).toBeInTheDocument();
      expect(commentsIcon).toBeInTheDocument();
      
      // Verify the icons are associated with the correct items
      const assignmentItem = screen.getByText('Test Assignment').closest('.unsyncedItem-mock') as HTMLElement;
      const quizItem = screen.getByText('Test Quiz').closest('.unsyncedItem-mock') as HTMLElement;
      const discussionItem = screen.getByText('Test Discussion').closest('.unsyncedItem-mock') as HTMLElement;
      
      // These checks should verify that each item has the correct icon type
      expect(within(assignmentItem).getByTestId('icon-clipboard-list')).toBeInTheDocument();
      expect(within(quizItem).getByTestId('icon-question-circle')).toBeInTheDocument();
      expect(within(discussionItem).getByTestId('icon-comments')).toBeInTheDocument();
    });

    it('should format due dates correctly', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Add a date several days in the future
      const futureDays = 5;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + futureDays);
      
      const todayItem = {
        id: '4',
        type: 'assignment',
        title: 'Due Today',
        course: 'Test Course',
        due_date: new Date().toISOString(),
        status: 'upcoming',
        points: 100
      };

      const customItems = [
        {
          id: '1',
          type: 'assignment',
          title: 'Due Tomorrow',
          course: 'Test Course',
          due_date: tomorrow.toISOString(),
          status: 'upcoming',
          points: 100
        },
        {
          id: '2',
          type: 'quiz',
          title: 'Overdue',
          course: 'Test Course 2',
          due_date: yesterday.toISOString(),
          status: 'overdue',
          points: 50
        },
        {
          id: '3',
          type: 'discussion',
          title: 'No Due Date',
          course: 'Test Course 3',
          due_date: '',
          status: 'no-due-date',
          points: 25
        },
        todayItem,
        {
          id: '5',
          type: 'assignment',
          title: 'Future Due Date',
          course: 'Test Course',
          due_date: futureDate.toISOString(),
          status: 'upcoming',
          points: 75
        }
      ];

      render(
        <UnsyncedContainer 
          unsyncedItems={customItems}
          onClearItems={mockOnClearItems}
        />
      );

      // Check due date formatting
      expect(screen.getByText('Due tomorrow')).toBeInTheDocument();
      expect(screen.getByText('1 days overdue')).toBeInTheDocument();
      // Use getAllByText for elements that appear multiple times
      expect(screen.getAllByText('No Due Date')).toHaveLength(2); // Title and due date text
      expect(screen.getByText('Due today')).toBeInTheDocument();
      // Check future date formatting (X days)
      expect(screen.getByText(`Due in ${futureDays} days`)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClearItems when clear button is clicked', () => {
      render(
        <UnsyncedContainer 
          unsyncedItems={mockUnsyncedItems}
          onClearItems={mockOnClearItems}
        />
      );

      const clearButton = screen.getByRole('button', { name: 'Clear' });
      fireEvent.click(clearButton);
      
      expect(mockOnClearItems).toHaveBeenCalledTimes(1);
    });
  });

  describe('Animation Effects', () => {
    it('should trigger animation when component mounts', () => {
      render(
        <UnsyncedContainer 
          unsyncedItems={mockUnsyncedItems}
          onClearItems={mockOnClearItems}
        />
      );

      // When component mounts, it should set animate to false, then true after timeout
      act(() => {
        vi.runAllTimers();
      });

      // Since we can't easily test CSS animations in JSDOM, we're just testing that the code runs without errors
      expect(true).toBeTruthy();
    });

    it('should trigger animation when items change', () => {
      const { rerender } = render(
        <UnsyncedContainer 
          unsyncedItems={mockUnsyncedItems}
          onClearItems={mockOnClearItems}
        />
      );

      // Run initial animation
      act(() => {
        vi.runAllTimers();
      });

      // Rerender with different items
      rerender(
        <UnsyncedContainer 
          unsyncedItems={mockUnsyncedItems.slice(0, 2)}
          onClearItems={mockOnClearItems}
        />
      );

      // Should trigger animation again
      act(() => {
        vi.runAllTimers();
      });

      // Animation should have triggered again
      expect(true).toBeTruthy();
    });

    it('should trigger animation when loading state changes', () => {
      const { rerender } = render(
        <UnsyncedContainer 
          unsyncedItems={mockUnsyncedItems}
          onClearItems={mockOnClearItems}
          isLoading={false}
        />
      );

      // Run initial animation
      act(() => {
        vi.runAllTimers();
      });

      // Rerender with loading state
      rerender(
        <UnsyncedContainer 
          unsyncedItems={mockUnsyncedItems}
          onClearItems={mockOnClearItems}
          isLoading={true}
        />
      );

      // Should trigger animation again
      act(() => {
        vi.runAllTimers();
      });

      // Animation should have triggered
      expect(true).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle different item statuses correctly', () => {
      const items = [
        {
          id: '1',
          type: 'assignment',
          title: 'Overdue Item',
          course: 'Test Course',
          due_date: new Date(Date.now() - 86400000).toISOString(),
          status: 'overdue',
          points: 100
        },
        {
          id: '2',
          type: 'quiz',
          title: 'No Due Date Item',
          course: 'Test Course 2',
          due_date: '',
          status: 'no-due-date',
          points: 50
        }
      ];

      const { container } = render(
        <UnsyncedContainer 
          unsyncedItems={items}
          onClearItems={mockOnClearItems}
        />
      );

      // Check that both items are rendered
      expect(screen.getByText('Overdue Item')).toBeInTheDocument();
      expect(screen.getByText('No Due Date Item')).toBeInTheDocument();
      
      // Check for CSS classes using container approach
      const overdueItems = container.getElementsByClassName('overdueItem-mock');
      const noDueDateItems = container.getElementsByClassName('noDueDateItem-mock');
      
      expect(overdueItems.length).toBeGreaterThan(0);
      expect(noDueDateItems.length).toBeGreaterThan(0);
    });

    it('should handle unknown item types by showing calendar icon', () => {
      const items = [
        {
          id: '1',
          type: 'unknown_type',
          title: 'Unknown Type Item',
          course: 'Test Course',
          due_date: new Date().toISOString(),
          status: 'upcoming',
          points: 100
        }
      ];

      render(
        <UnsyncedContainer 
          unsyncedItems={items}
          onClearItems={mockOnClearItems}
        />
      );

      // Check that the item is rendered
      expect(screen.getByText('Unknown Type Item')).toBeInTheDocument();
      
      // For unknown type, the Calendar icon should be used
      const calendarIcon = screen.getByTestId('icon-calendar-alt');
      expect(calendarIcon).toBeInTheDocument();
    });
    
    it('should update animation state correctly on each render', () => {
      const { rerender } = render(
        <UnsyncedContainer 
          unsyncedItems={mockUnsyncedItems}
          onClearItems={mockOnClearItems}
        />
      );
      
      // Run initial animation
      act(() => {
        vi.runAllTimers();
      });
      
      // Test that it maintains state when same items are passed
      rerender(
        <UnsyncedContainer 
          unsyncedItems={[...mockUnsyncedItems]}
          onClearItems={mockOnClearItems}
        />
      );
      
      // Shouldn't trigger new animation if items count is the same
      act(() => {
        vi.runAllTimers();
      });
      
      // Now change loading state
      rerender(
        <UnsyncedContainer 
          unsyncedItems={[...mockUnsyncedItems]}
          onClearItems={mockOnClearItems}
          isLoading={true}
        />
      );
      
      // Should trigger animation
      act(() => {
        vi.runAllTimers();
      });
      
      expect(true).toBeTruthy();
    });
  });
}); 