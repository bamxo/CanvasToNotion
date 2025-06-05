import React from 'react';
import styles from '../popup/components/LoginRedirect.module.css';

interface ParticleProps {
  delay: number;
}

const Particle: React.FC<ParticleProps> = ({ delay }) => {
  const style = {
    left: `${Math.random() * 100}%`,
    animation: `${styles.floatParticle} 6s ease-in infinite`,
    animationDelay: `${delay}s`
  };

  return <div className={styles.particle} style={style} />;
};

interface ParticleBackgroundProps {
  count?: number;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ count = 20 }) => {
  const particles = Array.from({ length: count }, (_, i) => (
    <Particle key={i} delay={i * 0.3} />
  ));

  return <>{particles}</>;
}; 