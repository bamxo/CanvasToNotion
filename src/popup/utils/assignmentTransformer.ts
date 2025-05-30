/**
 * Utility functions to transform Canvas API data into formats needed by the UI components
 */

export interface UnsyncedItem {
  id: string;
  type: string;
  title: string;
  course: string;
  due_date: string;
  status: string;
  points: number;
}

/**
 * Transforms Canvas API assignment data into the format needed by the UnsyncedContainer component
 * 
 * @param assignmentsData - Raw Canvas assignments data
 * @param coursesData - Raw Canvas courses data (needed to lookup course names)
 * @returns Array of UnsyncedItem objects formatted for display
 */
export function transformCanvasAssignments(
  assignmentsData: any[],
  coursesData: any[]
): UnsyncedItem[] {
  return assignmentsData.map((assignment: any) => {
    // Determine the type based on assignment name
    let type = 'assignment';
    const lowerCaseName = assignment.name.toLowerCase();
    if (lowerCaseName.includes('quiz')) {
      type = 'quiz';
    } else if (lowerCaseName.includes('discussion')) {
      type = 'discussion';
    }
    
    // Determine status based on due date
    let status = 'upcoming';
    if (assignment.due_at) {
      const dueDate = new Date(assignment.due_at);
      const now = new Date();
      if (dueDate < now) {
        status = 'overdue';
      }
    } else {
      // Special status for items with no due date
      status = 'no-due-date';
    }
    
    // Find course name from courses array
    let courseName = `Course ID: ${assignment.courseId}`;
    if (coursesData) {
      const course = coursesData.find((c: any) => c.id === assignment.courseId);
      if (course) {
        courseName = course.name;
      }
    }
    
    return {
      id: assignment.id.toString(),
      type,
      title: assignment.name,
      course: courseName,
      due_date: assignment.due_at || '',
      status,
      points: assignment.points_possible || 0
    };
  });
} 