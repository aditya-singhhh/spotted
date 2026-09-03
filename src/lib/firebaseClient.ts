'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// These NEXT_PUBLIC_* values are safe to expose to the browser — Firebase
// projects are protected by Security Rules (see firestore.rules), not by
// keeping this config secret.
//
// Note: this project deliberately does NOT use Firebase Storage — as of
// Feb 2026 it requires the paid Blaze plan even for the free-tier usage
// quota. Photo uploads instead go straight to Cloudinary (see
// src/lib/cloudinary.ts), which has a genuinely free tier with no card
// required. Everything else (Firestore + Auth) stays on Firebase's free
// Spark plan.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Local-only switch. Set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true in .env.local
// to use Auth + Firestore Emulator Suite without any live Firebase calls.
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && typeof window !== 'undefined') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
