import React, { useState, useEffect, useRef } from 'react';
import { FaGraduationCap } from 'react-icons/fa';
import styles from './PageSelector.module.css';
import AppBar from './AppBar';

interface CanvasRequiredProps {
  onRetry: () => void;
}

// Particle component (same as in PageSelector)
const Particle = ({ delay }: { delay: number }) => {
  const style = {
    left: `${Math.random() * 100}%`,
    animation: `${styles.floatParticle} 6s ease-in infinite`,
    animationDelay: `${delay}s`
  };

  return <div className={styles.particle} style={style} />;
};

const CanvasRequired: React.FC<CanvasRequiredProps> = ({  }) => {
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

  // Generate array of particles - same as PageSelector
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => (
      <Particle key={i} delay={i * 0.3} />
    ))
  ).current;

  return (
    <div className={styles.container}>
      <AppBar />
      {particles}
      
      <div className={styles.content}>
        <div className={styles.notionDisconnectedContainer} style={animationStyle}>
          <div className={styles.iconWrapper}>
            <FaGraduationCap className={styles.disconnectedIcon} />
          </div>
          <h2 className={styles.disconnectedTitle}>Open Canvas LMS</h2>
          <p className={styles.disconnectedMessage}>
            Please navigate to your Canvas dashboard to sync assignments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CanvasRequired; 