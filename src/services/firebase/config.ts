import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken as firebaseSignInWithCustomToken,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  UserCredential
} from 'firebase/auth';
import { getDatabase, ref, set, get, remove } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Auth functions
export const chromeIdentityLogin = async (): Promise<any> => {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: true });
    const credential = GoogleAuthProvider.credential(null, token.token);
    const userCred = await signInWithCredential(auth, credential);
    return userCred.user;
  } catch (error) {
    console.error('Chrome Identity Login Error:', error);
    throw error;
  }
};

export const signInWithGoogle = async (): Promise<UserCredential['user']> => {
  return chromeIdentityLogin();
};

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential['user']> => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return userCred.user;
};

export const signInWithCustomToken = async (token: string): Promise<any> => {
  return await firebaseSignInWithCustomToken(auth, token);
};

export const isAuthenticated = (): boolean => {
  const user = localStorage.getItem('user');
  return !!user;
};

export const logout = async (): Promise<void> => {
  await auth.signOut();
  localStorage.removeItem('user');
  await chrome.storage.local.remove([
    'firebaseToken',
    'tokenTimestamp',
    'userEmail',
    'userId',
    'canvasToken',
    'isGuestMode',
    'selectedPage'
  ]);
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Background auth functions
export const handleAuthToken = async (token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Handling auth token in extension...');
    
    // Store the token securely
    await chrome.storage.local.set({ 
      firebaseToken: token,
      tokenTimestamp: Date.now()
    });
    console.log('Stored token in chrome.storage.local');

    // Sign in with the custom token
    console.log('Signing in with custom token...');
    const userCredential = await signInWithCustomToken(token);
    console.log('Successfully signed in with custom token');

    // Store user info
    await chrome.storage.local.set({
      userEmail: userCredential.user.email,
      userId: userCredential.user.uid,
      canvasToken: userCredential.user.uid
    });
    console.log('Stored user info in chrome.storage.local');

    // Notify the popup about successful authentication
    console.log('Sending LOGIN_SUCCESS message to popup...');
    chrome.runtime.sendMessage({ type: 'LOGIN_SUCCESS' });
    console.log('Successfully sent LOGIN_SUCCESS message');

    return { success: true };
  } catch (error: any) {
    console.error('Error handling auth token:', error);
    return { success: false, error: error.message };
  }
};

export const handleLogout = async (): Promise<{ success: boolean; error?: string }> => {
  try {
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
    
    // Notify web app about logout
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
    } catch (webAppError) {
      console.error('Failed to notify web app about logout:', webAppError);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error during logout:", error);
    return { success: false, error: error.message };
  }
};

export const checkTokenRefresh = async (): Promise<void> => {
  const { firebaseToken, tokenTimestamp } = await chrome.storage.local.get(['firebaseToken', 'tokenTimestamp']);
  
  if (firebaseToken && tokenTimestamp) {
    const tokenAge = Date.now() - tokenTimestamp;
    // Refresh if token is older than 50 minutes (tokens expire after 1 hour)
    if (tokenAge > 50 * 60 * 1000) {
      const user = auth.currentUser;
      if (user) {
        try {
          const newToken = await user.getIdToken(true);
          await chrome.storage.local.set({ 
            firebaseToken: newToken,
            tokenTimestamp: Date.now()
          });
        } catch (error) {
          console.error('Error refreshing token on check:', error);
        }
      }
    }
  }
};

// Set up token refresh listener
auth.onIdTokenChanged(async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken(true); // Force refresh
      await chrome.storage.local.set({ 
        firebaseToken: token,
        tokenTimestamp: Date.now()
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }
});

// Set up periodic token refresh check
setInterval(checkTokenRefresh, 5 * 60 * 1000); // Check every 5 minutes

// Database functions
export const saveUserData = async (userId: string, data: any) => {
  try {
    await set(ref(db, `users/${userId}`), data);
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

export const getUserData = async (userId: string) => {
  try {
    const snapshot = await get(ref(db, `users/${userId}`));
    return snapshot.val();
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const deleteUserData = async (userId: string) => {
  try {
    await remove(ref(db, `users/${userId}`));
    return true;
  } catch (error) {
    console.error('Error deleting user data:', error);
    return false;
  }
};

export const saveNotionPage = async (userId: string, pageId: string) => {
  try {
    await set(ref(db, `users/${userId}/notionPage`), pageId);
    return true;
  } catch (error) {
    console.error('Error saving Notion page:', error);
    return false;
  }
};

export const getNotionPage = async (userId: string) => {
  try {
    const snapshot = await get(ref(db, `users/${userId}/notionPage`));
    return snapshot.val();
  } catch (error) {
    console.error('Error getting Notion page:', error);
    return null;
  }
}; 