import { useState, useEffect } from 'react'
import './App.css'
import LoginRedirect from './popup/components/LoginRedirect'
import Dashboard from './popup/components/Dashboard'
import PageSelector from './popup/components/PageSelector'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isCanvasPage, setIsCanvasPage] = useState(false)
  const [selectedPage, setSelectedPage] = useState(false)

  useEffect(() => {
    // Check if current page is Canvas
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0]?.url || '';
      console.log('Current URL:', currentUrl);
      const isCanvas = currentUrl.includes('canvas');
      console.log('Is Canvas page:', isCanvas);
      setIsCanvasPage(isCanvas);
    });

    // Check initial state
    chrome.storage.local.get(['canvasToken', 'isGuestMode', 'selectedPage'], (result) => {
      console.log('Initial state:', result);
      setIsAuthenticated(!!result.canvasToken);
      setIsGuestMode(!!result.isGuestMode);
      setSelectedPage(!!result.selectedPage);
      setCheckingAuth(false);
    });

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      console.log('Storage changes:', changes);
      if (changes.isGuestMode) {
        setIsGuestMode(!!changes.isGuestMode.newValue);
      }
      if (changes.canvasToken) {
        setIsAuthenticated(!!changes.canvasToken.newValue);
      }
      if (changes.selectedPage) {
        setSelectedPage(!!changes.selectedPage.newValue);
      }
    };

    // Listen for auth state changes via messages
    const messageListener = (message: any) => {
      console.log('Received message in App:', message);
      if (message.type === 'LOGIN_SUCCESS') {
        console.log('Setting authenticated to true');
        setIsAuthenticated(true);
      } else if (message.type === 'LOGOUT') {
        console.log('Logout message received, resetting state...');
        setIsAuthenticated(false);
        setIsGuestMode(false);
        setSelectedPage(false);
      }
    };

    // Add listeners
    console.log('Setting up listeners...');
    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.runtime.onMessage.addListener(messageListener);

    // Cleanup listeners on unmount
    return () => {
      console.log('Cleaning up listeners...');
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  if (checkingAuth) {
    return <div>Loading...</div>
  }

  const containerClasses = [
    'extension-container',
    isAuthenticated ? 'authenticated' : '',
  ].filter(Boolean).join(' ');

  // Determine container height based on state
  const containerStyle = {
    height: isAuthenticated ? 'auto' : !isCanvasPage ? '420px' : '388px',
    minHeight: isAuthenticated ? '388px' : undefined,
    overflow: isAuthenticated || isGuestMode ? 'auto' : 'hidden',
    transition: 'height 0.3s ease'
  };

  console.log('Container style:', containerStyle);
  console.log('Is Canvas page (render):', isCanvasPage);

  return (
    <div className={containerClasses} style={containerStyle}>
      <div className="card">
        {!isAuthenticated && !isGuestMode ? (
          <LoginRedirect onGuestClick={() => setIsGuestMode(true)} />
        ) : selectedPage ? (
          <Dashboard />
        ) : (
          <PageSelector onPageSelect={() => {
            chrome.storage.local.set({ selectedPage: true });
            setSelectedPage(true);
          }} />
        )}
      </div>
    </div>
  )
}

export default App