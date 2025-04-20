import styles from './AppBar.module.css'
import defaultProfile from '../../assets/default.svg'
import settingIcon from '../../assets/setting.svg'
import logoutIcon from '../../assets/logout.svg'

interface AppBarProps {
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}

const AppBar = ({ onSettingsClick, onLogoutClick }: AppBarProps) => {
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
        <button className={styles.iconButton} onClick={onSettingsClick}>
          <img src={settingIcon} alt="Settings" />
        </button>
        <button className={styles.iconButton} onClick={onLogoutClick}>
          <img src={logoutIcon} alt="Logout" />
        </button>
      </div>
    </div>
  )
}

export default AppBar 