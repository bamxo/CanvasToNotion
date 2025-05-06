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
import PageSelector from './PageSelector'

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [showPageSelector, setShowPageSelector] = useState(false)
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null)

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

  const handlePageSelect = (page: NotionPage) => {
    setSelectedPage(page)
    setShowPageSelector(false)
  }

  if (showPageSelector) {
    return <PageSelector onPageSelect={handlePageSelect} />
  }

  return (
    <div className={styles.container}>
      <AppBar />

      <div className={styles.content}>
        <div className={styles.pageSelectionContainer}>
          {selectedPage ? (
            <div className={styles.selectedPage}>
              <div className={styles.pageInfo}>
                {selectedPage.icon && <span className={styles.pageIcon}>{selectedPage.icon}</span>}
                <span className={styles.pageTitle}>{selectedPage.title}</span>
              </div>
              <button 
                onClick={() => setShowPageSelector(true)}
                className={styles.changePage}
              >
                Change Page
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowPageSelector(true)}
              className={styles.selectPageButton}
            >
              Select Notion Page
            </button>
          )}
        </div>

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
          disabled={isLoading || !selectedPage}
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