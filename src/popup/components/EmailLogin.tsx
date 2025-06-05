import { useState } from 'react';
import { signInWithEmail } from '../../services/firebase/config';
import styles from './EmailLogin.module.css';
import logo from '../../assets/c2n_logo dark.svg';

interface EmailLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

// Particle component
const Particle = ({ delay }: { delay: number }) => {
  const style = {
    left: `${Math.random() * 100}%`,
    animation: `${styles.floatParticle} 6s ease-in infinite`,
    animationDelay: `${delay}s`
  };

  return <div className={styles.particle} style={style} />;
};

const EmailLogin: React.FC<EmailLoginProps> = ({ onBack, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate array of particles
  const particles = Array.from({ length: 20 }, (_, i) => (
    <Particle key={i} delay={i * 0.3} />
  ));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Send extension ID to frontend
      console.log('Sending extension ID to frontend:', chrome.runtime.id);
      const tabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
      for (const tab of tabs) {
        if (tab.id) {
          await chrome.tabs.sendMessage(tab.id, { 
            type: 'EXTENSION_ID',
            extensionId: chrome.runtime.id 
          });
        }
      }

      const user = await signInWithEmail(email, password);
      if (user) {
        chrome.storage.local.set({ canvasToken: user.uid });
        chrome.runtime.sendMessage({ type: 'LOGIN_SUCCESS' });
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        type="button"
        onClick={onBack} 
        className={styles.backButton}
      >
        ← Return
      </button>

      <div className={styles.container}>
        {particles}
        
        <div className={styles.headerContainer}>
          <img src={logo} alt="Canvas to Notion Logo" className={styles.logo} />
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          
          {error && <div className={styles.error}>{error}</div>}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </>
  );
};

export default EmailLogin; 