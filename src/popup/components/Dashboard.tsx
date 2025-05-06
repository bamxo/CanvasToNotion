/**
 * Dashboard Component
 * 
 * This component displays the main dashboard interface after user authentication.
 * It shows sync status, recent syncs, and provides controls for manual syncing.
 */

import { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'
import { canvasDataApi } from '../../services/chrome-communication'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import AppBar from './AppBar'
import PageSelector from './PageSelector'

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
}

interface SyncData {
  email: string;
  pageId: string;
  courses: any[];
  assignments: any[];
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [showPageSelector, setShowPageSelector] = useState(false)
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth();
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.email);
      if (user?.email) {
        setUserEmail(user.email);
      } else {
        // If we don't have a user email from auth state, try to get it from storage
        chrome.storage.local.get(['userEmail'], (result) => {
          if (result.userEmail) {
            setUserEmail(result.userEmail);
            console.log('Retrieved email from storage:', result.userEmail);
          } else {
            console.log('No email found in storage');
          }
        });
      }
    });

    // Check if we have a stored page selection
    chrome.storage.local.get(['selectedNotionPage'], (result) => {
      if (result.selectedNotionPage) {
        setSelectedPage(result.selectedNotionPage);
      }
    });

    // Cleanup auth listener
    return () => unsubscribe();
  }, []);

  // Debug log whenever email or selectedPage changes
  useEffect(() => {
    console.log('Current user email:', userEmail);
    console.log('Selected page:', selectedPage ? {id: selectedPage.id, title: selectedPage.title} : 'None');

    // Store email in chrome storage when it changes
    if (userEmail) {
      chrome.storage.local.set({ userEmail });
    }
  }, [userEmail, selectedPage]);

  const handleSync = async () => {
    if (!selectedPage || !userEmail) {
      console.log('Sync button disabled because:', {
        hasSelectedPage: !!selectedPage,
        hasUserEmail: !!userEmail
      });
      setSyncStatus('error');
      console.error('Missing required data: page or user email');
      return;
    }

    try {
      setIsLoading(true)
      setSyncStatus(null)
      
      // Fetch courses and assignments using the canvasDataApi
      const { courses: fetchedCourses, assignments: fetchedAssignments } = await canvasDataApi.fetchAll()
      
      // Prepare sync data
      const syncData: SyncData = {
        email: userEmail,
        pageId: selectedPage.id,
        courses: fetchedCourses,
        assignments: fetchedAssignments
      };

      // Store the fetched data
      setCourses(fetchedCourses)
      setAssignments(fetchedAssignments)

      // Send the sync data to background script
      await chrome.runtime.sendMessage({
        type: 'SYNC_TO_NOTION',
        data: syncData
      });
      
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
    console.log('Page selected:', page);
    setSelectedPage(page)
    setShowPageSelector(false)
    // Store selected page in chrome storage
    chrome.storage.local.set({ selectedNotionPage: page });
  }

  if (showPageSelector) {
    return <PageSelector onPageSelect={handlePageSelect} />
  }

  // Debug log for button disabled state
  const buttonDisabled = isLoading || !selectedPage || !userEmail;
  console.log('Sync button state:', {
    isLoading,
    hasSelectedPage: !!selectedPage,
    hasUserEmail: !!userEmail,
    isDisabled: buttonDisabled
  });

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
          disabled={buttonDisabled}
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