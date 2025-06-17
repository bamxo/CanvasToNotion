interface Course {
  id: number;
  name: string;
  code: string;
  workflow_state: string;
}

interface Assignment {
  id: number;
  name: string;
  description: string | null;
  due_at: string | null;
  points_possible: number;
  courseId: number;
  courseName: string;
  html_url: string;
}

import { CanvasInfo, extractCanvasInfo } from './detection';

export class CanvasApi {
  private cachedBaseUrl: string | null = null;



  /**
   * Gets the Canvas base URL from the current active tab
   */
  private async getCanvasBaseUrl(): Promise<string> {
    // Check if we have a cached URL first
    if (this.cachedBaseUrl) {
      return this.cachedBaseUrl;
    }

    // Try to get from storage first
    const storedUrl = await this.getStoredCanvasUrl();
    if (storedUrl) {
      this.cachedBaseUrl = storedUrl;
      return storedUrl;
    }

    // If not in storage, detect from current tab
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0]?.url;
        if (!currentUrl) {
          reject(new Error('No active tab found'));
          return;
        }

        const canvasInfo = extractCanvasInfo(currentUrl);
        
        if (!canvasInfo || !canvasInfo.isCanvas || !canvasInfo.apiUrl) {
          reject(new Error('Current tab is not a Canvas page'));
          return;
        }

        console.log('Detected Canvas instance:', canvasInfo);
        
        // Cache the URL and store in chrome storage
        this.cachedBaseUrl = canvasInfo.apiUrl;
        chrome.storage.local.set({ 
          canvasBaseUrl: canvasInfo.apiUrl,
          canvasInfo: canvasInfo,
          currentCanvasUrl: currentUrl 
        });
        
