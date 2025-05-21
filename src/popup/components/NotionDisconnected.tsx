import React from 'react';
import { FaLink, FaCog } from 'react-icons/fa';
import styles from './PageSelector.module.css';

interface NotionDisconnectedProps {
  onRetry: (isAutoRetry?: boolean) => void;
}

const NotionDisconnected: React.FC<NotionDisconnectedProps> = ({ onRetry }) => {
  const handleOpenSettings = () => {
    chrome.tabs.create({ url: 'http://localhost:5173/settings' });
    window.close();
  };

  return (
    <div className={styles.notionDisconnectedContainer}>
      <div className={styles.iconWrapper}>
        <FaLink className={styles.disconnectedIcon} />
      </div>
      <h2 className={styles.disconnectedTitle}>Connect to Notion</h2>
      <p className={styles.disconnectedMessage}>
        Please connect your Notion account to access and select pages.
      </p>
      
      <button 
        className={styles.settingsButton}
        onClick={handleOpenSettings}
      >
        <FaCog className={styles.settingsIcon} />
        Open Settings
      </button>
      
      <button 
        className={styles.checkConnectionButton}
        onClick={() => onRetry(false)}
      >
        Check Connection
      </button>
    </div>
  );
};

export default NotionDisconnected; 