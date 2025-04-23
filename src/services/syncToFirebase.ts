// src/services/syncToFirebase.ts
import { auth, db } from './firebaseConfig'; // Correct path to firebaseConfig

// Other imports
import { ref, set } from 'firebase/database';
import { signInWithEmailAndPassword } from 'firebase/auth';

export const syncCanvasDataForUser = async (payload: { courses: any[], assignments: any[] }) => {
  try {
    const email = 'test1@example.com';
    const password = 'password123';

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Logged in as:', user.email);

    const dataToStore = {
      timestamp: new Date().toISOString(),
      courses: payload.courses,
      assignments: payload.assignments,
    };

    const userRef = ref(db, `users/${user.uid}/canvasData`);
    await set(userRef, dataToStore);

    console.log('✅ Successfully synced Canvas data to Firebase!');
  } catch (err) {
    console.error('❌ Failed to log in or sync Canvas data:', err);
  }
};
