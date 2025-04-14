import { useState } from 'react'
import './App.css'
import { canvasDataApi } from './services/chrome-communication.ts'

function App() {
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
    <>
      <h1>Canvas to Notion</h1>
      <div className="card">
        <button onClick={fetchUserDataAndAssignments} disabled={loading}>
          {loading ? 'Loading...' : 'Get All Assignments'}
        </button>

        {/* 
          You can delete these next lines if you don't want to show the assignments in the 
          popup. It was just to make it visually easier for testing—it still gets logged to console.
        */}

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

        {/* end of delete for showing assignments in popup */}
      </div>

      <p className="read-the-docs">
        Canvas to Notion Extension
      </p>
    </>
  )
}

export default App