// src/services/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
const firebaseConfig = {
  apiKey: "AIzaSyDJ4TOuZQq2715GWU9JlfCE-YU8CXkPNdU",
  authDomain: "canvas2notion-3cd84.firebaseapp.com",
  databaseURL: "https://canvas2notion-3cd84-default-rtdb.firebaseio.com",
  projectId: "canvas2notion-3cd84",
  storageBucket: "canvas2notion-3cd84.firebasestorage.app",
  messagingSenderId: "298819183658",
  appId: "1:298819183658:web:af9cfd048b30bb12e0cf53",
  measurementId: "G-ZS86NGWBPG"
};


// Initialize only once
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);