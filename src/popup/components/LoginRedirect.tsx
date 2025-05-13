/**
 * LoginRedirect Component
 * 
 * This component handles the initial login flow for the Canvas to Notion extension.
 * It displays different content based on whether the user is currently on a Canvas page
 * and provides functionality to redirect to the web application for authentication.
 */

import { useState, useEffect } from 'react'
import styles from './LoginRedirect.module.css'
import logo from '../../assets/c2n_logo dark.svg'
import EmailLogin from './EmailLogin'

// Particle component
const Particle = ({ delay }: { delay: number }) => {
  const style = {
    left: `${Math.random() * 100}%`,
    animation: `${styles.floatParticle} 6s ease-in infinite`,
    animationDelay: `${delay}s`
  };

  return <div className={styles.particle} style={style} />;
};

const LoginRedirect = () => {
  // State management for loading states, errors, and Canvas page detection
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCanvasPage, setIsCanvasPage] = useState(false)
  const [showEmailLogin, setShowEmailLogin] = useState(false)

  useEffect(() => {
    // Check if the current tab is a Canvas page by examining the URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0]?.url || '';
      setIsCanvasPage(currentUrl.includes('canvas'));
    });
  }, []);

  /**
   * Handles the login process by:
   * 1. Opening the webapp login page in a new tab
   * 2. Closing the extension popup
   * 
   * Error handling is implemented to catch and display any issues during redirection
   */
  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Open the webapp login page in a new tab
      chrome.tabs.create({ url: 'http://localhost:5173/lookup' })
      window.close() // Close the popup after redirecting
    } catch (err) {
      console.error(err)
      setError('Failed to open login page.')
    } finally {
      setIsLoading(false)
    }
  }

  // Generate array of particles
  const particles = Array.from({ length: 20 }, (_, i) => (
    <Particle key={i} delay={i * 0.3} />
  ));

  if (showEmailLogin) {
    return (
      <EmailLogin 
        onBack={() => setShowEmailLogin(false)}
        onLoginSuccess={() => {}}
      />
    );
  }

  return (
    <div className={`${styles.container} ${isCanvasPage ? styles.canvasContainer : styles.nonCanvasContainer}`}>
      {particles}
      {/* Header section with logo and context-aware messaging */}
      <div className={styles.headerContainer}>
        <img src={logo} alt="Canvas to Notion Logo" className={styles.logo} />
        {/* Display warning message if not on Canvas */}
        {!isCanvasPage && (
          <h1 className={styles.nonCanvasTitle}>
            Open this extension on Canvas
          </h1>
        )}
      
        {/* Context-aware subtext based on whether user is on Canvas or not */}
        <p className={styles.subtext}>
          {isCanvasPage 
            ? "Sync your Canvas assignments straight to Notion — organized, automatic, and always up-to-date."
            : "This extension only works while you're viewing Canvas. Please navigate to your Canvas dashboard to continue syncing assignments."
          }
        </p>
      </div>
      
      {/* Login button with loading state handling */}
      <button 
        onClick={handleLogin} 
        disabled={isLoading}
        className={styles.signInButton}
      >
        {isLoading ? 'Redirecting...' : 'Sign In'}
      </button>
      <button 
        onClick={() => setShowEmailLogin(true)}
        className={styles.emailSignInButton}
      >
        Sign In with Email
      </button>

      {/* Error message display */}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  )
}

export default LoginRedirect 