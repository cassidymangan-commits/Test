# Relationship App — Design Doc

A two-person app for couples to share notes, photos, and love letters, and to answer a daily prompt together.

## v1 Scope

The smallest version that feels alive on day one.

- **Pair up:** two users link into one couple-space via an invite code.
- **Daily prompt:** every day a new question/template lands in both partners' inboxes via push notification. Each partner answers privately, then both answers unlock once both have replied.
- **Prompt history:** scroll back through past prompts and answers.
- **Auth + profile:** sign in with email or Apple/Google, set display name + avatar.

Notes, photos, and love letters are **v2** — see roadmap. Building v1 narrow keeps the daily-prompt loop sharp before adding surface area.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Client | React Native (Expo) | iOS + Android from one codebase; Expo handles push, image picker, notifications config |
| Auth | Firebase Auth | Email + Apple + Google out of the box |
| Database | Firestore | Realtime listeners fit the "partner just answered" UX |
| Storage | Firebase Storage | For avatars and v2 photo sharing |
| Push | Expo Notifications + FCM/APNs | Expo wraps both stores; daily prompt fan-out via Cloud Function |
| Scheduling | Cloud Functions (scheduled) | One cron job per day picks the prompt + sends notifications |

**Why Expo over bare React Native:** the daily-prompt feature lives or dies on push notifications working reliably. Expo's push service is the shortest path; we can eject later if needed.

## Data Model (Firestore)

```
users/{userId}
  displayName: string
  avatarUrl: string
  coupleId: string | null
  expoPushToken: string
  timezone: string         // for "daily" delivery
  createdAt: timestamp

couples/{coupleId}
  members: [userId, userId]
  pairedAt: timestamp
  inviteCode: string | null   // null once second member joins

couples/{coupleId}/prompts/{promptId}
  promptText: string
  promptDate: date            // YYYY-MM-DD in couple's timezone
  templateId: string          // ref to prompt bank
  answers: {
    [userId]: { text: string, answeredAt: timestamp }
  }
  unlockedAt: timestamp | null   // set when both have answered

promptBank/{templateId}        // global, not per-couple
  text: string
  category: string             // "memory", "future", "appreciation", "playful"
  weight: number               // for weighted random selection
```

**Notes:**
- Answers are stored on the prompt doc itself rather than a subcollection — simpler reads, and a prompt only ever has 2 answers.
- Security rules: a user can only read/write docs where their `userId` is in `couples/{coupleId}.members`.
- The "answers unlock once both reply" rule is enforced **server-side** in rules — clients can write their own answer but cannot read the partner's until `unlockedAt` is set.

## Daily Prompt Loop

This is the heart of v1, so it gets its own section.

1. **Scheduled Cloud Function** runs hourly. For each couple whose local midnight just passed (based on their timezone), it:
   - Picks a prompt from `promptBank` (weighted random, excluding prompts used in the last N days).
   - Creates `couples/{coupleId}/prompts/{promptId}` with `promptDate = today`.
   - Sends a push to both members' `expoPushToken`s.
2. **Client** opens to today's prompt card. Each partner types their answer privately.
3. When a partner submits, a Firestore `onUpdate` trigger checks if both answers are present. If yes, it sets `unlockedAt` and sends a "your partner answered!" push to both.
4. Once unlocked, both answers render side-by-side.

**Edge cases to handle:**
- One partner never answers — prompt stays in "waiting" state; next day's prompt arrives anyway.
- Partners in different timezones — use the couple's "primary" timezone (first member's) for v1; revisit if real users hit this.
- Re-pairing / breakups — out of scope for v1, but the data model supports it (set `coupleId = null` on user).

## Prompt Bank (starter set)

Seed with ~50 prompts across these categories so day-to-day feels varied:

- **Memory:** "What's a small moment with me you keep coming back to?"
- **Appreciation:** "What's something I did this week you didn't get a chance to thank me for?"
- **Future:** "Pick a city we've never been to and tell me what we'd do on day one."
- **Playful:** "If I were a snack, which one would I be and why?"
- **Check-in:** "How full is your cup today, 1–10? What would top it up?"

Bank lives in a JSON file in the repo and is seeded into Firestore via a one-off script.

## Screens (v1)

1. **Onboarding** — sign in → create or join couple (invite code) → set timezone + push permission.
2. **Today** — today's prompt card. Either "answer" composer, "waiting for partner" state, or "both answered" reveal.
3. **History** — scrollable list of past prompts with both answers.
4. **Profile** — name, avatar, partner info, notification time, sign out.

Four screens. No tab clutter; bottom nav with Today / History / Profile.

## Roadmap

**v1 — Daily prompts (this doc)**
Pair up, daily push, answer + reveal, history.

**v2 — Shared content**
- Shared notes (lightweight messages outside the prompt structure)
- Photo sharing (Firebase Storage + a shared album view)

**v3 — Love letters**
- Long-form rich text composer
- Schedule a letter to deliver on a future date ("read on our anniversary")

**v4 — Polish**
- Streaks, gentle reminders, custom prompt categories, export-as-keepsake (PDF of a year of answers).

## Open Questions

Things to decide before coding starts:

1. **App name?** Placeholder needed for bundle ID, app store listing, branding.
2. **Notification time?** Fixed (e.g. 8am local) or user-configurable per couple?
3. **Can either partner see the prompt before answering, or only after they commit to answer?** Affects whether prompts feel like a surprise or a planned conversation.
4. **Free or paid?** Affects whether we need IAP/subscription plumbing in v1 or can defer.
5. **Apple Developer + Google Play accounts** — required to actually ship; ~$100 + $25 one-time. Not blocking dev but blocking distribution.

## Next Steps

Once the above is approved:

1. `npx create-expo-app` scaffold + Firebase project setup.
2. Auth + couple pairing flow end-to-end.
3. Prompt bank seeded; today/history screens reading from Firestore.
4. Cloud Function for daily fan-out + push notifications.
5. TestFlight / Play internal track build for real-device testing.
