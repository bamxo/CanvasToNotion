/**
 * Dashboard Component
 * 
 * This component displays the main dashboard interface after user authentication.
 * It shows sync status, recent syncs, and provides controls for manual syncing.
 */

import { useState, useEffect, useRef } from 'react'
import styles from './Dashboard.module.css'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import AppBar from './AppBar'
import PageSelector from './PageSelector'
import PageSelectionContainer from './PageSelectionContainer'
import UnsyncedContainer from './UnsyncedContainer'
import SyncButton from './SyncButton'
import { UnsyncedItem, transformCanvasAssignments } from '../utils/assignmentTransformer'
import { isDevelopment, isProduction } from '../../services/api.config'

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  type?: string;
}

interface SyncData {
  pageId: string;
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
  const [isComparing, setIsComparing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | 'partial' | null>(null)
  const [showPageSelector, setShowPageSelector] = useState(false)
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null)
  const [unsyncedItems, setUnsyncedItems] = useState<UnsyncedItem[]>([])

  // Generate array of particles with useRef to avoid re-creation on re-renders
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => (
      <Particle key={i} delay={i * 0.3} />
    ))
  ).current;

  useEffect(() => {
    const auth = getAuth();
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.email);
      if (user?.email) {
        setUserEmail(user.email);
        // Get firebase token when user is authenticated
        if (user.getIdToken) {
          user.getIdToken().then(token => {
            setFirebaseToken(token);
            chrome.storage.local.set({ firebaseToken: token });
          }).catch(error => {
            console.error('Error getting ID token:', error);
          });
        } else {
          console.log('user.getIdToken is not available');
        }
      } else {
        // If we don't have a user email from auth state, try to get it from storage
        chrome.storage.local.get(['userEmail', 'firebaseToken'], (result) => {
          if (result.userEmail) {
            setUserEmail(result.userEmail);
            console.log('Retrieved email from storage:', result.userEmail);
          } else {
            console.log('No email found in storage');
          }
          
          if (result.firebaseToken) {
            setFirebaseToken(result.firebaseToken);
            console.log('Retrieved firebase token from storage');
          } else {
            console.log('No firebase token found in storage');
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

  // New effect to trigger comparison when page is selected and authentication is available
  useEffect(() => {
    if (selectedPage && firebaseToken) {
      compareWithNotion();
    }
  }, [selectedPage, firebaseToken]);

  // Debug log whenever auth or selectedPage changes
  useEffect(() => {
    console.log('Current user email:', userEmail);
    console.log('Selected page:', selectedPage ? {id: selectedPage.id, title: selectedPage.title} : 'None');
    console.log('Firebase token available:', !!firebaseToken);

    // Store email in chrome storage when it changes
    if (userEmail) {
      chrome.storage.local.set({ userEmail });
    }
  }, [userEmail, selectedPage, firebaseToken]);

  // New function to compare Canvas assignments with Notion
  const compareWithNotion = async (): Promise<number> => {
    if (!selectedPage || !firebaseToken) {
      console.log('Cannot compare: missing page or auth token');
      return 0;
    }
    
    try {
      setIsComparing(true);
      
      // Prepare compare data
      const compareData = {
        pageId: selectedPage.id,
      };

      console.log('Sending COMPARE message with data:', compareData);
      
      // Send the compare request to background script
      const response = await chrome.runtime.sendMessage({
        type: 'COMPARE',
        data: compareData
      });
      
      console.log('Compare response:', response);
      
      if (response && response.success && response.data) {
        // Check if we have a compareResult with the comparison data
        if (response.data.compareResult?.comparison) {
          // The compareResult structure has a comparison object with course names as keys
          // Each course has an onlyInCanvas array that contains assignments to sync
          const unsyncedAssignments: any[] = [];
          
          // Iterate through each course in the comparison object
          Object.keys(response.data.compareResult.comparison).forEach(courseName => {
            const courseData = response.data.compareResult.comparison[courseName];
            
            // Add all assignments from onlyInCanvas array
            if (courseData.onlyInCanvas && courseData.onlyInCanvas.length > 0) {
              unsyncedAssignments.push(...courseData.onlyInCanvas);
            }
          });
          
          console.log('Extracted unsynced assignments:', unsyncedAssignments);
          
          if (unsyncedAssignments.length > 0) {
            // Transform the unsynced assignments
            const formattedUnsyncedItems = transformCanvasAssignments(
              unsyncedAssignments,
              response.data.courses || []
            );
            
            console.log('Formatted unsynced items:', formattedUnsyncedItems);
            setUnsyncedItems(formattedUnsyncedItems);
            return formattedUnsyncedItems.length;
          } else {
            console.log('No unsynced assignments found in compareResult');
            setUnsyncedItems([]);
            return 0;
          }
        } else {
          console.log('No comparison data found in compareResult');
          setUnsyncedItems([]);
          return 0;
        }
      } else {
        console.error('Compare failed or returned invalid data:', response);
        setUnsyncedItems([]);
        return 0;
      }
    } catch (error) {
      console.error('Error comparing with Notion:', error);
      setUnsyncedItems([]);
      return 0;
    } finally {
      setIsComparing(false);
    }
  };

  const handleSync = async () => {
    if (!selectedPage || !firebaseToken) {
      console.log('Sync button disabled because:', {
        hasSelectedPage: !!selectedPage,
        hasFirebaseToken: !!firebaseToken
      });
      setSyncStatus('error');
      console.error('Missing required data: page or authentication token');
      return;
    }

    try {
      setIsLoading(true);
      setSyncStatus(null);
      
      // Prepare sync data
      const syncData: SyncData = {
        pageId: selectedPage.id,
      };

      // Update timestamp regardless of final status
      setLastSync(new Date().toLocaleString());

      if (isDevelopment) {
        // Development environment - Use synchronous sync process
        // Send the sync data to background script
        const response = await chrome.runtime.sendMessage({
          type: 'SYNC_TO_NOTION',
          data: syncData
        });
        
        // Store initial sync response status
        let initialSyncStatus: 'success' | 'error' | 'partial' | null = null;
        
        // Check if the response indicates an error
        if (response && response.error) {
          // For error responses, update status immediately
          initialSyncStatus = 'error';
          setSyncStatus('error');
          console.error('Sync error:', response.error);
          setIsLoading(false);
        } else {
          // For successful or partial syncs, we'll verify with compare API
          if (response && response.partial) {
            initialSyncStatus = 'partial';
            console.warn('Partial sync detected, verifying with compare API...');
          } else {
            initialSyncStatus = 'success';
            console.log('Sync appears successful, verifying with compare API...');
          }
          
          // Run compareWithNotion to check for any remaining unsynced assignments
          try {
            const unsyncedCount = await compareWithNotion();
            console.log(`Compare complete. Found ${unsyncedCount} unsynced assignments.`);
            
            // Determine final status based on unsynced items
            if (unsyncedCount > 0) {
              // If we still have unsynced items, mark as partial
              setSyncStatus('partial');
              console.log('Setting status to partial due to remaining unsynced assignments');
            } else {
              // If no unsynced items, use the initial status (success or partial)
              setSyncStatus(initialSyncStatus);
              console.log(`Setting status to ${initialSyncStatus} as no unsynced assignments remain`);
            }
          } catch (compareError) {
            console.error('Error during compare after sync:', compareError);
            // If compare fails but sync appeared successful, still show the initial status
            setSyncStatus(initialSyncStatus);
          } finally {
            setIsLoading(false);
          }
        }
      } else if (isProduction) {
        // Production environment - Use asynchronous sync process with status checking
        // First, run a compare to determine how many assignments need to be synced
        let assignmentCount = 0;
        try {
          assignmentCount = await compareWithNotion();
          console.log(`Found ${assignmentCount} assignments that need to be synced`);
        } catch (error) {
          console.error('Error determining assignment count:', error);
          // Default to 15 attempts if we can't determine the count
          assignmentCount = 0;
        }

        // Then initiate the sync
        const response = await chrome.runtime.sendMessage({
          type: 'SYNC_TO_NOTION',
          data: syncData
        });

        if (response && response.error) {
          // Handle error response
          setSyncStatus('error');
          console.error('Sync error:', response.error);
          setIsLoading(false);
          return;
        }

        // Start checking sync status with exponential backoff
        await checkSyncStatus(assignmentCount);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setIsLoading(false);
    }
  }

  // Function to check sync status with exponential backoff
  const checkSyncStatus = async (assignmentCount: number = 0) => {
    // Ensure we have a firebase token
    if (!firebaseToken) {
      console.error('Cannot check sync status: missing authentication token');
      setSyncStatus('error');
      setIsLoading(false);
      return;
    }
    
    // Calculate appropriate max attempts based on assignment count
    // Adjusted formula to match observed performance: 50 assignments = ~15 attempts
    const baseAttempts = 10;
    const assignmentFactor = Math.ceil(assignmentCount / 10); // Changed from 5 to 10
    const calculatedAttempts = baseAttempts + assignmentFactor;
    const maxAttempts = Math.min(Math.max(calculatedAttempts, 12), 25); // Adjusted min/max
    
    console.log(`Setting max polling attempts to ${maxAttempts} for ${assignmentCount} assignments`);
    
    let delay = 1000; // Start with 1 second delay
    const maxDelay = 10000; // Cap at 10 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        // Fetch the sync status from the Netlify function
        const statusUrl = `https://canvastonotion.netlify.app/.netlify/functions/notion/sync-status`;
        
        console.log(`Checking sync status (attempt ${attempts}/${maxAttempts})...`);
        const response = await fetch(statusUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firebaseToken}`
          }
        });
        const data = await response.json();
        
        console.log('Sync status response:', data);
        
        if (data.success && data.syncStatus) {
          if (data.syncStatus.status === 'complete') {
            console.log('Sync completed successfully');
            
            // Run compareWithNotion to refresh unsynced items
            try {
              const unsyncedCount = await compareWithNotion();
              console.log(`Compare complete. Found ${unsyncedCount} unsynced assignments.`);
              
              // Determine final status based on unsynced items
              if (unsyncedCount > 0) {
                setSyncStatus('partial');
                console.log('Setting status to partial due to remaining unsynced assignments');
              } else {
                setSyncStatus('success');
                console.log('Setting status to success as no unsynced assignments remain');
              }
            } catch (compareError) {
              console.error('Error during compare after sync:', compareError);
              setSyncStatus('success'); // Assume success if compare fails
            }
            
            // Exit the polling loop
            setIsLoading(false);
            return;
          } else if (data.syncStatus.status === 'error') {
            // Handle error status
            console.error('Sync process encountered an error');
            setSyncStatus('error');
            setIsLoading(false);
            return;
          }
          // If status is still 'pending', continue polling
        } else {
          // Invalid response, stop polling
          console.error('Invalid status response:', data);
          setSyncStatus('error');
          setIsLoading(false);
          return;
        }
        
        // Calculate next delay with exponential backoff
        delay = Math.min(delay * 2, maxDelay);
        
        // Add a small random factor to prevent thundering herd problem
        const jitter = Math.random() * 500;
        const totalDelay = delay + jitter;
        
        // For larger assignment counts, reduce the delay slightly to speed up the process
        const adjustedDelay = assignmentCount > 20 ? totalDelay * 0.8 : totalDelay;
        
        console.log(`Waiting ${Math.round(adjustedDelay)}ms before next status check`);
        await new Promise(resolve => setTimeout(resolve, adjustedDelay));
        
      } catch (error) {
        console.error('Error checking sync status:', error);
        setSyncStatus('error');
        setIsLoading(false);
        return;
      }
    }
    
    // If we exceed max attempts, assume partial success
    console.warn(`Exceeded maximum status check attempts (${maxAttempts}) for ${assignmentCount} assignments`);
    setSyncStatus('partial');
    setIsLoading(false);
    
    // Still try to refresh unsynced items
    try {
      await compareWithNotion();
    } catch (error) {
      console.error('Error comparing with Notion after max attempts:', error);
    }
  }

  const handlePageSelect = (page: NotionPage) => {
    console.log('Page selected:', page);
    setSelectedPage(page)
    setShowPageSelector(false)
    // Store selected page in chrome storage
    chrome.storage.local.set({ selectedNotionPage: page, showPageSelector: false });
    // Compare will be triggered by the useEffect
  }

  const handleChangePageClick = () => {
    setShowPageSelector(true);
    setSelectedPage(null);
    // Store the state in chrome.storage.local
    chrome.storage.local.set({ selectedNotionPage: null, showPageSelector: true });
  }

  if (showPageSelector) {
    return <PageSelector onPageSelect={handlePageSelect} />
  }

  // Debug log for button disabled state
  const buttonDisabled = isLoading || !selectedPage || !firebaseToken;
  console.log('Sync button state:', {
    isLoading,
    hasSelectedPage: !!selectedPage,
    hasFirebaseToken: !!firebaseToken,
    isDisabled: buttonDisabled
  });

  return (
    <div className={styles.container}>
      <AppBar />
      {particles}

      <div className={`${styles.content} ${styles.fadeIn}`}>
        <PageSelectionContainer 
          selectedPage={selectedPage}
          onPageSelect={() => setShowPageSelector(true)}
          onChangePage={handleChangePageClick}
        />

        {/* Unsynced Items Section */}
        {selectedPage && firebaseToken && (
          <UnsyncedContainer 
            unsyncedItems={unsyncedItems}
            onClearItems={() => setUnsyncedItems([])}
            isLoading={isComparing}
          />
        )}

        <SyncButton 
          onSync={handleSync}
          isLoading={isLoading}
          disabled={buttonDisabled}
          lastSync={lastSync}
          syncStatus={syncStatus}
        />
      </div>
    </div>
  )
}

export default Dashboard 