        resolve(canvasInfo.apiUrl);
      });
    });
  }

  /**
   * Gets stored Canvas URL from chrome storage
   */
  private async getStoredCanvasUrl(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['canvasBaseUrl'], (result) => {
        resolve(result.canvasBaseUrl || null);
      });
    });
  }

  /**
   * Validates that the Canvas API is accessible
   */
  private async validateCanvasApi(baseUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}/courses?per_page=1`);
      return response.ok || response.status === 401; // 401 is OK, just means we need auth
    } catch (error) {
      console.error('Canvas API validation failed:', error);
      return false;
    }
  }

  /**
   * Clears cached Canvas URL (useful for switching between different Canvas instances)
   */
  public clearCache(): void {
    this.cachedBaseUrl = null;
    chrome.storage.local.remove(['canvasBaseUrl', 'canvasInfo', 'currentCanvasUrl']);
  }

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

  /**
   * Gets the selected term type from storage
   */
  private async getSelectedTerm(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['selectedTerm'], (result) => {
        resolve(result.selectedTerm || 'quarter'); // Default to quarter
      });
    });
  }

  /**
   * Gets the current term name based on the selected term type and current date
   */
  private getCurrentTermName(termType: string): string {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11

    if (termType === 'quarter') {
      if (currentMonth >= 9 && currentMonth <= 12) {
        return `fall ${currentYear}`;
      } else if (currentMonth >= 1 && currentMonth <= 3) {
        return `winter ${currentYear}`;
      } else if (currentMonth >= 3 && currentMonth <= 6) {
        return `spring ${currentYear}`;
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        return `summer ${currentYear}`;
      }
    } else if (termType === 'semester') {
      if (currentMonth >= 8 && currentMonth <= 12) {
        return `fall ${currentYear}`;
      } else if (currentMonth >= 1 && currentMonth <= 5) {
        return `spring ${currentYear}`;
      } else if (currentMonth >= 5 && currentMonth <= 8) {
        return `summer ${currentYear}`;
      }
    }

    return `fall ${currentYear}`; // Default fallback
  }

  /**
   * Checks if a course matches the current term based on term name
   */
  private isCurrentTermCourse(course: any, termType: string): boolean {
    if (!course.term?.name) return false;

    const termName = course.term.name.toLowerCase();
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = new Date().getMonth() + 1;

    let expectedTerms: string[] = [];

    if (termType === 'quarter') {
      if (currentMonth >= 9 && currentMonth <= 12) {
        expectedTerms = ['fall', currentYear];
      } else if (currentMonth >= 1 && currentMonth <= 3) {
        expectedTerms = ['winter', currentYear];
      } else if (currentMonth >= 3 && currentMonth <= 6) {
        expectedTerms = ['spring', currentYear];
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        expectedTerms = ['summer', currentYear];
      }
    } else if (termType === 'semester') {
      if (currentMonth >= 8 && currentMonth <= 12) {
        expectedTerms = ['fall', currentYear];
      } else if (currentMonth >= 1 && currentMonth <= 5) {
        expectedTerms = ['spring', currentYear];
      } else if (currentMonth >= 5 && currentMonth <= 8) {
        expectedTerms = ['summer', currentYear];
      }
    }

    // Check if both the term name and year are present in the term name string
    return expectedTerms.every(term => termName.includes(term));
  }

  async getRecentCourses(): Promise<Course[]> {
    try {
      const baseUrl = await this.getCanvasBaseUrl();
      console.log('Using Canvas API base URL:', baseUrl);

      // Validate the API is accessible
      const isValid = await this.validateCanvasApi(baseUrl);
      if (!isValid) {
        throw new Error('Canvas API is not accessible. Please make sure you are logged into Canvas.');
      }

      // Get the selected term type from storage
      const selectedTerm = await this.getSelectedTerm();
      console.log('Selected term type:', selectedTerm);

      let allCourses: any[] = [];
      let url = `${baseUrl}/courses?per_page=100&include[]=term`;
      const now = new Date();
      const RECENT_CUTOFF_MONTHS = selectedTerm === 'semester' ? 6 : 4;

      while (url) {
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Canvas authentication required. Please log into Canvas first.');
          }
          throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
        }

        const pageCourses = await response.json();
        console.log('Fetched courses page:', pageCourses.length, 'courses');
        allCourses = allCourses.concat(pageCourses);

        const linkHeader = response.headers.get('Link');
        url = linkHeader ? this.parseNextLink(linkHeader) || '' : '';
      }

      // First, try filtering by creation date
      let filteredCourses = allCourses.filter((course: any) => {
        const createdDate = new Date(course.created_at);
        const monthsSinceCreated =
          (now.getFullYear() - createdDate.getFullYear()) * 12 +
          now.getMonth() - createdDate.getMonth();

        const isRecent = monthsSinceCreated <= RECENT_CUTOFF_MONTHS;
        const isAvailable = course.workflow_state === 'available';
        const isStudent = course.enrollments?.some(
          (enr: any) => enr.enrollment_state === 'active' && enr.type === 'student'
        );

        // Debug logging for each course
        // console.log(`Course: ${course.name}`);
        // console.log(`  Created: ${course.created_at} (${monthsSinceCreated} months ago)`);
        // console.log(`  Start: ${course.start_at}`);
        // console.log(`  End: ${course.end_at}`);
        // console.log(`  Term name:`, course.term?.name);
        // console.log(`  Term ID:`, course.term?.id);
        // console.log(`  Workflow State: ${course.workflow_state}`);
        // console.log(`  Enrollments:`, course.enrollments);
        // console.log(`  isRecent: ${isRecent}, isAvailable: ${isAvailable}, isStudent: ${isStudent}`);
        // console.log(`  Passes filter: ${isRecent && isAvailable && isStudent}`);
        // console.log('---');

        return isRecent && isAvailable && isStudent;
      });

      console.log(`Filtered to ${filteredCourses.length} recent courses from ${allCourses.length} total using creation date`);

      // If no courses found using creation date, try filtering by current term
      if (filteredCourses.length === 0) {
        console.log('No courses found using creation date filter, trying current term filter...');
        
        filteredCourses = allCourses.filter((course: any) => {
          const isAvailable = course.workflow_state === 'available';
          const isStudent = course.enrollments?.some(
            (enr: any) => enr.enrollment_state === 'active' && enr.type === 'student'
          );
          const isCurrentTerm = this.isCurrentTermCourse(course, selectedTerm);

          console.log(`Course: ${course.name}`);
          console.log(`  Term name:`, course.term?.name);
          console.log(`  isAvailable: ${isAvailable}, isStudent: ${isStudent}, isCurrentTerm: ${isCurrentTerm}`);
          console.log(`  Passes term filter: ${isAvailable && isStudent && isCurrentTerm}`);
          console.log('---');

          return isAvailable && isStudent && isCurrentTerm;
        });

        console.log(`Filtered to ${filteredCourses.length} current term courses from ${allCourses.length} total`);
      }

      // Only return the fields we need
      return filteredCourses.map(course => ({
        id: course.id,
        name: course.name,
        code: course.course_code || '',
        workflow_state: course.workflow_state
      }));
    } catch (error) {
      console.error('Error fetching Canvas courses:', error);
      throw error;
    }
  }

  async getAllAssignments(courses: Course[]): Promise<Assignment[]> {
    try {
      const baseUrl = await this.getCanvasBaseUrl();
      const allAssignments: Assignment[] = [];

      console.log(`Fetching assignments for ${courses.length} courses`);

      for (const course of courses) {
        try {
          const response = await fetch(`${baseUrl}/courses/${course.id}/assignments?per_page=100`);
          if (!response.ok) {
            console.warn(`Failed to fetch assignments for course ${course.id}: ${response.status}`);
            continue;
          }

          const courseAssignments = await response.json();
          console.log(`Fetched ${courseAssignments.length} assignments for course: ${course.name}`);

          // Only add the fields we need
          const formattedAssignments = courseAssignments.map((assignment: any) => ({
            id: assignment.id,
            name: assignment.name,
            description: this.stripHtmlTags(assignment.description),
            due_at: assignment.due_at,
            points_possible: assignment.points_possible,
            courseId: course.id,
            courseName: course.name,
            html_url: assignment.html_url
          }));

          allAssignments.push(...formattedAssignments);
        } catch (err) {
          console.error(`Failed to fetch assignments for course ${course.id}:`, err);
        }
      }

      console.log(`Total assignments fetched: ${allAssignments.length}`);
      return allAssignments;
    } catch (error) {
      console.error('Error fetching Canvas assignments:', error);
      throw error;
    }
  }

  // Helper function to strip HTML tags from text
  private stripHtmlTags(html: string | null): string | null {
    if (!html) return null;
    
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with spaces
      .replace(/&amp;/g, '&')   // Replace &amp; with &
      .replace(/&lt;/g, '<')    // Replace &lt; with 
      .replace(/&gt;/g, '>')    // Replace &gt; with >
      .replace(/&quot;/g, '"')  // Replace &quot; with "
      .replace(/&#39;/g, "'")   // Replace &#39; with '
      .trim();                  // Trim whitespace
  }
}

// Export a singleton instance
export const canvasApi = new CanvasApi();