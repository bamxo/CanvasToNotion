import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component to test
import PageSelectionContainer from '../PageSelectionContainer';

// Mock react-icons
vi.mock('react-icons/fa', () => ({
  FaBook: () => <span>📚</span>,
  FaFile: () => <span>📄</span>
}));

// Mock CSS modules
vi.mock('../Dashboard.module.css', () => ({
  default: {
    pageSelectionContainer: 'pageSelectionContainer-mock',
    pageSelectionHeader: 'pageSelectionHeader-mock',
    pageSelectionTitle: 'pageSelectionTitle-mock',
    pageIcon: 'pageIcon-mock',
    selectedPage: 'selectedPage-mock',
    pageInfo: 'pageInfo-mock',
    pageTitle: 'pageTitle-mock',
    changePage: 'changePage-mock',
    selectPageButton: 'selectPageButton-mock'
  }
}));

describe('PageSelectionContainer Component', () => {
  // Common test data
  const mockSelectedPage = {
    id: 'page1',
    title: 'Test Page',
    icon: '📘',
    type: 'page'
  };

  const mockOnPageSelect = vi.fn();
  const mockOnChangePage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with correct header', () => {
      render(
        <PageSelectionContainer 
          selectedPage={null} 
          onPageSelect={mockOnPageSelect} 
          onChangePage={mockOnChangePage} 
        />
      );

      expect(screen.getByText('Notion Page')).toBeInTheDocument();
      expect(screen.getByText('📚')).toBeInTheDocument();
    });

    it('should render select button when no page is selected', () => {
      render(
        <PageSelectionContainer 
          selectedPage={null} 
          onPageSelect={mockOnPageSelect} 
          onChangePage={mockOnChangePage} 
        />
      );

      const selectButton = screen.getByRole('button', { name: 'Select Notion Page' });
      expect(selectButton).toBeInTheDocument();
    });

    it('should render selected page info when a page is selected', () => {
      render(
        <PageSelectionContainer 
          selectedPage={mockSelectedPage} 
          onPageSelect={mockOnPageSelect} 
          onChangePage={mockOnChangePage} 
        />
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('📘')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Change Page' })).toBeInTheDocument();
    });

    it('should render default icon when selected page has no icon', () => {
      const pageWithoutIcon = {
        id: 'page2',
        title: 'Page Without Icon'
      };

      render(
        <PageSelectionContainer 
          selectedPage={pageWithoutIcon} 
          onPageSelect={mockOnPageSelect} 
          onChangePage={mockOnChangePage} 
        />
      );

      expect(screen.getByText('Page Without Icon')).toBeInTheDocument();
      expect(screen.getByText('📄')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onPageSelect when select button is clicked', () => {
      render(
        <PageSelectionContainer 
          selectedPage={null} 
          onPageSelect={mockOnPageSelect} 
          onChangePage={mockOnChangePage} 
        />
      );

      const selectButton = screen.getByRole('button', { name: 'Select Notion Page' });
      fireEvent.click(selectButton);
      
      expect(mockOnPageSelect).toHaveBeenCalledTimes(1);
    });

    it('should call onChangePage when change page button is clicked', () => {
      render(
        <PageSelectionContainer 
          selectedPage={mockSelectedPage} 
          onPageSelect={mockOnPageSelect} 
          onChangePage={mockOnChangePage} 
        />
      );

      const changeButton = screen.getByRole('button', { name: 'Change Page' });
      fireEvent.click(changeButton);
      
      expect(mockOnChangePage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle page with minimum properties', () => {
      const minimalPage = {
        id: 'page3',
        title: 'Minimal Page'
      };

      render(
        <PageSelectionContainer 
          selectedPage={minimalPage} 
          onPageSelect={mockOnPageSelect} 
          onChangePage={mockOnChangePage} 
        />
      );

      expect(screen.getByText('Minimal Page')).toBeInTheDocument();
    });
  });
}); 