// db.js - Firebase User Data Utilities
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, query, orderByChild, equalTo, update } from 'firebase/database';
import { defaultFirebaseConfig } from './firebase';

// Initialize Firebase using centralized configuration
const app = initializeApp(defaultFirebaseConfig);
const db = getDatabase(app);

/**
 * Get user data by email
 * @param {string} email - The email to search for
 * @returns {Promise<Object>} Object containing userId, accessToken, and userData
 */
export const getUserDataByEmail = async (email: string) => {
  try {
    // Create a reference to the users node
    const usersRef = ref(db, 'users');
    
    // Query for the user with the matching email
    const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));
    
    const snapshot = await get(emailQuery);
    
    if (snapshot.exists()) {
      // Since email should be unique, there should only be one match
      let userId = null;
      let accessToken = null;
      let userData = null;
      
      // The snapshot will contain the user(s) that match the query
      snapshot.forEach((childSnapshot) => {
        userId = childSnapshot.key; // This is the user ID
        userData = childSnapshot.val(); // This contains all the user data
        accessToken = userData.accessToken;
        
        // Since we expect only one result, we can break
        return true;
      });
      
      if (userId) {
        return {
          userId,
          accessToken,
          userData
        };
      } else {
        throw new Error("User data structure is unexpected");
      }
    } else {
      throw new Error("No user found with this email");
    }
  } catch (error) {
    console.error("Error fetching user data by email:", error);
    throw error;
  }
};

/**
 * Get access token for a specific user by ID
 * @param {string} userId - The user ID
 * @returns {Promise<string>} The access token
 */
export const getAccessTokenForUser = async (userId: string) => {
  try {
    // Create a reference to the specific user
    const userRef = ref(db, `users/${userId}`);
    
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const accessToken = userData.accessToken;
      
      if (accessToken) {
        return accessToken;
      } else {
        throw new Error("Access token not found for this user");
      }
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error fetching access token:", error);
    throw error;
  }
};

/**
 * Update access token for a user
 * @param {string} userId - The user ID
 * @param {string} newAccessToken - The new access token to set
 * @returns {Promise<void>}
 */
export const updateAccessToken = async (userId: string, newAccessToken: string) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
      accessToken: newAccessToken
    });
    return true;
  } catch (error) {
    console.error("Error updating access token:", error);
    throw error;
  }
};

export default {
  db,
  getUserDataByEmail,
  getAccessTokenForUser,
  updateAccessToken
};