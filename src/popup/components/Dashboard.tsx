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
import { FaCalendarAlt, FaClipboardList, FaQuestionCircle, FaComments, FaExclamationTriangle, FaClock, FaBook, FaFile } from 'react-icons/fa'
import mockUnsyncedItems from '../data/mockUnsyncedItems.json'

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  type?: string;
}

interface SyncData {
  email: string;
  pageId: string;
  courses: any[];
  assignments: any[];
}

interface UnsyncedItem {
  id: string;
  type: string;
  title: string;
  course: string;
  due_date: string;
  status: string;
  points: number;
}

// Particle component
const Particle = ({ delay }: { delay: number }) => {
  const style = {
    left: `${Math.random() * 100}%`,
    animation: `${styles.floatParticle} 6s ease-in infinite`,
    animationDelay: `${delay}s`
  };

  return <div className={styles.particle} style={style} />;
};

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [showPageSelector, setShowPageSelector] = useState(false)
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [unsyncedItems, setUnsyncedItems] = useState<UnsyncedItem[]>(mockUnsyncedItems.unsyncedItems)

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
    chrome.storage.local.get(['selectedNotionPage', 'showPageSelector'], (result) => {
      if (result.showPageSelector) {
        setShowPageSelector(true);
      } else if (result.selectedNotionPage) {
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
      
      // Clear unsynced items after successful sync (in real implementation, this would be updated based on actual sync results)
      setUnsyncedItems([])
    } catch (error) {
      setSyncStatus('error')
      console.error('Sync failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  }
  
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <FaClipboardList className={styles.itemIcon} />;
      case 'quiz':
        return <FaQuestionCircle className={styles.itemIcon} />;
      case 'discussion':
        return <FaComments className={styles.itemIcon} />;
      default:
        return <FaCalendarAlt className={styles.itemIcon} />;
    }
  };

  const handlePageSelect = (page: NotionPage) => {
    console.log('Page selected:', page);
    setSelectedPage(page)
    setShowPageSelector(false)
    // Store selected page in chrome storage
    chrome.storage.local.set({ selectedNotionPage: page, showPageSelector: false });
  }

  const handleChangePageClick = () => {
    setShowPageSelector(true);
    setSelectedPage(null);
    // Store the state in chrome.storage.local
    chrome.storage.local.set({ selectedNotionPage: null, showPageSelector: true });
  }

  // Generate array of particles
  const particles = Array.from({ length: 20 }, (_, i) => (
    <Particle key={i} delay={i * 0.3} />
  ));

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
      {particles}

      <div className={styles.content}>
        <div className={styles.pageSelectionContainer}>
          <div className={styles.pageSelectionHeader}>
            <h2 className={styles.pageSelectionTitle}>
              <FaBook className={styles.pageIcon} />
              Notion Page
            </h2>
          </div>
          {selectedPage ? (
            <div className={styles.selectedPage}>
              <div className={styles.pageInfo}>
                {selectedPage.icon ? (
                  <span className={styles.pageIcon}>{selectedPage.icon}</span>
                ) : (
                  <FaFile className={styles.pageIcon} />
                )}
                <span className={styles.pageTitle}>{selectedPage.title}</span>
              </div>
              <button 
                onClick={handleChangePageClick}
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

        {/* Unsynced Items Section */}
        {selectedPage && (
          <div className={styles.unsyncedContainer}>
            <div className={styles.unsyncedHeader}>
              <h2 className={styles.unsyncedTitle}>
                {unsyncedItems.length > 0 ? (
                  <FaExclamationTriangle className={`${styles.unsyncedIcon} ${styles.warningIcon}`} />
                ) : (
                  <FaCalendarAlt className={`${styles.unsyncedIcon} ${styles.successIcon}`} />
                )}
                {unsyncedItems.length > 0 ? 'Items to Sync' : 'Assignments Up To Date'}
              </h2>
              <div className={styles.unsyncedHeaderActions}>
                {unsyncedItems.length > 0 ? (
                  <>
                    <span className={styles.unsyncedCount}>{unsyncedItems.length}</span>
                    <button 
                      onClick={() => setUnsyncedItems([])} 
                      className={styles.clearButton}
                      title="Clear all items (testing only)"
                    >
                      Clear
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            
            {unsyncedItems.length > 0 ? (
              <div className={styles.unsyncedItemsList}>
                {unsyncedItems.map((item) => (
                  <div key={item.id} className={`${styles.unsyncedItem} ${item.status === 'overdue' ? styles.overdueItem : ''}`}>
                    <div className={styles.unsyncedItemHeader}>
                      {getItemIcon(item.type)}
                      <div className={styles.unsyncedItemInfo}>
                        <h3 className={styles.unsyncedItemTitle}>{item.title}</h3>
                        <p className={styles.unsyncedItemCourse}>{item.course}</p>
                      </div>
                    </div>
                    <div className={styles.unsyncedItemFooter}>
                      <span className={`${styles.unsyncedItemDue} ${item.status === 'overdue' ? styles.overdueDue : ''}`}>
                        <FaClock className={styles.dueIcon} />
                        {formatDueDate(item.due_date)}
                      </span>
                      <span className={styles.unsyncedItemPoints}>{item.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyStateContainer}>
                <FaCalendarAlt className={styles.emptyStateIcon} />
                <p className={styles.emptyStateText}>Everything is up to date! No items to sync.</p>
              </div>
            )}
          </div>
        )}

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
          {isLoading ? 'Loading...' : 'Sync All Assignments'}
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