import { useState, useEffect } from 'react';
import { auth } from '../services/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export function useAuth() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setUserEmail(user.email);
        setIsAuthenticated(true);
        // Store email in chrome storage when we get it from auth
        await chrome.storage.local.set({ userEmail: user.email });
      } else {
        // If we don't have a user email from auth state, try to get it from storage
        chrome.storage.local.get(['userEmail'], (result) => {
          if (result.userEmail) {
            setUserEmail(result.userEmail);
            setIsAuthenticated(true);
          } else {
            setUserEmail(null);
            setIsAuthenticated(false);
          }
        });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    userEmail,
    isAuthenticated,
    isLoading
  };
} 