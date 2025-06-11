import { describe, it, expect } from 'vitest';
import { transformCanvasAssignments } from '../utils/assignmentTransformer';

describe('assignmentTransformer', () => {
  describe('transformCanvasAssignments', () => {
    it('should be defined and callable', () => {
      expect(transformCanvasAssignments).toBeDefined();
      expect(typeof transformCanvasAssignments).toBe('function');
      
      // Test with empty arrays to verify basic functionality
      const result = transformCanvasAssignments([], []);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should transform a basic assignment correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // One week from now
      
      const assignmentsData = [
        {
          id: 123,
          name: 'Math Homework',
          courseId: 456,
          due_at: futureDate.toISOString(),
          points_possible: 100
        }
      ];

      const coursesData = [
        {
          id: 456,
          name: 'Mathematics 101'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '123',
        type: 'assignment',
        title: 'Math Homework',
        course: 'Mathematics 101',
        due_date: futureDate.toISOString(),
        status: 'upcoming',
        points: 100
      });
    });

    it('should detect quiz type from assignment name', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // One week from now
      
      const assignmentsData = [
        {
          id: 1,
          name: 'Quiz Chapter 5',
          courseId: 1,
          due_at: futureDate.toISOString(),
          points_possible: 50
        },
        {
          id: 2,
          name: 'Final Quiz Assessment',
          courseId: 1,
          due_at: futureDate.toISOString(),
          points_possible: 75
        }
      ];

      const coursesData = [
        {
          id: 1,
          name: 'Test Course'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result[0].type).toBe('quiz');
      expect(result[1].type).toBe('quiz');
    });

    it('should detect discussion type from assignment name', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // One week from now
      
      const assignmentsData = [
        {
          id: 1,
          name: 'Discussion Board Post',
          courseId: 1,
          due_at: futureDate.toISOString(),
          points_possible: 25
        },
        {
          id: 2,
          name: 'Weekly Discussion Forum',
          courseId: 1,
          due_at: futureDate.toISOString(),
          points_possible: 30
        }
      ];

      const coursesData = [
        {
          id: 1,
          name: 'Test Course'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result[0].type).toBe('discussion');
      expect(result[1].type).toBe('discussion');
    });

    it('should handle overdue assignments', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const assignmentsData = [
        {
          id: 1,
          name: 'Overdue Assignment',
          courseId: 1,
          due_at: pastDate.toISOString(),
          points_possible: 100
        }
      ];

      const coursesData = [
        {
          id: 1,
          name: 'Test Course'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result[0].status).toBe('overdue');
    });

    it('should handle assignments with no due date', () => {
      const assignmentsData = [
        {
          id: 1,
          name: 'No Due Date Assignment',
          courseId: 1,
          due_at: null,
          points_possible: 100
        }
      ];

      const coursesData = [
        {
          id: 1,
          name: 'Test Course'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result[0].status).toBe('no-due-date');
      expect(result[0].due_date).toBe('');
    });

    it('should handle assignments with undefined due_at', () => {
      const assignmentsData = [
        {
          id: 1,
          name: 'Undefined Due Date Assignment',
          courseId: 1,
          points_possible: 100
        }
      ];

      const coursesData = [
        {
          id: 1,
          name: 'Test Course'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result[0].status).toBe('no-due-date');
      expect(result[0].due_date).toBe('');
    });

    it('should handle missing course data', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // One week from now
      
      const assignmentsData = [
        {
          id: 1,
          name: 'Assignment',
          courseId: 999,
          due_at: futureDate.toISOString(),
          points_possible: 100
        }
      ];

      const coursesData = [
        {
          id: 1,
          name: 'Different Course'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result[0].course).toBe('Course ID: 999');
    });

    it('should handle null courses data', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // One week from now
      
      const assignmentsData = [
        {
          id: 1,
          name: 'Assignment',
          courseId: 1,
          due_at: futureDate.toISOString(),
          points_possible: 100
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, null as any);

      expect(result[0].course).toBe('Course ID: 1');
    });

    it('should handle undefined courses data', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // One week from now
      
      const assignmentsData = [
        {
          id: 1,
          name: 'Assignment',
          courseId: 1,
          due_at: futureDate.toISOString(),
          points_possible: 100
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, undefined as any);

      expect(result[0].course).toBe('Course ID: 1');
    });

    it('should handle missing points_possible', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // One week from now
      
      const assignmentsData = [
        {
          id: 1,
          name: 'Assignment',
          courseId: 1,
          due_at: futureDate.toISOString()
        }
      ];

      const coursesData = [
        {
          id: 1,
          name: 'Test Course'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result[0].points).toBe(0);
    });

    it('should handle null points_possible', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // One week from now
      
      const assignmentsData = [
        {
          id: 1,
          name: 'Assignment',
          courseId: 1,
          due_at: futureDate.toISOString(),
          points_possible: null
        }
      ];

      const coursesData = [
        {
          id: 1,
          name: 'Test Course'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result[0].points).toBe(0);
    });

    it('should handle multiple assignments with mixed types and statuses', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const assignmentsData = [
        {
          id: 1,
          name: 'Quiz on Biology',
          courseId: 1,
          due_at: futureDate.toISOString(),
          points_possible: 50
        },
        {
          id: 2,
          name: 'Discussion Forum Post',
          courseId: 2,
          due_at: pastDate.toISOString(),
          points_possible: 25
        },
        {
          id: 3,
          name: 'Regular Assignment',
          courseId: 1,
          due_at: null,
          points_possible: 100
        }
      ];

      const coursesData = [
        {
          id: 1,
          name: 'Biology 101'
        },
        {
          id: 2,
          name: 'Philosophy 201'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result).toHaveLength(3);
      
      // Quiz - upcoming
      expect(result[0].type).toBe('quiz');
      expect(result[0].status).toBe('upcoming');
      expect(result[0].course).toBe('Biology 101');
      
      // Discussion - overdue
      expect(result[1].type).toBe('discussion');
      expect(result[1].status).toBe('overdue');
      expect(result[1].course).toBe('Philosophy 201');
      
      // Assignment - no due date
      expect(result[2].type).toBe('assignment');
      expect(result[2].status).toBe('no-due-date');
      expect(result[2].course).toBe('Biology 101');
    });

    it('should handle case-insensitive type detection', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // One week from now
      
      const assignmentsData = [
        {
          id: 1,
          name: 'QUIZ Chapter 1',
          courseId: 1,
          due_at: futureDate.toISOString(),
          points_possible: 50
        },
        {
          id: 2,
          name: 'Discussion BOARD',
          courseId: 1,
          due_at: futureDate.toISOString(),
          points_possible: 25
        }
      ];

      const coursesData = [
        {
          id: 1,
          name: 'Test Course'
        }
      ];

      const result = transformCanvasAssignments(assignmentsData, coursesData);

      expect(result[0].type).toBe('quiz');
      expect(result[1].type).toBe('discussion');
    });
  });
}); 