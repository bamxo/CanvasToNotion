import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
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

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user?.email) {
          throw new Error('User email not found');
        }

        const response = await axios.get('http://localhost:3000/api/notion/pages', {
          params: { email: user.email }
        });

        setPages(response.data.pages);
      } catch (err) {
        console.error('Error fetching pages:', err);
        setError('Failed to load pages. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, []);

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