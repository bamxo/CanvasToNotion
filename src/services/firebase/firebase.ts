// firebase.ts - Firebase Configuration and Initialization
import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Default Firebase configuration
const defaultFirebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyDJ4TOuZQq2715GWU9JlfCE-YU8CXkPNdU",
  authDomain: "canvas2notion-3cd84.firebaseapp.com",
  databaseURL: "https://canvas2notion-3cd84-default-rtdb.firebaseio.com",
  projectId: "canvas2notion-3cd84",
  storageBucket: "canvas2notion-3cd84.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase app instance
let firebaseApp: FirebaseApp | null = null;
let database: Database | null = null;
let auth: Auth | null = null;

/**
 * Initialize Firebase with custom or default configuration
 * @param config - Optional custom Firebase configuration
 * @returns Firebase app instance
 */
export const initializeFirebase = (config?: FirebaseConfig): FirebaseApp => {
  try {
    const configToUse = config || defaultFirebaseConfig;
    
    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(configToUse);
    }
    
    return firebaseApp;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw new Error(`Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get Firebase database instance
 * @returns Database instance
 */
export const getFirebaseDatabase = (): Database => {
  try {
    if (!firebaseApp) {
      firebaseApp = initializeFirebase();
    }
    
    if (!database) {
      database = getDatabase(firebaseApp);
    }
    
    return database;
  } catch (error) {
    console.error('Error getting Firebase database:', error);
    throw new Error(`Failed to get Firebase database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get Firebase auth instance
 * @returns Auth instance
 */
export const getFirebaseAuth = (): Auth => {
  try {
    if (!firebaseApp) {
      firebaseApp = initializeFirebase();
    }
    
    if (!auth) {
      auth = getAuth(firebaseApp);
    }
    
    return auth;
  } catch (error) {
    console.error('Error getting Firebase auth:', error);
    throw new Error(`Failed to get Firebase auth: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get Firebase app instance
 * @returns Firebase app instance or null if not initialized
 */
export const getFirebaseApp = (): FirebaseApp | null => {
  return firebaseApp;
};

/**
 * Check if Firebase is initialized
 * @returns boolean indicating if Firebase is initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return firebaseApp !== null && getApps().length > 0;
};

/**
 * Reset Firebase instances (useful for testing)
 */
export const resetFirebaseInstances = (): void => {
  firebaseApp = null;
  database = null;
  auth = null;
};

/**
 * Validate Firebase configuration
 * @param config - Firebase configuration to validate
 * @returns boolean indicating if configuration is valid
 */
export const validateFirebaseConfig = (config: FirebaseConfig): boolean => {
  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'databaseURL',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  return requiredFields.every(field => {
    const value = config[field];
    return typeof value === 'string' && value.trim().length > 0;
  });
};

/**
 * Get Firebase configuration (without sensitive data)
 * @returns Sanitized Firebase configuration
 */
export const getFirebaseConfig = (): Omit<FirebaseConfig, 'apiKey'> => {
  const { apiKey, ...sanitizedConfig } = defaultFirebaseConfig;
  return sanitizedConfig;
};

// Initialize Firebase on module load
try {
  initializeFirebase();
} catch (error) {
  console.warn('Firebase initialization failed on module load:', error);
}

// Export default configuration and instances
export { defaultFirebaseConfig };
export default {
  initializeFirebase,
  getFirebaseDatabase,
  getFirebaseAuth,
  getFirebaseApp,
  isFirebaseInitialized,
  resetFirebaseInstances,
  validateFirebaseConfig,
  getFirebaseConfig,
  defaultFirebaseConfig
};    