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

**Tone:** chaotic-good. Funny, playful, occasionally unhinged, lightly roast-y, with real intimacy underneath. Think "your group chat with one person." Not earnest, not horny — the App Store cares.

Seed with ~60 prompts across these categories so day-to-day feels varied. Examples below — the real bank ships in `prompts.json`.

**🥊 Light roast / brutal honesty**
- "Rank my top 5 most annoying habits. No wrong answers."
- "What's a hill I'd die on that you actually agree with but won't admit?"
- "What's a compliment I give myself that you secretly think is cope?"
- "If I were a Wikipedia article, what would the 'Controversies' section say?"

**🎬 Reality-show brain**
- "If our relationship got a Netflix documentary, what's the title?"
- "Cast us as a reality show. Show name, premise, and who's the villain edit."
- "What's the trailer voiceover for our last argument?"
- "If we had a tag-team wrestling name, what is it?"

**🧠 Hot takes & lore**
- "What's my Roman Empire? You know the one."
- "What's a take I have that's so wrong it's basically a personality trait?"
- "Three words that would summon me from across a room."
- "Pitch my villain origin story. What's the inciting incident?"

**🥪 Cursed hypotheticals**
- "If I were a sandwich, what's on it and why is it slightly cursed?"
- "We have to commit one (1) federal crime together. What is it?"
- "We're a two-person cult. What do we worship?"
- "I die tragically. What's the most chaotic thing in my eulogy?"

**❤️ Soft underneath (the secret weapon)**
- "What's something I do that you find weirdly hot?"
- "When was the last time I made you feel safe? Be specific."
- "What's a small thing I did this week that you're still thinking about?"
- "If you had to bottle a feeling I give you, what's on the label?"

**📊 Rank / rate**
- "Rate this week from 1–10. Defend your answer."
- "Rank our last 5 dates. The worst one is now law."
- "On a scale of 1 to red flag, how concerning is my last Spotify Wrapped?"

**🔮 Future chaos**
- "Pick a city we've never been to. We're going. What do we do day one?"
- "We retire tomorrow. What's the first dumb thing we buy?"
- "Plan our funeral. Mine first. Make it humiliating."

Bank lives in `prompts.json` in the repo and is seeded into Firestore via a one-off script. New prompts can be added without an app update.

**Content policy:** keep prompts edgy but App-Store-safe. No sex acts, no slurs, no targeting protected categories. "Cursed" and "unhinged" are fine; explicit is not. A separate "spicy mode" pack could ship as a v2 IAP if there's appetite.

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
