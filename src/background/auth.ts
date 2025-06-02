import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
};

console.log('Initializing Firebase with config:', { ...firebaseConfig, apiKey: '***' });
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Listen for external messages from the web app
chrome.runtime.onMessageExternal.addListener(
  async (message, sender, sendResponse) => {
    console.log('Received external message:', {
      type: message.type,
      sender: sender.origin,
      hasToken: !!message.token
    });
    
    if (message.type === 'AUTH_TOKEN') {
      try {
        const { token } = message;
        console.log('Processing AUTH_TOKEN message...');
        
        // Store the token securely
        console.log('Storing token in chrome.storage.local...');
        await chrome.storage.local.set({ 
          firebaseToken: token,
          tokenTimestamp: Date.now()
        });
        console.log('Token stored successfully');

        // Sign in with the custom token
        console.log('Attempting to sign in with custom token...');
        const userCredential = await signInWithCustomToken(auth, token);
        console.log('Successfully signed in with token:', {
          email: userCredential.user.email,
          uid: userCredential.user.uid
        });

        // Store user info
        console.log('Storing user info in chrome.storage.local...');
        await chrome.storage.local.set({
          userEmail: userCredential.user.email,
          userId: userCredential.user.uid,
          canvasToken: userCredential.user.uid // Add this to trigger App component update
        });
        console.log('User info stored successfully');

        // Notify the popup about successful authentication
        console.log('Sending LOGIN_SUCCESS message to popup...');
        chrome.runtime.sendMessage({ type: 'LOGIN_SUCCESS' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending LOGIN_SUCCESS message:', chrome.runtime.lastError);
          } else {
            console.log('LOGIN_SUCCESS message sent successfully');
          }
        });

        sendResponse({ success: true });
      } catch (error: any) {
        console.error('Error handling auth token:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        sendResponse({ success: false, error: error.message });
      }
    } else if (message.type === 'LOGOUT') {
      try {
        console.log("Received logout request from web app");
        // Sign out from Firebase
        await auth.signOut();
        
        // Clear storage
        await chrome.storage.local.remove([
          'firebaseToken',
          'tokenTimestamp',
          'userEmail',
          'userId',
          'canvasToken',
          'isGuestMode',
          'selectedPage'
        ]);
        
        // Notify popup
        chrome.runtime.sendMessage({ type: 'LOGOUT_SUCCESS' });
        
        // Notify web app about logout by injecting a script
        try {
          await chrome.tabs.query({ url: 'http://localhost:5173/*' }, async (tabs) => {
            for (const tab of tabs) {
              if (tab.id) {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: () => {
                    window.postMessage({ type: 'LOGOUT' }, 'http://localhost:5173');
                  }
                });
              }
            }
          });
          console.log('Successfully notified web app about logout');
        } catch (webAppError) {
          console.error('Failed to notify web app about logout:', webAppError);
          // Don't block logout if web app notification fails
        }
        
        console.log("Successfully logged out");
        sendResponse({ success: true });
      } catch (error: any) {
        console.error("Error during logout:", error);
        sendResponse({ success: false, error: error.message });
      }
    }
    return true; // Keep the message channel open for async response
  }
);

// Set up token refresh listener
auth.onIdTokenChanged(async (user) => {
  console.log('Auth state changed:', {
    hasUser: !!user,
    email: user?.email,
    uid: user?.uid
  });
  
  if (user) {
    try {
      const token = await user.getIdToken(true); // Force refresh
      console.log('Token refreshed, updating storage...');
      await chrome.storage.local.set({ 
        firebaseToken: token,
        tokenTimestamp: Date.now()
      });
      console.log('Token refresh storage updated successfully');
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }
});

// Function to check if token needs refresh (called periodically)
export async function checkTokenRefresh() {
  console.log('Checking if token needs refresh...');
  const { firebaseToken, tokenTimestamp } = await chrome.storage.local.get(['firebaseToken', 'tokenTimestamp']);
  
  if (firebaseToken && tokenTimestamp) {
    const tokenAge = Date.now() - tokenTimestamp;
    console.log('Token age:', Math.round(tokenAge / 1000 / 60), 'minutes');
    // Refresh if token is older than 50 minutes (tokens expire after 1 hour)
    if (tokenAge > 50 * 60 * 1000) {
      const user = auth.currentUser;
      if (user) {
        try {
          console.log('Token is old, refreshing...');
          const newToken = await user.getIdToken(true);
          await chrome.storage.local.set({ 
            firebaseToken: newToken,
            tokenTimestamp: Date.now()
          });
          console.log('Token refreshed on check');
        } catch (error) {
          console.error('Error refreshing token on check:', error);
        }
      }
    } else {
      console.log('Token is still valid, no refresh needed');
    }
  } else {
    console.log('No token found in storage');
  }
}

// Set up periodic token refresh check
setInterval(checkTokenRefresh, 5 * 60 * 1000); // Check every 5 minutes 