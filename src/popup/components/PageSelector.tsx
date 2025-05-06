import React from 'react';
import styles from './PageSelector.module.css';
import mockPages from '../data/mockPages.json';
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
  const handleCreateNewPage = () => {
    // TODO: Implement create new page functionality
    console.log('Create new page clicked');
  };

  const handlePageSelect = (page: NotionPage) => {
    onPageSelect(page);
  };

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
          {mockPages.pages.map((page: NotionPage) => (
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