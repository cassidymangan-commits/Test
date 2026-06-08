import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { generateInviteCode, normalizeInviteCode } from './inviteCode';

function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export async function createCouple(uid: string): Promise<string> {
  const db = getDb();
  const inviteCode = generateInviteCode();
  const coupleRef = doc(collection(db, 'couples'));
  await setDoc(coupleRef, {
    members: [uid],
    pairedAt: null,
    inviteCode,
    notificationTime: '08:00',
    primaryTimezone: localTimezone(),
    createdAt: serverTimestamp(),
  });
  await setDoc(
    doc(db, 'users', uid),
    { coupleId: coupleRef.id },
    { merge: true }
  );
  return coupleRef.id;
}

export async function joinCoupleByCode(
  uid: string,
  rawCode: string
): Promise<string> {
  const db = getDb();
  const code = normalizeInviteCode(rawCode);
  if (code.length < 4) throw new Error('That code looks too short.');

  const q = query(
    collection(db, 'couples'),
    where('inviteCode', '==', code),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Couldn't find a couple with that code.");
  const coupleDoc = snap.docs[0];

  await runTransaction(db, async (tx) => {
    const fresh = await tx.get(coupleDoc.ref);
    if (!fresh.exists()) throw new Error('Couple no longer exists.');
    const data = fresh.data();
    const members: string[] = data.members ?? [];
    if (members.includes(uid)) return;
    if (members.length >= 2) throw new Error('This couple is already full.');
    tx.update(coupleDoc.ref, {
      members: arrayUnion(uid),
      inviteCode: null,
      pairedAt: serverTimestamp(),
    });
    tx.set(
      doc(db, 'users', uid),
      { coupleId: coupleDoc.id },
      { merge: true }
    );
  });

  return coupleDoc.id;
}

export async function fetchCouple(coupleId: string) {
  const snap = await getDoc(doc(getDb(), 'couples', coupleId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as {
    id: string;
    members: string[];
    inviteCode: string | null;
    notificationTime: string;
    primaryTimezone: string;
  };
}
