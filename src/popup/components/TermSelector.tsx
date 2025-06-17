import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import styles from './Dashboard.module.css';

interface TermSelectorProps {
  selectedTerm: 'quarter' | 'semester';
  onTermChange: (term: 'quarter' | 'semester') => void;
}

const TermSelector: React.FC<TermSelectorProps> = ({ selectedTerm, onTermChange }) => {
  return (
    <div className={styles.termSelectorContainer}>
      <div className={styles.termSelectorInline}>
        <span className={styles.termLabel}>
          <FaCalendarAlt className={styles.termIcon} />
          Term:
        </span>
        
        <div className={styles.termToggleContainer}>
          <button
            className={`${styles.termToggleButton} ${selectedTerm === 'quarter' ? styles.termToggleActive : styles.termToggleInactive}`}
            onClick={() => onTermChange('quarter')}
          >
            Quarter {selectedTerm === 'quarter' ? '◉' : '○'}
          </button>
          
          <button
            className={`${styles.termToggleButton} ${selectedTerm === 'semester' ? styles.termToggleActive : styles.termToggleInactive}`}
            onClick={() => onTermChange('semester')}
          >
            Semester {selectedTerm === 'semester' ? '◉' : '○'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermSelector; 