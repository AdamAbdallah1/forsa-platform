import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDD4V1u0xxmGCiEa8RILpQFsF0-8Rkg6gs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "forsa-platfrom.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "forsa-platfrom",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "forsa-platfrom.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "571366213811",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:571366213811:web:37b92270a287704e4e88c6",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);