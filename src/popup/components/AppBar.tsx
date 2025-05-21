import { useState, useEffect } from 'react'
import styles from './AppBar.module.css'
import defaultProfile from '../../assets/default.svg'
import settingIcon from '../../assets/setting.svg'
import logoutIcon from '../../assets/logout.svg'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const AppBar = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setUserEmail(user.email);
        setIsAuthenticated(true);
        // Store email in chrome storage when we get it from auth
        await chrome.storage.local.set({ userEmail: user.email });
      } else {
        // If we don't have a user email from auth state, try to get it from storage
        chrome.storage.local.get(['userEmail'], (result) => {
          if (result.userEmail) {
            setUserEmail(result.userEmail);
            setIsAuthenticated(true);
          } else {
            setUserEmail(null);
            setIsAuthenticated(false);
          }
        });
      }
    });

    // Listen for external messages from the web app
    const handleExternalMessage = (message: any, _: any, sendResponse: any) => {
      console.log('Received external message:', message);
      if (message.type === 'LOGOUT') {
        console.log('Received logout message from web app');
        handleLogout();
        sendResponse({ success: true });
      }
      return true; // Keep the message channel open for async response
    };

    chrome.runtime.onMessageExternal.addListener(handleExternalMessage);

    // Cleanup listeners
    return () => {
      unsubscribe();
      chrome.runtime.onMessageExternal.removeListener(handleExternalMessage);
    };
  }, []);

  const handleLogout = async () => {
    console.log('Attempting to logout...');
    try {
      const auth = getAuth();
      await auth.signOut();
      
      // Clear storage
      await chrome.storage.local.remove([
        'isGuestMode',
        'canvasToken',
        'selectedPage',
        'userEmail',
        'firebaseToken',
        'tokenTimestamp',
        'userId'
      ]);
      
      console.log('Logout completed successfully');
      // Force reload the popup window
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSettings = () => {
    try {
      // Open the settings page in a new tab
      chrome.tabs.create({ url: 'http://localhost:5173/settings' })
      window.close() // Close the popup after redirecting
    } catch (err) {
      console.error(err)
    }
  };

  return (
    <div className={styles.appBar}>
      <div className={styles.userInfo}>
        <img src={defaultProfile} alt={isAuthenticated ? "User Profile" : "Guest Profile"} className={styles.profileImage} />
        <div className={styles.userText}>
          <div className={styles.userName}>
            {isAuthenticated ? userEmail?.split('@')[0] : 'Guest'}
          </div>
          <div className={styles.userStatus}>
            {isAuthenticated ? 'Signed In' : 'Not Signed In'}
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.iconButton} onClick={handleSettings}>
          <img src={settingIcon} alt="Settings" />
        </button>
        <button className={styles.iconButton} onClick={handleLogout}>
          <img src={logoutIcon} alt="Logout" />
        </button>
      </div>
    </div>
  )
}

export default AppBar 