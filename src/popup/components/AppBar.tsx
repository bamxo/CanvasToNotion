import styles from './AppBar.module.css'
import defaultProfile from '../../assets/default.svg'
import settingIcon from '../../assets/setting.svg'
import logoutIcon from '../../assets/logout.svg'

const AppBar = () => {
  const handleLogout = () => {
    console.log('Attempting to logout...');
    // Clear guest mode, authentication token, and selected page state
    chrome.storage.local.set({ 
      isGuestMode: false,
      canvasToken: null,
      selectedPage: false
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
        <img src={defaultProfile} alt="Guest Profile" className={styles.profileImage} />
        <div className={styles.userText}>
          <div className={styles.userName}>Guest</div>
          <div className={styles.userStatus}>Not Signed In</div>
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