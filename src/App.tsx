import { useState, useEffect } from 'react'
import './App.css'
import LoginRedirect from './popup/components/LoginRedirect'
import Dashboard from './popup/components/Dashboard'
import PageSelector from './popup/components/PageSelector'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isCanvasPage, setIsCanvasPage] = useState(false)
  const [selectedPage, setSelectedPage] = useState(false)

  useEffect(() => {
    // Create a connection to the background script in production
    let port: chrome.runtime.Port | null = null;
    
    if (import.meta.env.MODE === 'production') {
      port = chrome.runtime.connect({ name: 'popup' });
      
      port.onMessage.addListener((message) => {
        console.log('Received message from background script:', message);
        if (message.type === 'COOKIE_AUTH_SUCCESS') {
          console.log('Authenticated via cookie through port connection');
          setIsAuthenticated(true);
          setCheckingAuth(false);
        }
      });
    }

    // Check if current page is Canvas
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0]?.url || '';
      console.log('Current URL:', currentUrl);
      const isCanvas = currentUrl.includes('canvas');
      console.log('Is Canvas page:', isCanvas);
      setIsCanvasPage(isCanvas);
    });

    // In production, check for cookie authentication first
    if (import.meta.env.MODE === 'production') {
      console.log('Production mode detected, checking for cookie auth...');
      chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error checking auth:', chrome.runtime.lastError);
        } else if (response && response.isAuthenticated) {
          console.log('Authenticated via cookie');
          setIsAuthenticated(true);
          setCheckingAuth(false);
          return;
        }
        
        // Continue with normal auth check if cookie auth failed
        checkInitialAuthState();
      });
    } else {
      // In development, just check storage
      checkInitialAuthState();
    }

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      console.log('Storage changes:', changes);
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
      } else if (message.type === 'LOGOUT_SUCCESS' || message.type === 'LOGOUT') {
        console.log('Logout message received, resetting state...');
        setIsAuthenticated(false);
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
      
      // Disconnect port if it exists
      if (port) {
        port.disconnect();
      }
    };
  }, []);

  // Helper function to check initial auth state from storage
  const checkInitialAuthState = () => {
    chrome.storage.local.get(['canvasToken', 'selectedPage'], (result) => {
      console.log('Initial state from storage:', result);
      setIsAuthenticated(!!result.canvasToken);
      setSelectedPage(!!result.selectedPage);
      setCheckingAuth(false);
    });
  };

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
    overflow: isAuthenticated ? 'auto' : 'hidden',
    transition: 'height 0.3s ease'
  };

  console.log('Container style:', containerStyle);
  console.log('Is Canvas page (render):', isCanvasPage);

  return (
    <div className={containerClasses} style={containerStyle}>
      <div className="card">
        {!isAuthenticated ? (
          <LoginRedirect />
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