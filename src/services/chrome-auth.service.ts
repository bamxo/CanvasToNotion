// Chrome Identity API-based authentication service
// Maintains same interface as Firebase Auth but uses extension-native APIs

export interface UserCredential {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  getIdToken(forceRefresh?: boolean): Promise<string>;
}

// Chrome Identity implementation that matches Firebase Auth interface
export async function chromeIdentityLogin(): Promise<AuthUser> {
  try {
    // Get OAuth token using Chrome Identity API
    const result = await chrome.identity.getAuthToken({ interactive: true });
    
    if (!result.token) {
      throw new Error('Failed to get authentication token');
    }
    
    const token = result.token;
    
    // Get user info from Google OAuth
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`
    );
    const userInfo = await userInfoResponse.json();
    
    // Store the token for future use
    await chrome.storage.local.set({
      authToken: token,
      userInfo: userInfo,
      tokenTimestamp: Date.now(),
      // Store as firebaseToken for backward compatibility with existing components
      firebaseToken: token,
      userEmail: userInfo.email
    });
    
    // Create user object that matches Firebase Auth interface
    const user: AuthUser = {
      uid: userInfo.id,
      email: userInfo.email,
      displayName: userInfo.name,
      photoURL: userInfo.picture,
      getIdToken: async (forceRefresh = false): Promise<string> => {
        if (forceRefresh) {
          try {
            const freshResult = await chrome.identity.getAuthToken({ 
              interactive: false
            });
            if (freshResult.token) {
              await chrome.storage.local.set({
                authToken: freshResult.token,
                tokenTimestamp: Date.now()
              });
              return freshResult.token;
            }
          } catch (error) {
            console.warn('Failed to refresh token, using cached token', error);
          }
        }
        
        // Return cached token if refresh fails or not requested
        const stored = await chrome.storage.local.get(['authToken']);
        if (stored.authToken) {
          return stored.authToken;
        }
        
        throw new Error('No authentication token available');
      }
    };
    
    return user;
  } catch (error) {
    console.error('Chrome Identity Login Error:', error);
    throw error;
  }
}

export async function signInWithGoogle(): Promise<AuthUser> {
  return chromeIdentityLogin();
}

export async function signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
  // This would typically call your backend API for email/password auth
  // For now, throwing an error to maintain interface compatibility
  throw new Error('Email/password authentication not implemented in Chrome extension context');
}

// Mock Firebase Auth-like functions for compatibility
export class GoogleAuthProvider {
  static credential(idToken: string | null, accessToken: string) {
    return { idToken, accessToken };
  }
}

export async function signInWithCredential(auth: any, credential: any): Promise<UserCredential> {
  // Convert Chrome Identity result to Firebase-like credential
  const userInfoResponse = await fetch(
    `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${credential.accessToken}`
  );
  const userInfo = await userInfoResponse.json();
  
  return {
    user: {
      uid: userInfo.id,
      email: userInfo.email,
      displayName: userInfo.name,
      photoURL: userInfo.picture
    }
  };
}

// Auth state management compatible with existing code
export interface Auth {
  currentUser: AuthUser | null;
  signOut(): Promise<void>;
  onIdTokenChanged(callback: (user: AuthUser | null) => void): () => void;
}

let currentAuth: Auth | null = null;
let authStateListeners: ((user: AuthUser | null) => void)[] = [];

export function getAuth(): Auth {
  if (!currentAuth) {
    currentAuth = {
      currentUser: null,
      signOut: async () => {
        // Clear Chrome Identity token
        await chrome.identity.clearAllCachedAuthTokens();
        
        // Clear stored data
        await chrome.storage.local.remove([
          'authToken',
          'userInfo',
          'tokenTimestamp',
          'firebaseToken',
          'userEmail',
          'userId',
          'canvasToken'
        ]);
        
        currentAuth!.currentUser = null;
        
        // Notify listeners
        authStateListeners.forEach(listener => listener(null));
      },
      onIdTokenChanged: (callback: (user: AuthUser | null) => void) => {
        authStateListeners.push(callback);
        
        // Immediately call callback with current user state (Firebase behavior)
        setTimeout(() => callback(currentAuth!.currentUser), 0);
        
        // Return unsubscribe function
        return () => {
          const index = authStateListeners.indexOf(callback);
          if (index > -1) {
            authStateListeners.splice(index, 1);
          }
        };
      }
    };
  }
  return currentAuth;
}

// Initialize current user from storage on module load
(async () => {
  try {
    const stored = await chrome.storage.local.get(['userInfo', 'authToken', 'userEmail', 'firebaseToken']);
    const token = stored.authToken || stored.firebaseToken;
    const userInfo = stored.userInfo;
    const userEmail = stored.userEmail;
    
    if ((userInfo && token) || (userEmail && token)) {
      const auth = getAuth();
      auth.currentUser = {
        uid: userInfo?.id || userInfo?.uid || 'chrome-user',
        email: userInfo?.email || userEmail,
        displayName: userInfo?.name || userInfo?.displayName || 'Chrome User',
        photoURL: userInfo?.picture || userInfo?.photoURL || null,
        getIdToken: async () => token
      };
      
      // Notify all listeners that a user is available
      authStateListeners.forEach(listener => listener(auth.currentUser));
    }
  } catch (error) {
    console.warn('Failed to restore auth state:', error);
  }
})(); 