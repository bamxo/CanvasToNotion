import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import styles from './PageSelector.module.css';
import AppBar from './AppBar';

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
}

interface PageSelectorProps {
  onPageSelect: (page: NotionPage) => void;
}

const PageSelector: React.FC<PageSelectorProps> = ({ onPageSelect }) => {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    let mounted = true;
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (user?.email) {
        console.log('User email found:', user.email);
        setUserEmail(user.email);
        // Store email in chrome storage
        await chrome.storage.local.set({ userEmail: user.email });
        setIsAuthInitialized(true);
      } else {
        console.log('No user email from auth, checking storage...');
        // If we don't have a user email from auth state, try to get it from storage
        chrome.storage.local.get(['userEmail'], (result) => {
          if (!mounted) return;
          
          if (result.userEmail) {
            console.log('User email found in storage:', result.userEmail);
            setUserEmail(result.userEmail);
            setIsAuthInitialized(true);
          } else {
            console.log('No user email found in storage');
            setError('User email not found. Please log in again.');
            setIsLoading(false);
          }
        });
      }
    });

    // Cleanup auth listener
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Separate effect to handle page fetching once auth is initialized
  useEffect(() => {
    if (!isAuthInitialized || !userEmail) return;

    const fetchPages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching pages for email:', userEmail);

        const response = await axios.get('http://localhost:3000/api/notion/pages', {
          params: { email: userEmail }
        });

        setPages(response.data.pages);
      } catch (err) {
        console.error('Error fetching pages:', err);
        setError('Failed to load pages. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure auth is fully initialized
    const timer = setTimeout(() => {
      fetchPages();
    }, 500);

    return () => clearTimeout(timer);
  }, [isAuthInitialized, userEmail]);

  const handleCreateNewPage = () => {
    // TODO: Implement create new page functionality
    console.log('Create new page clicked');
  };

  const handlePageSelect = (page: NotionPage) => {
    onPageSelect(page);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <AppBar />
        <div className={styles.content}>
          <div className={styles.loadingContainer}>
            Loading pages...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <AppBar />
        <div className={styles.content}>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AppBar />
      
      <div className={styles.content}>
        <div className={styles.headerContainer}>
          <h2 className={styles.title}>Select a Page</h2>
          <p className={styles.subtext}>
            Choose a Notion page to export to. You can switch pages again at any time.
          </p>
        </div>

        <div className={styles.pageList}>
          <button
            className={`${styles.pageItem} ${styles.createPageItem}`}
            onClick={handleCreateNewPage}
          >
            <span className={styles.pageIcon}>+</span>
            <span className={styles.pageTitle}>Create New Page</span>
          </button>
          {pages.map((page: NotionPage) => (
            <button
              key={page.id}
              className={styles.pageItem}
              onClick={() => handlePageSelect(page)}
            >
              {page.icon && <span className={styles.pageIcon}>{page.icon}</span>}
              <span className={styles.pageTitle}>{page.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageSelector; 