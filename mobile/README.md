# LoveMaxxing — mobile app

Expo (React Native) + Firebase. iOS-first, Android later.

## Setup

```bash
cd mobile
npm install
cp .env.example .env   # fill in your Firebase web config
npm run start          # Expo dev server — scan QR with Expo Go on your phone
```

## Firebase setup

1. Create a project at https://console.firebase.google.com
2. Add a Web app to the project (Project settings → Your apps → Web). Copy the config.
3. Paste each value into `mobile/.env` (keys match `mobile/.env.example`).
4. Enable Auth providers: **Email/Password**. (Sign in with Apple will be added back closer to App Store launch — it needs Apple Developer Portal config and a dev build to test, so we're keeping it out of the dev loop for now.)
5. Create a Firestore database (start in test mode for dev; we'll add security rules in a later phase).

## What's wired up

- React Navigation: auth-aware root stack (Onboarding/SignIn → Pairing → Main tabs → PromptDetail)
- Bottom tabs: Today, History, Profile
- Auth: email/password (Sign in with Apple deferred until launch)
- Firebase Auth with AsyncStorage persistence — stays signed in across launches
- Couple pairing: create a couple, share a 6-char invite code, partner joins by code
- AppState streams `users/{uid}`, `couples/{id}`, and today's prompt via live snapshots
- **Daily prompt loop:** Today screen shows one of four states — no-prompt → compose → waiting → reveal — and updates live the moment your partner answers
- **History:** list of revealed prompts with tap-through to full detail
- **Seed prompts button** (dev only, in Profile): writes the 90 prompts from `src/data/prompts.json` to Firestore `promptBank`
- "Pull today's prompt" button on Today picks a weighted-random prompt from the bank (skipping ones used in the last 30 days). Manual for now — auto-delivery comes with the Cloud Function in Phase 3.

## How to try it end-to-end

1. Sign up on your phone (your partner does too, on theirs).
2. Profile → **Seed prompt bank** (dev) — only needs to be done once for the project.
3. One of you creates a couple, shares the invite code; the other joins.
4. Today → **Pull today's prompt** → both of you answer → reveal unlocks live.

## Not wired up yet (next phases)

- Cloud Function for daily prompt fan-out (replaces the manual "Pull" button)
- Push notification registration + token storage on the user doc
- Notification time picker in Profile
- Firestore security rules (currently relying on test-mode open access)

## Structure

```
mobile/
├── App.tsx                            # AppStateProvider + NavigationContainer
├── app.json                           # Expo config: bundle ID, notifications plugin
├── .env.example                       # Firebase config template
├── src/
│   ├── lib/
│   │   ├── firebase.ts                # Firebase init (lazy, env-driven)
│   │   ├── auth.ts                    # email sign-in / sign-up / sign-out
│   │   ├── couples.ts                 # create / join couple
│   │   ├── inviteCode.ts              # 6-char code generator
│   │   ├── prompts.ts                 # seed bank + pull today's + submit answer + history
│   │   └── types.ts                   # Firestore document types
│   ├── data/
│   │   └── prompts.json               # 90 seed prompts (canonical bank)
│   ├── state/
│   │   └── AppState.tsx               # auth + couple + today's prompt context
│   ├── navigation/
│   │   ├── RootNavigator.tsx          # auth-aware top-level stack
│   │   ├── MainTabs.tsx               # Today / History / Profile tabs
│   │   └── types.ts                   # typed param lists
│   ├── screens/
│   │   ├── OnboardingScreen.tsx
│   │   ├── SignInScreen.tsx
│   │   ├── PairingScreen.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── TodayScreen.tsx            # 4-state prompt UI
│   │   ├── HistoryScreen.tsx
│   │   ├── PromptDetailScreen.tsx
│   │   └── ProfileScreen.tsx          # has dev "Seed prompts" button
│   └── theme/colors.ts
```
