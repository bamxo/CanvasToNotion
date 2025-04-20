/**
 * Dashboard Component
 * 
 * This component displays the main dashboard interface after user authentication.
 * It shows sync status, recent syncs, and provides controls for manual syncing.
 */

import { useState } from 'react'
import styles from './Dashboard.module.css'
import { canvasDataApi } from '../../services/chrome-communication'
import AppBar from './AppBar'

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])

  const handleSync = async () => {
    try {
      setIsLoading(true)
      setSyncStatus(null)
      
      // Fetch courses and assignments using the canvasDataApi
      const { courses: fetchedCourses, assignments: fetchedAssignments } = await canvasDataApi.fetchAll()
      
      setCourses(fetchedCourses)
      setAssignments(fetchedAssignments)
      setSyncStatus('success')
      setLastSync(new Date().toLocaleString())
    } catch (error) {
      setSyncStatus('error')
      console.error('Sync failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    console.log('Attempting to logout...');
    // Use chrome.storage to manage guest mode state
    chrome.storage.local.set({ isGuestMode: false }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving logout state:', chrome.runtime.lastError);
      } else {
        console.log('Logout state saved successfully');
        // Also send message for immediate UI update
        chrome.runtime.sendMessage({ type: 'LOGOUT' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending logout message:', chrome.runtime.lastError);
          } else {
            console.log('Logout message sent successfully');
          }
        });
      }
    });
  }

  const handleSettings = () => {
    // TODO: Implement settings logic
  }

  return (
    <div className={styles.container}>
      <AppBar 
        onSettingsClick={handleSettings}
        onLogoutClick={handleLogout}
      />

      <div className={styles.content}>
        <div className={styles.statusContainer}>
          {lastSync && (
            <p className={styles.lastSync}>
              Last synced: {lastSync}
            </p>
          )}
          {syncStatus === 'success' && (
            <div className={styles.successMessage}>
              ✓ Sync completed successfully
            </div>
          )}
          {syncStatus === 'error' && (
            <div className={styles.errorMessage}>
              ✗ Sync failed. Please try again.
            </div>
          )}
        </div>

        <button 
          onClick={handleSync} 
          disabled={isLoading}
          className={styles.syncButton}
        >
          {isLoading ? 'Loading...' : 'Get All Assignments'}
        </button>

        {courses.length > 0 && (
          <div className={styles.dataSection}>
            <h2 className={styles.sectionTitle}>Current Courses</h2>
            <div className={styles.courseList}>
              {courses.map(course => (
                <div key={course.id} className={styles.courseItem}>
                  {course.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {assignments.length > 0 && (
          <div className={styles.dataSection}>
            <h2 className={styles.sectionTitle}>Assignments</h2>
            <div className={styles.assignmentList}>
              {assignments.map((assignment) => (
                <div key={assignment.id} className={styles.assignmentItem}>
                  <h3 className={styles.assignmentTitle}>{assignment.name}</h3>
                  <p className={styles.assignmentDetail}>
                    <strong>Course:</strong> {assignment.courseName}
                  </p>
                  <p className={styles.assignmentDetail}>
                    <strong>Due:</strong> {assignment.due_at || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard 