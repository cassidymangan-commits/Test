# LoveMaxxing — Design Doc

**LoveMaxxing** — a two-person app for couples to share notes, photos, and love letters, and to answer a daily prompt together. Maximizing the love, daily.

## v1 Scope

The smallest version that feels alive on day one.

- **Platform:** iOS first (Apple Developer account in hand). Android in a later phase.
- **Pricing:** paid upfront, **$2.99**. No IAP plumbing in v1.
- **Pair up:** two users link into one couple-space via an invite code.
- **Daily prompt:** every day at the couple's chosen time, a new question lands in both partners' inboxes via push notification. Tap the notification to read the prompt, then answer when ready. Both answers unlock once both have replied.
- **Prompt history:** scroll back through past prompts and answers.
- **Auth + profile:** sign in with email or Apple, set display name + avatar, set the couple's daily notification time.

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
  notificationTime: string    // "HH:mm" in primary timezone, e.g. "08:00"
  primaryTimezone: string     // first member's tz; used for daily delivery

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

1. **Scheduled Cloud Function** runs every 15 minutes. For each couple whose `notificationTime` falls in the just-elapsed window (in their `primaryTimezone`), it:
   - Picks a prompt from `promptBank` (weighted random, excluding prompts used in the last N days).
   - Creates `couples/{coupleId}/prompts/{promptId}` with `promptDate = today`.
   - Sends a push to both members' `expoPushToken`s. Notification body contains the prompt text so tapping it opens straight to the answer composer.
2. **Client** opens to today's prompt card. Either partner can read the prompt first, then answer privately when ready.
3. When a partner submits, a Firestore `onUpdate` trigger checks if both answers are present. If yes, it sets `unlockedAt` and sends a "your partner answered!" push to both.
4. Once unlocked, both answers render side-by-side.

**Edge cases to handle:**
- One partner never answers — prompt stays in "waiting" state; next day's prompt arrives anyway.
- Partners in different timezones — use the couple's "primary" timezone (first member's) for v1; revisit if real users hit this.
- Re-pairing / breakups — out of scope for v1, but the data model supports it (set `coupleId = null` on user).

## Prompt Bank (starter set)

**Tone:** range. Chaotic-good on the loud days, genuinely tender on the quiet ones. The shuffle is the point — some mornings you wake up to a Netflix-doc joke, some mornings you wake up to "how are you, really?" That contrast is what makes the loop stick.

Seeded with **90 prompts** across 11 categories, split roughly half irreverent / half sincere. Bank lives in `prompts.json` and is loaded into Firestore via a one-off script. New prompts can be added without an app update.

### Irreverent track (~half the bank)

**🥊 roast** — light roast, brutal honesty
*"Rank my top 5 most annoying habits. No wrong answers."*

**🎬 realityshow** — Netflix-doc / Love Island brain
*"If our relationship got a Netflix documentary, what's the title?"*

**🧠 hottake** — chaos lore, opinions, Roman Empire energy
*"What's a brand or store that's so 'me' it's almost a slur?"*

**🥪 cursed** — unhinged hypotheticals
*"We have to commit one (1) federal crime together. What is it?"*

**📊 rank** — rate / rank chaos
*"Rate this week from 1–10. Defend your answer."*

**🔮 future** — chaotic future scenarios
*"We retire tomorrow. What's the first dumb thing we buy?"*

### Sincere track (~half the bank)

**❤️ soft** — playful-meets-sincere, the bridge
*"What's something I do that you find weirdly hot?"*

**🙏 gratitude** — appreciation, recognition
*"Tell me one thing I've grown into since we met."*

**🌊 deep** — real check-ins, vulnerability, reflection
*"How are you, really? Not the short answer."*
*"What's a fear about us you haven't said out loud?"*

**📷 memory** — sincere shared memory
*"What's the first time you knew you loved me — really knew?"*

**🌅 dreams** — sincere shared future
*"What's a version of our life you sometimes think about but haven't said out loud?"*

### Selection logic

Weighted random pick from `promptBank`, excluding prompts answered in the last N days. To keep the tone-mix feeling intentional rather than random:

- Per-category cooldown (no two-day-in-a-row of the same category)
- Soft preference for rotating between the irreverent and sincere tracks day-to-day
- All weights start at 1.0; hand-tune favorites once we see what lands

**Content policy:** edgy but App-Store-safe. No sex acts, no slurs, no targeting protected categories. "Cursed" and "unhinged" are fine; explicit is not. A future "after dark" pack could ship as an IAP if there's appetite.

## Screens (v1)

1. **Onboarding** — sign in (email or Apple) → create or join couple (invite code) → set timezone, daily notification time, and push permission.
2. **Today** — today's prompt card. Read the prompt up top; below it is either the "answer" composer, "waiting for partner" state (your answer locked in, theirs pending), or "both answered" reveal showing both side-by-side.
3. **History** — scrollable list of past prompts with both answers.
4. **Profile** — name, avatar, partner info, daily notification time picker, sign out.

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

## Decisions Locked

1. **Name:** **LoveMaxxing**. Bundle ID placeholder: `app.lovemaxxing`. (Verify availability on App Store + USPTO before locking.)
2. **Notification time:** user-configurable per couple, set during onboarding and editable in Profile.
3. **Prompt UX:** read-then-answer (tap notification → see prompt → answer when ready).
4. **Pricing:** paid upfront, **$2.99**. No IAP/subscription plumbing in v1.
5. **Platform priority:** iOS first (Apple Developer account in hand). Android added in a later phase.

## Next Steps

1. `npx create-expo-app` scaffold + Firebase project setup.
2. Auth (email + Sign in with Apple) + couple pairing flow end-to-end.
3. Prompt bank seeded; today/history screens reading from Firestore.
4. Cloud Function for daily fan-out + push notifications, honoring per-couple `notificationTime`.
5. TestFlight build for real-device testing.
