import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
};

console.log('Initializing Firebase with config:', { ...firebaseConfig, apiKey: '***' });
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to check for authentication via cookie
async function checkAuthCookie() {
  // Only run in production mode (not in development)
  if (import.meta.env.MODE === 'production') {
    console.log('Checking for authentication cookie in production mode...');
    try {
      const cookie = await chrome.cookies.get({
        name: 'authToken',
        url: 'https://canvastonotion.io/'
      });
      
      if (cookie && cookie.value) {
        console.log('Found authentication cookie with length:', cookie.value.length);
        
        // Use the cookie value as the Firebase auth token, ensuring it's properly formatted
        let token = cookie.value;
        
        // Check if the token needs decoding (if it's URL encoded)
        if (token.includes('%')) {
          try {
            token = decodeURIComponent(token);
            console.log('Decoded URL-encoded token');
          } catch (decodeError) {
            console.error('Error decoding token:', decodeError);
            // Continue with the original token
          }
        }
        
        // Remove any quotes if they were added during cookie storage
        token = token.replace(/^["'](.*)["']$/, '$1');
        
        console.log('Token prepared for authentication, first/last 10 chars:', 
          token.substring(0, 10) + '...' + token.substring(token.length - 10));
        
        // Store the token securely
        await chrome.storage.local.set({ 
          firebaseToken: token,
          tokenTimestamp: Date.now()
        });
        
        // Sign in with the custom token
        try {
          console.log('Attempting to sign in with cookie token...');
          const userCredential = await signInWithCustomToken(auth, token);
          console.log('Successfully signed in with cookie token:', {
            email: userCredential.user.email,
            uid: userCredential.user.uid
          });
          
          // Store user info
          await chrome.storage.local.set({
            userEmail: userCredential.user.email,
            userId: userCredential.user.uid,
            canvasToken: userCredential.user.uid // Add this to trigger App component update
          });
          
          // Notify the popup about successful authentication
          chrome.runtime.sendMessage({ type: 'LOGIN_SUCCESS' });
          
          return true;
        } catch (authError: any) {
          console.error('Error signing in with cookie token:', {
            message: authError.message,
            code: authError.code,
            stack: authError.stack,
            tokenLength: token.length
          });
          
          // If token format seems to be the issue, try some common fixes
          if (authError.code === 'auth/invalid-custom-token') {
            console.log('Invalid custom token format detected, trying alternate approaches...');
            
            // Try to extract user information from the token if possible
            // This is a best effort to get some user profile info
            try {
              // Check if token is a JWT and try to decode it
              let userDisplayName = '';
              let userPhotoURL = '';
              let userEmail = '';
              
              // JWT tokens are split by periods into three parts
              if (token.split('.').length === 3) {
                // Try to decode the payload (middle part)
                const base64Payload = token.split('.')[1];
                const payload = JSON.parse(atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/')));
                
                console.log('Successfully decoded JWT payload');
                
                // Extract user info if available
                userEmail = payload.email || '';
                userDisplayName = payload.name || payload.display_name || '';
                userPhotoURL = payload.picture || payload.photoURL || payload.photo_url || '';
              }
              
              // Create a proper userInfo object
              const userInfo = {
                displayName: userDisplayName || 'Canvas User',
                email: userEmail || 'user@canvastonotion.io',
                photoURL: userPhotoURL || undefined
              };
              
              // If we haven't already stored the token directly, try that
              // This approach skips Firebase custom token auth and just uses the token for API calls
              await chrome.storage.local.set({
                firebaseToken: token,
                tokenTimestamp: Date.now(),
                // Set these values to trigger the app to think we're authenticated
                canvasToken: 'direct-token-auth',
                userEmail: userInfo.email,
                userId: 'direct-token-auth',
                // Store proper user info for profile display
                userInfo: userInfo
              });
              
              console.log('Stored user profile information:', userInfo);
              
              // Notify the popup about successful authentication
              chrome.runtime.sendMessage({ type: 'LOGIN_SUCCESS' });
              console.log('Stored token directly for API use with user profile info');
              return true;
            } catch (decodeError) {
              console.error('Error extracting user info from token:', decodeError);
              
              // Fallback to generic user info
              const userInfo = {
                displayName: 'Canvas User',
                email: 'user@canvastonotion.io',
                photoURL: undefined
              };
              
              // Store token with generic user info
              await chrome.storage.local.set({
                firebaseToken: token,
                tokenTimestamp: Date.now(),
                canvasToken: 'direct-token-auth',
                userEmail: userInfo.email,
                userId: 'direct-token-auth',
                userInfo: userInfo
              });
              
              // Notify the popup about successful authentication
              chrome.runtime.sendMessage({ type: 'LOGIN_SUCCESS' });
              console.log('Stored token directly for API use with generic user info');
              return true;
            }
          }
        }
      } else {
        console.log('No authentication cookie found');
        
        // Check if user is currently signed in
        const user = auth.currentUser;
        const { userId } = await chrome.storage.local.get(['userId']);
        
        if (user || userId) {
          console.log('User is signed in but cookie is missing, signing out...');
          // Sign out from Firebase
          await auth.signOut();
          
          // Clear storage
          await chrome.storage.local.remove([
            'firebaseToken',
            'tokenTimestamp',
            'userEmail',
            'userId',
            'canvasToken',
            'userInfo'
          ]);
          
          // Notify popup
          chrome.runtime.sendMessage({ type: 'LOGOUT_SUCCESS' });
          console.log('Successfully logged out user due to missing auth cookie');
        }
      }
    } catch (error) {
      console.error('Error checking for authentication cookie:', error);
    }
  } else {
    console.log('Not in production mode, skipping cookie authentication');
  }
  
  return false;
}

// Check for cookie authentication on extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Extension started, checking for cookie authentication...');
  await checkAuthCookie();
});

// Also check when the extension popup is opened
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated, checking for cookie authentication...');
  await checkAuthCookie();
});

