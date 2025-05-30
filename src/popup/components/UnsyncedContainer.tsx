import { 
  FaCalendarAlt, 
  FaClipboardList, 
  FaQuestionCircle, 
  FaComments, 
  FaExclamationTriangle, 
  FaClock,
  FaSync
} from 'react-icons/fa';
import styles from './Dashboard.module.css';

interface UnsyncedItem {
  id: string;
  type: string;
  title: string;
  course: string;
  due_date: string;
  status: string;
  points: number;
}

interface UnsyncedContainerProps {
  unsyncedItems: UnsyncedItem[];
  onClearItems: () => void;
  isLoading?: boolean;
}

const UnsyncedContainer = ({ 
  unsyncedItems, 
  onClearItems,
  isLoading = false
}: UnsyncedContainerProps) => {

  const formatDueDate = (dateString: string) => {
    if (!dateString) {
      return 'No Due Date';
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };
  
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <FaClipboardList className={styles.itemIcon} />;
      case 'quiz':
        return <FaQuestionCircle className={styles.itemIcon} />;
      case 'discussion':
        return <FaComments className={styles.itemIcon} />;
      default:
        return <FaCalendarAlt className={styles.itemIcon} />;
    }
  };

  return (
    <div className={styles.unsyncedContainer}>
      <div className={styles.unsyncedHeader}>
        <h2 className={styles.unsyncedTitle}>
          {isLoading ? (
            <FaCalendarAlt className={styles.unsyncedIcon} />
          ) : unsyncedItems.length > 0 ? (
            <FaExclamationTriangle className={`${styles.unsyncedIcon} ${styles.warningIcon}`} />
          ) : (
            <FaCalendarAlt className={`${styles.unsyncedIcon} ${styles.successIcon}`} />
          )}
          {isLoading ? 'Checking Canvas Items...' : 
            unsyncedItems.length > 0 ? 'Items to Sync' : 'Assignments Up To Date'}
        </h2>
        <div className={styles.unsyncedHeaderActions}>
          {unsyncedItems.length > 0 && !isLoading ? (
            <>
              <span className={styles.unsyncedCount}>{unsyncedItems.length}</span>
              <button 
                onClick={onClearItems} 
                className={styles.clearButton}
                title="Clear all items (testing only)"
              >
                Clear
              </button>
            </>
          ) : null}
        </div>
      </div>
      
      {isLoading ? (
        <div className={styles.emptyStateContainer}>
          <FaSync className={`${styles.emptyStateIcon} ${styles.rotating}`} />
          <p className={styles.emptyStateText}>Comparing Canvas with Notion...</p>
        </div>
      ) : unsyncedItems.length > 0 ? (
        <div className={styles.unsyncedItemsList}>
          {unsyncedItems.map((item) => (
            <div 
              key={item.id} 
              className={`
                ${styles.unsyncedItem} 
                ${item.status === 'overdue' ? styles.overdueItem : ''} 
                ${item.status === 'no-due-date' ? styles.noDueDateItem : ''}
              `}
            >
              <div className={styles.unsyncedItemHeader}>
                {getItemIcon(item.type)}
                <div className={styles.unsyncedItemInfo}>
                  <h3 className={styles.unsyncedItemTitle}>{item.title}</h3>
                  <p className={styles.unsyncedItemCourse}>{item.course}</p>
                </div>
              </div>
              <div className={styles.unsyncedItemFooter}>
                <span className={`${styles.unsyncedItemDue} ${item.status === 'overdue' ? styles.overdueDue : ''} ${item.status === 'no-due-date' ? styles.noDueDateDue : ''}`}>
                  <FaClock className={styles.dueIcon} />
                  {formatDueDate(item.due_date)}
                </span>
                <span className={styles.unsyncedItemPoints}>{item.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyStateContainer}>
          <FaCalendarAlt className={styles.emptyStateIcon} />
          <p className={styles.emptyStateText}>Everything is up to date! No items to sync.</p>
        </div>
      )}
    </div>
  );
};

export default UnsyncedContainer; 