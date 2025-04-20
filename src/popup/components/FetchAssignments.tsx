import { useState } from 'react'
import { canvasDataApi } from '../../services/chrome-communication'

const FetchAssignments = () => {
  const [userData, setUserData] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserDataAndAssignments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use our backend service to fetch data
      const { courses, assignments } = await canvasDataApi.fetchAll()
      
      setUserData(courses)
      setAssignments(assignments)
      console.log('Courses:', courses)
      console.log('Assignments:', assignments)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch courses or assignments.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={fetchUserDataAndAssignments} disabled={loading}>
        {loading ? 'Loading...' : 'Get All Assignments'}
      </button>

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
  )
}

export default FetchAssignments 