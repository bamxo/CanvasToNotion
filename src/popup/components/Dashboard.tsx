/**
 * Dashboard Component
 * 
 * This component displays the main dashboard interface after user authentication.
 * It shows sync status, recent syncs, and provides controls for manual syncing.
 */

import { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import AppBar from './AppBar'
import PageSelector from './PageSelector'
import PageSelectionContainer from './PageSelectionContainer'
import UnsyncedContainer from './UnsyncedContainer'
import SyncButton from './SyncButton'
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
      
      
      // Prepare sync data
      const syncData: SyncData = {
        email: userEmail,
        pageId: selectedPage.id,
      };

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
        <PageSelectionContainer 
          selectedPage={selectedPage}
          onPageSelect={() => setShowPageSelector(true)}
          onChangePage={handleChangePageClick}
        />

        {/* Unsynced Items Section */}
        {selectedPage && (
          <UnsyncedContainer 
            unsyncedItems={unsyncedItems}
            onClearItems={() => setUnsyncedItems([])}
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