import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth, type Persistence } from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const cfg = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length ? getApp() : initializeApp(cfg);

// getReactNativePersistence lives in Firebase's react-native build (which Metro
// resolves) but isn't in the default TS types — cast to satisfy the checker.
const getReactNativePersistence = (firebaseAuth as any).getReactNativePersistence as (storage: unknown) => Persistence;

// initializeAuth throws if called twice (Fast Refresh) — fall back to getAuth.
let _auth: Auth;
try {
  _auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  _auth = getAuth(app);
}

export const auth = _auth;
