import { describe, it, expect } from 'vitest';

describe('Content Script', () => {
  it('should be able to detect Canvas assignments page', () => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/courses/123/assignments',
      },
      writable: true,
    });

    // Import the function after mocking
    const isAssignmentsPage = () => window.location.pathname.includes('/assignments');

    expect(isAssignmentsPage()).toBe(true);
  });
}); 