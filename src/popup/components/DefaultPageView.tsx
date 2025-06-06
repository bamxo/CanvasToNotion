import React, { useState, useEffect } from 'react';
import { FaFile, FaExclamationCircle, FaCog } from 'react-icons/fa';
import styles from './PageSelector.module.css';
import { isDevelopment } from '../../services/api.config';

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
}

const DefaultPageView: React.FC<DefaultPageViewProps> = ({ 
  pages, 
  isLoading, 
  onPageSelect
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenSettings = () => {
    // Determine the settings URL based on environment
    const webAppBaseUrl = isDevelopment 
      ? 'http://localhost:5173'
      : 'https://canvastonotion.netlify.app';
    
    chrome.tabs.create({ url: `${webAppBaseUrl}/settings` });
    window.close();
  };

  const animationStyle = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.95)',
    transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-out'
  };

  // If no pages, display the full-screen no pages message
  if (pages.length === 0) {
    return (
      <div style={animationStyle} className={styles.notionDisconnectedContainer}>
        <div className={styles.iconWrapper}>
          <FaExclamationCircle className={styles.disconnectedIcon} />
        </div>
        <h2 className={styles.disconnectedTitle}>No Pages Found</h2>
        <p className={styles.disconnectedMessage}>
          You need to connect to Notion and select pages to sync with in settings.
        </p>
        <button 
          className={styles.settingsButton}
          onClick={handleOpenSettings}
        >
          <FaCog className={styles.settingsIcon} />
          Open Settings
        </button>
      </div>
    );
  }

  // Regular view with pages
  return (
    <div style={animationStyle} className={styles.defaultPageWrapper}>
      <div className={styles.headerContainer}>
        <h2 className={styles.title}>Select a Page</h2>
        <p className={styles.subtext}>
          Choose a Notion page to export to. You can switch pages again at any time.
        </p>
        {isLoading && <span className={styles.refreshIndicator}>Refreshing...</span>}
      </div>

      <div className={styles.pageList}>
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