import type { Timestamp } from 'firebase/firestore';

export type UserDoc = {
  uid: string;
  displayName: string;
  coupleId: string | null;
  expoPushToken: string | null;
  timezone: string;
  createdAt: Timestamp;
};

export type CoupleDoc = {
  id: string;
  members: string[];
  pairedAt: Timestamp | null;
  inviteCode: string | null;
  notificationTime: string;
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

export type PromptDoc = {
  id: string;
  promptText: string;
  promptDate: string;
  templateId: string;
  category: PromptCategory;
  answers: Record<string, { text: string; answeredAt: Timestamp }>;
  unlockedAt: Timestamp | null;
  createdAt: Timestamp;
};
