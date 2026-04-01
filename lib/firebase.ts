import { initializeApp, getApps, FirebaseApp } from "firebase/app";

// Firebase JS SDK v7.20.0+ — leadcrm-e6bd5
// Reads from NEXT_PUBLIC_ env vars; falls back to hardcoded config
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "AIzaSyC5m3QMzBhWonUkoLV50uqiCW56eAUrpJA",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "leadcrm-e6bd5.firebaseapp.com",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "leadcrm-e6bd5",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "leadcrm-e6bd5.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "506833728550",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "1:506833728550:web:b4f86c91dd027f7b75e2e7",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     ?? "G-TXQGT59SDB",
};

// Prevent re-initializing on Next.js hot-reload
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export default app;
export { firebaseConfig };
