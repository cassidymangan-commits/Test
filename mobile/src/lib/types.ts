import type { Timestamp } from 'firebase/firestore';

export type UserDoc = {
  uid: string;
  displayName: string;
  coupleId: string | null;
  expoPushToken: string | null;
  timezone: string;
  createdAt: Timestamp;
};

export type Slot = 'morning' | 'afternoon' | 'night';

export const SLOTS: Slot[] = ['morning', 'afternoon', 'night'];

export const SLOT_LABEL: Record<Slot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};

export const DEFAULT_NOTIFICATION_TIMES: Record<Slot, string> = {
  morning: '08:00',
  afternoon: '13:00',
  night: '20:00',
};

export type CoupleDoc = {
  id: string;
  members: string[];
  pairedAt: Timestamp | null;
  inviteCode: string | null;
  notificationTimes: Record<Slot, string>;
  primaryTimezone: string;
};

export type PromptCategory =
  | 'roast'
  | 'realityshow'
  | 'hottake'
  | 'cursed'
  | 'soft'
  | 'gratitude'
  | 'deep'
  | 'memory'
  | 'dreams'
  | 'rank'
  | 'future';

export const SLOT_CATEGORY_POOLS: Record<Slot, PromptCategory[]> = {
  morning: ['hottake', 'realityshow', 'rank', 'cursed', 'roast'],
  afternoon: ['soft', 'gratitude', 'future', 'roast', 'realityshow'],
  night: ['deep', 'memory', 'dreams', 'gratitude', 'soft'],
};

export type PromptDoc = {
  id: string;
  promptText: string;
  promptDate: string;
  slot: Slot;
  templateId: string;
  category: PromptCategory;
  answers: Record<string, { text: string; answeredAt: Timestamp }>;
  unlockedAt: Timestamp | null;
  createdAt: Timestamp;
};

export function promptDocId(date: string, slot: Slot): string {
  return `${date}_${slot}`;
}
