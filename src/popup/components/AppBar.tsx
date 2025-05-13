import styles from './AppBar.module.css'
import defaultProfile from '../../assets/default.svg'
import settingIcon from '../../assets/setting.svg'
import logoutIcon from '../../assets/logout.svg'
import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const AppBar = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.email)
      if (user?.email) {
        setUserEmail(user.email)
      } else {
        // If we don't have a user email from auth state, try to get it from storage
        chrome.storage.local.get(['userEmail'], (result) => {
          if (result.userEmail) {
            setUserEmail(result.userEmail)
            console.log('Retrieved email from storage:', result.userEmail)
          }
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = () => {
    console.log('Attempting to logout...');
    // Clear guest mode, authentication token, and selected page state
    chrome.storage.local.set({ 
      isGuestMode: false,
      canvasToken: null,
      selectedPage: false,
      userEmail: null
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving logout state:', chrome.runtime.lastError);
      } else {
        console.log('Logout state saved successfully');
        // Send message for immediate UI update
        chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error sending logout message:', chrome.runtime.lastError);
          } else {
            console.log('Logout message sent successfully');
            // Force reload the popup window
            window.location.reload();
          }
        });
      }
    });
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
        <img src={defaultProfile} alt="Profile" className={styles.profileImage} />
        <div className={styles.userText}>
          <div className={styles.userName}>User</div>
          <div className={styles.userStatus}>{userEmail || 'Not Signed In'}</div>
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