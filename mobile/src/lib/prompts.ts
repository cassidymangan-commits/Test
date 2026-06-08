import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import promptBankSeed from '../data/prompts.json';
import { getDb } from './firebase';
import type { PromptCategory, PromptDoc } from './types';

type PromptBankEntry = {
  id: string;
  category: PromptCategory;
  weight: number;
  text: string;
};

const seed = promptBankSeed as PromptBankEntry[];

export function todayDateInTz(tz: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function promptRef(coupleId: string, promptId: string) {
  return doc(getDb(), 'couples', coupleId, 'prompts', promptId);
}

function promptsCollection(coupleId: string) {
  return collection(getDb(), 'couples', coupleId, 'prompts');
}

export async function seedPromptBank(): Promise<number> {
  const db = getDb();
  const batch = writeBatch(db);
  for (const entry of seed) {
    batch.set(doc(db, 'promptBank', entry.id), {
      text: entry.text,
      category: entry.category,
      weight: entry.weight,
    });
  }
  await batch.commit();
  return seed.length;
}

async function pickRandomTemplate(coupleId: string): Promise<PromptBankEntry> {
  const db = getDb();
  const bankSnap = await getDocs(collection(db, 'promptBank'));
  const bank: PromptBankEntry[] = bankSnap.empty
    ? seed
    : bankSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PromptBankEntry, 'id'>),
      }));

  const recent = await getDocs(
    query(promptsCollection(coupleId), orderBy('createdAt', 'desc'), limit(30))
  );
  const used = new Set(recent.docs.map((d) => d.data().templateId as string));
  const available = bank.filter((p) => !used.has(p.id));
  const pool = available.length > 0 ? available : bank;

  const totalWeight = pool.reduce((s, p) => s + (p.weight ?? 1), 0);
  let r = Math.random() * totalWeight;
  for (const p of pool) {
    r -= p.weight ?? 1;
    if (r <= 0) return p;
  }
  return pool[pool.length - 1];
}

export async function pullPromptForToday(
  coupleId: string,
  primaryTimezone: string
): Promise<string> {
  const promptId = todayDateInTz(primaryTimezone);
  const ref = promptRef(coupleId, promptId);
  const existing = await getDoc(ref);
  if (existing.exists()) return promptId;

  const template = await pickRandomTemplate(coupleId);
  await setDoc(ref, {
    promptText: template.text,
    promptDate: promptId,
    templateId: template.id,
    category: template.category,
    answers: {},
    unlockedAt: null,
    createdAt: serverTimestamp(),
  });
  return promptId;
}

export async function submitAnswer(
  coupleId: string,
  promptId: string,
  uid: string,
  text: string
): Promise<void> {
  const ref = promptRef(coupleId, promptId);
  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Prompt no longer exists.');
    const data = snap.data();
    const answers = {
      ...(data.answers ?? {}),
      [uid]: { text, answeredAt: Timestamp.now() },
    };
    const update: Record<string, unknown> = { answers };
    if (Object.keys(answers).length >= 2 && !data.unlockedAt) {
      update.unlockedAt = serverTimestamp();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx.update(ref, update as any);
  });
}

export async function fetchPromptHistory(
  coupleId: string,
  max = 50
): Promise<PromptDoc[]> {
  const q = query(
    promptsCollection(coupleId),
    where('unlockedAt', '!=', null),
    orderBy('unlockedAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PromptDoc, 'id'>) }));
}

export async function fetchPrompt(
  coupleId: string,
  promptId: string
): Promise<PromptDoc | null> {
  const snap = await getDoc(promptRef(coupleId, promptId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<PromptDoc, 'id'>) };
}