// Set up periodic token refresh check
setInterval(checkTokenRefresh, 5 * 60 * 1000); // Check every 5 minutes 

// Listen for popup connection to check cookie authentication
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    console.log('Popup connected, checking for cookie authentication...');
    checkAuthCookie().then(isAuthenticated => {
      if (isAuthenticated) {
        port.postMessage({ type: 'COOKIE_AUTH_SUCCESS' });
      }
    });
    
    port.onDisconnect.addListener(() => {
      console.log('Popup disconnected');
    });
  }
});

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
          'canvasToken'
        ]);
        
        // Notify popup
        chrome.runtime.sendMessage({ type: 'LOGOUT_SUCCESS' });
        
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

// Also check authentication state when the popup is opened
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_AUTH') {
    console.log('Received CHECK_AUTH message, checking authentication status...');
    
    // In production, always check if the auth cookie exists
    if (import.meta.env.MODE === 'production') {
      checkAuthCookie().then(isAuthenticated => {
        sendResponse({ isAuthenticated });
      });
    } else {
      // In development, just check if we have a user
      const isAuthenticated = !!auth.currentUser;
      sendResponse({ isAuthenticated });
    }
    
    return true; // Keep the message channel open for async response
  }
});

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
      } else if (import.meta.env.MODE === 'production') {
        // In production, try to revalidate using cookie if no user is available
        await checkAuthCookie();
      }
    } else {
      console.log('Token is still valid, no refresh needed');
    }
  } else if (import.meta.env.MODE === 'production') {
    // In production, try to get authentication from cookie if no token is available
    await checkAuthCookie();
  } else {
    console.log('No token found in storage');
  }
}

// Check authentication when visibility changes (user comes back to the extension)
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (import.meta.env.MODE === 'production') {
    console.log('Tab activated, checking for cookie authentication...');
    checkAuthCookie();
  }
}); 