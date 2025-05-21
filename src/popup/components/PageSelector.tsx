import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { FaFile } from 'react-icons/fa';
import styles from './PageSelector.module.css';
import AppBar from './AppBar';

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  type?: string;
}

interface PageSelectorProps {
  onPageSelect: (page: NotionPage) => void;
}

// Cache for storing pages data
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const pagesCache = {
  data: null as NotionPage[] | null,
  timestamp: 0,
  isValid: function() {
    return this.data && (Date.now() - this.timestamp < CACHE_EXPIRY);
  }
};

// Particle component
const Particle = ({ delay }: { delay: number }) => {
  const style = {
    left: `${Math.random() * 100}%`,
    animation: `${styles.floatParticle} 6s ease-in infinite`,
    animationDelay: `${delay}s`
  };

  return <div className={styles.particle} style={style} />;
};

const PageSelector: React.FC<PageSelectorProps> = ({ onPageSelect }) => {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const maxAutoRetries = 3;
  const autoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchPages = async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && pagesCache.isValid()) {
      setPages(pagesCache.data as NotionPage[]);
      setIsLoading(false);
      return;
    }
    
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user?.email) {
        throw new Error('User email not found');
      }

      const response = await axios.get('http://localhost:3000/api/notion/pages', {
        params: { email: user.email },
        signal: abortControllerRef.current.signal,
        timeout: 5000 // Add timeout to prevent hanging requests
      });

      // Update cache
      pagesCache.data = response.data.pages;
      pagesCache.timestamp = Date.now();
      
      setPages(response.data.pages);
      setAutoRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      // Don't show error if request was aborted intentionally
      if (axios.isCancel(err)) {
        console.log('Request canceled:', err.message);
        return;
      }
      
      console.error('Error fetching pages:', err);
      setError('Failed to load pages. Please try again later.');
      
      // Schedule auto retry if we haven't exceeded max attempts
      if (autoRetryCount < maxAutoRetries) {
        const retryDelay = Math.min(500 * (autoRetryCount + 1), 2000); // Exponential backoff with cap
        console.log(`Auto-retrying in ${retryDelay}ms (attempt ${autoRetryCount + 1}/${maxAutoRetries})`);
        
        if (autoRetryTimeoutRef.current) {
          clearTimeout(autoRetryTimeoutRef.current);
        }
        
        autoRetryTimeoutRef.current = setTimeout(() => {
          setAutoRetryCount(prev => prev + 1);
          setRefreshKey(prevKey => prevKey + 1);
        }, retryDelay);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
    
    // Cleanup timeout and abort controller on unmount
    return () => {
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refreshKey]);

  const handleRetry = () => {
    setAutoRetryCount(0); // Reset auto retry count on manual retry
    fetchPages(true); // Force refresh on manual retry
  };

  const handleCreateNewPage = () => {
    // TODO: Implement create new page functionality
    console.log('Create new page clicked');
  };

  const handlePageSelect = (page: NotionPage) => {
    onPageSelect(page);
  };

  // Generate array of particles - only create particles when component mounts
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => (
      <Particle key={i} delay={i * 0.3} />
    ))
  ).current;

  if (isLoading && !pages.length) {
    return (
      <div className={styles.container}>
        <AppBar />
        {particles}
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
        {particles}
        <div className={styles.content}>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
            <p className={styles.retryText}>
              {autoRetryCount < maxAutoRetries 
                ? `Retrying automatically... (${autoRetryCount + 1}/${maxAutoRetries})` 
                : "Automatic retries exhausted."}
            </p>
            <button 
              className={styles.retryButton}
              onClick={handleRetry}
            >
              Retry Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AppBar />
      {particles}
      
      <div className={styles.content}>
        <div className={styles.headerContainer}>
          <h2 className={styles.title}>Select a Page</h2>
          <p className={styles.subtext}>
            Choose a Notion page to export to. You can switch pages again at any time.
          </p>
          {isLoading && <span className={styles.refreshIndicator}>Refreshing...</span>}
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
              {page.icon ? (
                <span className={styles.pageIcon}>{page.icon}</span>
              ) : (
                <FaFile className={styles.defaultPageIcon} />
              )}
              <span className={styles.pageTitle}>{page.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageSelector; 