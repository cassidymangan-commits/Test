import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getAuthInstance, getDb } from './firebase';

function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

async function ensureUserDoc(uid: string, displayName: string) {
  const db = getDb();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid,
    displayName,
    coupleId: null,
    expoPushToken: null,
    timezone: localTimezone(),
    createdAt: serverTimestamp(),
  });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const { user } = await createUserWithEmailAndPassword(
    getAuthInstance(),
    email,
    password
  );
  await ensureUserDoc(user.uid, displayName || email.split('@')[0]);
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(
    getAuthInstance(),
    email,
    password
  );
  await ensureUserDoc(user.uid, user.displayName ?? email.split('@')[0]);
  return user;
}

export async function signOut() {
  await fbSignOut(getAuthInstance());
}
