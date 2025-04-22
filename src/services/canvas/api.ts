interface Course {
  id: number;
  name: string;
  code: string;
  workflow_state: string;
  created_at: string;
  start_at: string | null;
  end_at: string | null;
  enrollments?: {
    type: string;
    enrollment_state: string;
  }[];
}

interface Assignment {
  id: number;
  name: string;
  description: string | null;
  due_at: string | null;
  points_possible: number;
  courseId: number;
  courseName?: string;
  html_url: string;
  submission_types: string[];
}

export class CanvasApi {
  private baseUrl: string = 'https://canvas.ucsc.edu/api/v1';

  private parseNextLink(linkHeader: string | null): string | null {
    if (!linkHeader) return null;

    const links = linkHeader.split(',').map(part => part.trim());
    for (const link of links) {
      const [urlPart, relPart] = link.split(';').map(part => part.trim());
      if (relPart === 'rel="next"') {
        return urlPart.slice(1, -1); // Remove angle brackets around URL
      }
    }
    return null;
  }

  async getRecentCourses(): Promise<Course[]> {
    let allCourses: any[] = [];
    let url = `${this.baseUrl}/courses?per_page=100`;
    const now = new Date();
    const RECENT_CUTOFF_MONTHS = 4;

    while (url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const pageCourses = await response.json();
      allCourses = allCourses.concat(pageCourses);

      const linkHeader = response.headers.get('Link');
      url = linkHeader ? this.parseNextLink(linkHeader) || '' : '';
    }

    const filteredCourses = allCourses.filter((course: any) => {
      const createdDate = new Date(course.created_at);
      const monthsSinceCreated =
        (now.getFullYear() - createdDate.getFullYear()) * 12 +
        now.getMonth() - createdDate.getMonth();

      const isRecent = monthsSinceCreated <= RECENT_CUTOFF_MONTHS;
      const isAvailable = course.workflow_state === 'available';
      const isStudent = course.enrollments?.some(
        (enr: any) => enr.enrollment_state === 'active' && enr.type === 'student'
      );

      return isRecent && isAvailable && isStudent;
    });

    return filteredCourses;
  }

  async getAllAssignments(courses: Course[]): Promise<Assignment[]> {
    const allAssignments: Assignment[] = [];

    for (const course of courses) {
      try {
        const response = await fetch(`${this.baseUrl}/courses/${course.id}/assignments`);
        if (!response.ok) continue;

        const courseAssignments = await response.json();

        allAssignments.push(
          ...courseAssignments.map((assignment: any) => ({
            ...assignment,
            courseName: course.name,
            courseId: course.id,
          }))
        );
      } catch (err) {
        console.error(`Failed to fetch assignments for course ${course.id}:`, err);
      }
    }

    return allAssignments;
  }

}

// Export a singleton instance
export const canvasApi = new CanvasApi();
