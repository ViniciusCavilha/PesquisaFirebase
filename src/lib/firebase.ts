import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDKKzGF4Aaghr1g58Fnmu3DGVb_KC4svLQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pesquisafirebase-25211.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pesquisafirebase-25211',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pesquisafirebase-25211.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '224318029053',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:224318029053:web:0456264e23415b32cc9294',
};

export const firebaseReady = Object.values(config).every(Boolean);
export const firebaseApp = firebaseReady ? initializeApp(config) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;

export { config as firebaseConfig };
