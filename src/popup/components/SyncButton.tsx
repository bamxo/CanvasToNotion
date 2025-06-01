import styles from './Dashboard.module.css';

interface SyncButtonProps {
  onSync: () => void;
  isLoading: boolean;
  disabled: boolean;
  lastSync: string | null;
  syncStatus: 'success' | 'error' | 'partial' | null;
  syncErrorMessage: string | null;
}

const SyncButton = ({
  onSync,
  isLoading,
  disabled,
  lastSync,
  syncStatus
}: SyncButtonProps) => {
  return (
    <>
      <div className={styles.statusContainer}>
        {lastSync && (
          <p className={styles.lastSync}>
            Last synced: {lastSync}
          </p>
        )}
        {syncStatus === 'success' && (
          <div className={styles.successMessage}>
            ✓ Sync completed successfully
          </div>
        )}
        {syncStatus === 'partial' && (
          <div className={styles.partialMessage}>
            ⚠ Sync partially completed
          </div>
        )}
        {syncStatus === 'error' && (
          <div className={styles.errorMessage}>
            ✗ Sync failed. Please try again.
          </div>
        )}
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
};

export default SyncButton; 