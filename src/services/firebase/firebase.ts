// firebase.ts - Firebase Configuration and Initialization (Database only)
import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase app instance
let firebaseApp: FirebaseApp | null = null;
let database: Database | null = null;

/**
 * Initialize Firebase with custom or default configuration (Database only)
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

// Initialize Firebase on module load (Database only)
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
  getFirebaseApp,
  isFirebaseInitialized,
  resetFirebaseInstances,
  validateFirebaseConfig,
  getFirebaseConfig,
  defaultFirebaseConfig
};    