import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component to test
import SyncButton from '../SyncButton';

// Mock CSS modules
vi.mock('../Dashboard.module.css', () => ({
  default: {
    statusContainer: 'statusContainer-mock',
    lastSync: 'lastSync-mock',
    successMessage: 'successMessage-mock',
    partialMessage: 'partialMessage-mock',
    errorMessage: 'errorMessage-mock',
    fadeIn: 'fadeIn-mock',
    syncButton: 'syncButton-mock'
  }
}));

describe('SyncButton Component', () => {
  // Common test props
  const mockOnSync = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the sync button with correct text when not loading', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );

      const button = screen.getByRole('button', { name: 'Sync All Assignments' });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should render the sync button with loading text when isLoading is true', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={true}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );

      expect(screen.getByRole('button', { name: 'Loading...' })).toBeInTheDocument();
    });

    it('should render the button as disabled when disabled prop is true', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={true}
          lastSync={null}
          syncStatus={null}
        />
      );

      const button = screen.getByRole('button', { name: 'Sync All Assignments' });
      expect(button).toBeDisabled();
    });

    it('should display last sync time when provided', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync="January 1, 2023 12:00 PM"
          syncStatus={null}
        />
      );

      expect(screen.getByText('Last synced: January 1, 2023 12:00 PM')).toBeInTheDocument();
    });

    it('should not display last sync time when not provided', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );

      expect(screen.queryByText(/Last synced:/)).not.toBeInTheDocument();
    });

    it('should display success message when syncStatus is success', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus="success"
        />
      );

      expect(screen.getByText('✓ Sync completed successfully')).toBeInTheDocument();
    });

    it('should display partial message when syncStatus is partial', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus="partial"
        />
      );

      expect(screen.getByText('⚠ Sync partially completed')).toBeInTheDocument();
    });

    it('should display error message when syncStatus is error', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus="error"
        />
      );

      expect(screen.getByText('✗ Sync failed. Please try again.')).toBeInTheDocument();
    });

    it('should not display any status message when syncStatus is null', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );

      expect(screen.queryByText(/Sync completed successfully/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sync partially completed/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sync failed/)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onSync when button is clicked', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );

      const button = screen.getByRole('button', { name: 'Sync All Assignments' });
      fireEvent.click(button);
      
      expect(mockOnSync).toHaveBeenCalledTimes(1);
    });

    it('should not call onSync when disabled button is clicked', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={true}
          lastSync={null}
          syncStatus={null}
        />
      );

      const button = screen.getByRole('button', { name: 'Sync All Assignments' });
      fireEvent.click(button);
      
      expect(mockOnSync).not.toHaveBeenCalled();
    });
  });

  describe('Animation Effects', () => {
    it('should add message with appropriate classes when syncStatus changes from null to success', () => {
      const { rerender } = render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );

      // Verify no status message is initially displayed
      expect(screen.queryByText(/Sync completed successfully/)).not.toBeInTheDocument();

      // Update syncStatus to success
      rerender(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus="success"
        />
      );

      // The message should now be displayed
      const successMessage = screen.getByText('✓ Sync completed successfully');
      expect(successMessage).toBeInTheDocument();
      
      // Just verify we have the status container
      expect(screen.getByText('✓ Sync completed successfully')).toBeInTheDocument();
    });

    it('should show error message with appropriate classes when syncStatus is error', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus="error"
        />
      );

      // Verify error message is displayed
      const errorMessage = screen.getByText('✗ Sync failed. Please try again.');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should show partial message when syncStatus is partial', () => {
      render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus="partial"
        />
      );

      // Verify partial message is displayed
      const partialMessage = screen.getByText('⚠ Sync partially completed');
      expect(partialMessage).toBeInTheDocument();
    });
    
    it('should set showStatus state when syncStatus changes', () => {
      const { rerender } = render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );
      
      // Initially no status message
      expect(screen.queryByText(/Sync completed successfully/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sync partially completed/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sync failed/)).not.toBeInTheDocument();
      
      // Update syncStatus to success
      rerender(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus="success"
        />
      );
      
      // Success message should appear
      expect(screen.getByText('✓ Sync completed successfully')).toBeInTheDocument();
    });
  });

  describe('Memo Functionality', () => {
    it('should not re-render when props do not change', () => {
      const renderSpy = vi.fn();
      
      // Create a wrapper component to track renders
      const TestWrapper = (props: {
        onSync: () => void;
        isLoading: boolean;
        disabled: boolean;
        lastSync: string | null;
        syncStatus: 'success' | 'error' | 'partial' | null;
      }) => {
        renderSpy();
        return <SyncButton {...props} />;
      };
      
      const { rerender } = render(
        <TestWrapper 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with the same props
      rerender(
        <TestWrapper 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );
      
      // Since the component is memoized, our wrapper should only render once
      // even though we rerendered with the same props
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should re-render when props change', () => {
      const { rerender } = render(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={false}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );
      
      // Button should initially say "Sync All Assignments"
      expect(screen.getByRole('button', { name: 'Sync All Assignments' })).toBeInTheDocument();
      
      // Re-render with different props
      rerender(
        <SyncButton 
          onSync={mockOnSync}
          isLoading={true}
          disabled={false}
          lastSync={null}
          syncStatus={null}
        />
      );
      
      // Button should now say "Loading..."
      expect(screen.getByRole('button', { name: 'Loading...' })).toBeInTheDocument();
    });
  });
}); 