import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, Firestore } from "firebase/firestore";

let db: Firestore | null = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if project ID is defined (verifying Firebase setup)
const isFirebaseConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (typeof window !== "undefined" && isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
    console.log("🔥 Firebase initialized successfully (Long Polling forced).");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
  }
} else {
  console.log("🔌 Firebase not configured. Falling back to LocalStorage.");
}

export { db };
