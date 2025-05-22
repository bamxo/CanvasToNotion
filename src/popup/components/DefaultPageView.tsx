import React, { useState, useEffect } from 'react';
import { FaFile } from 'react-icons/fa';
import styles from './PageSelector.module.css';

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  type?: string;
}

interface DefaultPageViewProps {
  pages: NotionPage[];
  isLoading: boolean;
  onPageSelect: (page: NotionPage) => void;
  onCreateNewPage: () => void;
}

const DefaultPageView: React.FC<DefaultPageViewProps> = ({ 
  pages, 
  isLoading, 
  onPageSelect, 
  onCreateNewPage 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const animationStyle = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.95)',
    transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-out'
  };

  return (
    <div style={animationStyle}>
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
          onClick={onCreateNewPage}
        >
          <span className={styles.pageIcon}>+</span>
          <span className={styles.pageTitle}>Create New Page</span>
        </button>
        {pages.map((page: NotionPage) => (
          <button
            key={page.id}
            className={styles.pageItem}
            onClick={() => onPageSelect(page)}
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
  );
};

export default DefaultPageView; 