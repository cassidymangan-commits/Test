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

type CoupleState = {
  id: string;
  members: string[];
  inviteCode: string | null;
  notificationTime: string;
  primaryTimezone: string;
} | null;

type AppState = {
  ready: boolean;
  configured: boolean;
  user: User | null;
  coupleId: string | null;
  couple: CoupleState;
};

const Ctx = createContext<AppState>({
  ready: false,
  configured: false,
  user: null,
  coupleId: null,
  couple: null,
});

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [couple, setCouple] = useState<CoupleState>(null);

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
        notificationTime: data.notificationTime ?? '08:00',
        primaryTimezone: data.primaryTimezone ?? 'UTC',
      });
    });
    return unsub;
  }, [coupleId]);

  const value = useMemo<AppState>(
    () => ({
      ready,
      configured: firebaseConfigured,
      user,
      coupleId,
      couple,
    }),
    [ready, user, coupleId, couple]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  return useContext(Ctx);
}
