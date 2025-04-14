import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const parseNextLink = (linkHeader: string): string | null => {
    const links = linkHeader.split(',').map(part => part.trim());
    for (const link of links) {
      const [urlPart, relPart] = link.split(';').map(part => part.trim());
      if (relPart === 'rel="next"') {
        return urlPart.slice(1, -1); // Remove angle brackets around URL
      }
    }
    return null;
  };

  const [userData, setUserData] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDataAndAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      setAssignments([]);
      setUserData([]);

      let allCourses: any[] = [];
      let url = 'https://canvas.ucsc.edu/api/v1/courses?per_page=100';
      const now = new Date();
      const RECENT_CUTOFF_MONTHS = 4;

      // Fetch all paginated course results
      while (url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const pageCourses = await response.json();
        allCourses = allCourses.concat(pageCourses);
        const linkHeader = response.headers.get('Link');
        url = linkHeader ? parseNextLink(linkHeader) || '' : '';
      }

      // Filter recent student-enrolled courses
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

      setUserData(filteredCourses);
      console.log('Filtered courses:', filteredCourses);

      // Fetch assignments for each filtered course
      const allAssignments: any[] = [];
      for (const course of filteredCourses) {
        const response = await fetch(`https://canvas.ucsc.edu/api/v1/courses/${course.id}/assignments`);
        if (!response.ok) continue; // skip failed fetches
        const courseAssignments = await response.json();
        allAssignments.push(
          ...courseAssignments.map((assignment: any) => ({
            ...assignment,
            courseName: course.name,
            courseId: course.id,
          }))
        );
      }

      setAssignments(allAssignments);
      console.log('All assignments:', allAssignments);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch courses or assignments.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>Canvas to Notion</h1>

      <div className="actions">
        <button onClick={fetchUserDataAndAssignments} disabled={loading}>
          {loading ? 'Loading...' : 'Get All Assignments'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {userData.length > 0 && (
        <div className="user-data">
          <h2>Current Courses</h2>
          <pre>{JSON.stringify(userData.map(c => c.name), null, 2)}</pre>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="assignments">
          <h2>All Assignments</h2>
          <ul>
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                <h3>{assignment.name}</h3>
                <p><strong>Course:</strong> {assignment.courseName}</p>
                <div dangerouslySetInnerHTML={{ __html: assignment.description || '' }} />
                <p><strong>Due:</strong> {assignment.due_at || 'N/A'}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
