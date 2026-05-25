import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (typeof window !== "undefined") {
  try {
    const hasAllKeys = Object.values(firebaseConfig).every(Boolean);
    if (!hasAllKeys) {
      console.warn(
        "Firebase config incomplete – set NEXT_PUBLIC_FIREBASE_* env vars"
      );
    } else if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);

      if (process.env.NEXT_PUBLIC_USE_EMULATOR === "true") {
        connectAuthEmulator(auth, "http://localhost:9099");
      }
    }
  } catch (e) {
    console.error("Firebase init failed:", e);
  }
}

export { app, auth };
