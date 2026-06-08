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

- React Navigation: auth-aware root stack (Onboarding/SignIn → Pairing → Main tabs)
- Bottom tabs: Today, History, Profile (placeholders, no prompt data yet)
- Auth: email/password (Sign in with Apple deferred until launch — see Phase 1+)
- Firebase Auth with AsyncStorage persistence — stays signed in across launches
- Couple pairing: create a couple, share a 6-char invite code, partner joins by code
- AppState provider streams `users/{uid}` and `couples/{id}` via Firestore live snapshots
- Profile shows display name, email, pairing state, notification time
- TypeScript strict throughout

## Not wired up yet (next phases)

- Daily prompt UI on the Today screen (write/read answers, "waiting for partner" / "reveal" states)
- History list reading from `couples/{id}/prompts`
- Push notification registration + token storage on the user doc
- Cloud Function for daily prompt fan-out
- Notification time picker in the profile
- Firestore security rules
- Seed script for `promptBank` (from the repo's `prompts.json`)

## Structure

```
mobile/
├── App.tsx                            # AppStateProvider + NavigationContainer
├── app.json                           # Expo config: bundle ID, notifications plugin
├── .env.example                       # Firebase config template
├── src/
│   ├── lib/
│   │   ├── firebase.ts                # Firebase init (lazy, env-driven)
│   │   ├── auth.ts                    # email + Apple sign-in
│   │   ├── couples.ts                 # create / join couple
│   │   ├── inviteCode.ts              # 6-char code generator
│   │   └── types.ts                   # Firestore document types
│   ├── state/
│   │   └── AppState.tsx               # auth + couple context
│   ├── navigation/
│   │   ├── RootNavigator.tsx          # auth-aware top-level stack
│   │   ├── MainTabs.tsx               # Today / History / Profile tabs
│   │   └── types.ts                   # typed param lists
│   ├── screens/
│   │   ├── OnboardingScreen.tsx
│   │   ├── SignInScreen.tsx
│   │   ├── PairingScreen.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── TodayScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── theme/colors.ts
```
