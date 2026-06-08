import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getAuthInstance, getDb, firebaseConfigured } from '../lib/firebase';
import { todayDateInTz } from '../lib/prompts';
import {
  DEFAULT_NOTIFICATION_TIMES,
  SLOTS,
  promptDocId,
  type PromptDoc,
  type Slot,
} from '../lib/types';

type CoupleState = {
  id: string;
  members: string[];
  inviteCode: string | null;
  notificationTimes: Record<Slot, string>;
  primaryTimezone: string;
} | null;

type TodaySlots = Record<Slot, PromptDoc | null>;

const EMPTY_TODAY: TodaySlots = {
  morning: null,
  afternoon: null,
  night: null,
};

type AppState = {
  ready: boolean;
  configured: boolean;
  user: User | null;
  coupleId: string | null;
  couple: CoupleState;
  todaySlots: TodaySlots;
};

const Ctx = createContext<AppState>({
  ready: false,
  configured: false,
  user: null,
  coupleId: null,
  couple: null,
  todaySlots: EMPTY_TODAY,
});

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [couple, setCouple] = useState<CoupleState>(null);
  const [todaySlots, setTodaySlots] = useState<TodaySlots>(EMPTY_TODAY);

  useEffect(() => {
    if (!firebaseConfigured) {
      setReady(true);
      return;
    }
    const unsub = onAuthStateChanged(getAuthInstance(), (u) => {
      setUser(u);
      if (!u) {
        setCoupleId(null);
        setCouple(null);
        setTodaySlots(EMPTY_TODAY);
      }
      setReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(getDb(), 'users', user.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.data();
      setCoupleId((data?.coupleId as string | null) ?? null);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!coupleId) {
      setCouple(null);
      return;
    }
    const coupleRef = doc(getDb(), 'couples', coupleId);
    const unsub = onSnapshot(coupleRef, (snap) => {
      if (!snap.exists()) {
        setCouple(null);
        return;
      }
      const data = snap.data();
      setCouple({
        id: snap.id,
        members: data.members ?? [],
        inviteCode: data.inviteCode ?? null,
        notificationTimes:
          (data.notificationTimes as Record<Slot, string>) ??
          DEFAULT_NOTIFICATION_TIMES,
        primaryTimezone: data.primaryTimezone ?? 'UTC',
      });
    });
    return unsub;
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId || !couple) {
      setTodaySlots(EMPTY_TODAY);
      return;
    }
    const date = todayDateInTz(couple.primaryTimezone);
    const unsubs = SLOTS.map((slot) => {
      const id = promptDocId(date, slot);
      const ref = doc(getDb(), 'couples', coupleId, 'prompts', id);
      return onSnapshot(ref, (snap) => {
        setTodaySlots((prev) => ({
          ...prev,
          [slot]: snap.exists()
            ? ({ id: snap.id, ...(snap.data() as Omit<PromptDoc, 'id'>) } as PromptDoc)
            : null,
        }));
      });
    });
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [coupleId, couple]);

  const value = useMemo<AppState>(
    () => ({
      ready,
      configured: firebaseConfigured,
      user,
      coupleId,
      couple,
      todaySlots,
    }),
    [ready, user, coupleId, couple, todaySlots]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  return useContext(Ctx);
}
