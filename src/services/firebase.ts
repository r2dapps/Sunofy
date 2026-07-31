import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  databaseURL: (import.meta as any).env.VITE_FIREBASE_DB_URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
