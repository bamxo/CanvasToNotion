import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  UserCredential
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function chromeIdentityLogin(): Promise<any> {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: true });
    const credential = GoogleAuthProvider.credential(null, token.token);
    const userCred = await signInWithCredential(auth, credential);
    return userCred.user;
  } catch (error) {
    console.error('Chrome Identity Login Error:', error);
    throw error;
  }
}

export async function signInWithGoogle(): Promise<UserCredential['user']> {
  return chromeIdentityLogin();
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential['user']> {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return userCred.user;
}

export const isAuthenticated = (): boolean => {
  const user = localStorage.getItem('user');
  return !!user;
};

export const logout = (): void => {
  localStorage.removeItem('user');
  // Add any other cleanup needed
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
