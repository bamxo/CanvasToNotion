import { useState } from 'react';
import { signInWithEmail } from '../../services/auth.service';
import styles from './EmailLogin.module.css';

interface EmailLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const EmailLogin: React.FC<EmailLoginProps> = ({ onBack, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
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
    <div className={styles.container}>
      <button onClick={onBack} className={styles.backButton}>
        ← Back
      </button>
      
      <h2>Sign in with Email</h2>
      
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
  );
};

export default EmailLogin; 