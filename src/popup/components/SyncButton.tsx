import { memo, useEffect, useState } from 'react';
import styles from './Dashboard.module.css';

interface SyncButtonProps {
  onSync: () => void;
  isLoading: boolean;
  disabled: boolean;
  lastSync: string | null;
  syncStatus: 'success' | 'error' | 'partial' | null;
}

// Use memo to prevent unnecessary re-renders
const SyncButton = memo(({
  onSync,
  isLoading,
  disabled,
  lastSync,
  syncStatus
}: SyncButtonProps) => {
  const [showStatus, setShowStatus] = useState(false);

  // Show animation when sync status changes
  useEffect(() => {
    if (syncStatus) {
      setShowStatus(true);
    }
  }, [syncStatus]);
  
  // Prepare status message based on syncStatus to avoid conditional rendering in the JSX
  let statusMessage = null;
  if (syncStatus === 'success') {
    statusMessage = (
      <div className={`${styles.successMessage} ${showStatus ? styles.fadeIn : ''}`}>
        ✓ Sync completed successfully
      </div>
    );
  } else if (syncStatus === 'partial') {
    statusMessage = (
      <div className={`${styles.partialMessage} ${showStatus ? styles.fadeIn : ''}`}>
        ⚠ Sync partially completed
      </div>
    );
  } else if (syncStatus === 'error') {
    statusMessage = (
      <div className={`${styles.errorMessage} ${showStatus ? styles.fadeIn : ''}`}>
        ✗ Sync failed. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className={styles.statusContainer}>
        {lastSync && (
          <p className={styles.lastSync}>
            Last synced: {lastSync}
          </p>
        )}
        {statusMessage}
      </div>

      <button 
        onClick={onSync} 
        disabled={disabled}
        className={styles.syncButton}
      >
        {isLoading ? 'Loading...' : 'Sync All Assignments'}
      </button>
    </>
  );
});

export default SyncButton; 