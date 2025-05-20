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

  const fetchPages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user?.email) {
        throw new Error('User email not found');
      }

      const response = await axios.get('http://localhost:3000/api/notion/pages', {
        params: { email: user.email }
      });

      setPages(response.data.pages);
      setAutoRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load pages. Please try again later.');
      
      // Schedule auto retry if we haven't exceeded max attempts
      if (autoRetryCount < maxAutoRetries) {
        const retryDelay = 500; // Fixed 500ms delay for faster retries
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
    
    // Cleanup timeout on unmount
    return () => {
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, [refreshKey]);

  const handleRetry = () => {
    setAutoRetryCount(0); // Reset auto retry count on manual retry
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleCreateNewPage = () => {
    // TODO: Implement create new page functionality
    console.log('Create new page clicked');
  };

  const handlePageSelect = (page: NotionPage) => {
    onPageSelect(page);
  };

  // Generate array of particles
  const particles = Array.from({ length: 20 }, (_, i) => (
    <Particle key={i} delay={i * 0.3} />
  ));

  if (isLoading) {
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