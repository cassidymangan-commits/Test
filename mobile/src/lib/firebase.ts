import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
// getReactNativePersistence is exported from the React Native bundle of
// firebase/auth, but missing from the public type declarations. The cast
// keeps strict TS happy at the import site.
import {
  // @ts-expect-error — missing from firebase/auth public types but present at runtime on RN
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

let _auth: Auth | null = null;
let _db: Firestore | null = null;

function init() {
  if (_auth && _db) return;
  if (!firebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Copy mobile/.env.example to mobile/.env and fill it in.'
    );
  }
  const app = getApps()[0] ?? initializeApp(config);
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  _db = getFirestore(app);
}

export function getAuthInstance(): Auth {
  init();
  return _auth!;
}

export function getDb(): Firestore {
  init();
  return _db!;
}
