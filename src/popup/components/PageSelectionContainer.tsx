import { FaBook, FaFile } from 'react-icons/fa';
import styles from './Dashboard.module.css';

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  type?: string;
}

interface PageSelectionContainerProps {
  selectedPage: NotionPage | null;
  onPageSelect: () => void;
  onChangePage: () => void;
}

const PageSelectionContainer = ({ 
  selectedPage, 
  onPageSelect, 
  onChangePage 
}: PageSelectionContainerProps) => {
  return (
    <div className={styles.pageSelectionContainer}>
      <div className={styles.pageSelectionHeader}>
        <h2 className={styles.pageSelectionTitle}>
          <FaBook className={styles.pageIcon} />
          Notion Page
        </h2>
      </div>
      {selectedPage ? (
        <div className={styles.selectedPage}>
          <div className={styles.pageInfo}>
            {selectedPage.icon ? (
              <span className={styles.pageIcon}>{selectedPage.icon}</span>
            ) : (
              <FaFile className={styles.pageIcon} />
            )}
            <span className={styles.pageTitle}>{selectedPage.title}</span>
          </div>
          <button 
            onClick={onChangePage}
            className={styles.changePage}
          >
            Change Page
          </button>
        </div>
      ) : (
        <button 
          onClick={onPageSelect}
          className={styles.selectPageButton}
        >
          Select Notion Page
        </button>
      )}
    </div>
  );
};

export default PageSelectionContainer; 