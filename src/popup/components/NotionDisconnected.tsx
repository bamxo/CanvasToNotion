import React, { useState, useEffect } from 'react';
import { FaLink, FaCog } from 'react-icons/fa';
import styles from './PageSelector.module.css';
import { isDevelopment } from '../../services/api.config';

interface NotionDisconnectedProps {
  onRetry: (isAutoRetry?: boolean) => void;
}

const NotionDisconnected: React.FC<NotionDisconnectedProps> = ({ onRetry }) => {
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

  return (
    <div className={styles.notionDisconnectedContainer} style={animationStyle}>
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