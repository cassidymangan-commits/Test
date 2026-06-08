# LoveMaxxing — mobile app

Expo (React Native) + Firebase. iOS-first, Android later.

## Setup

```bash
cd mobile
npm install
npm run ios     # iOS Simulator (requires Xcode on macOS)
npm run start   # Expo dev server — scan QR with Expo Go on your phone
```

## What's wired up

- React Navigation: root stack (Onboarding → Main tabs) + bottom tabs (Today, History, Profile)
- Placeholder screens for all four
- TypeScript strict mode
- Brand palette in `src/theme/colors.ts`

## Not wired up yet (next phases)

- Firebase init (`src/lib/firebase.ts`)
- Auth (email + Sign in with Apple)
- Couple pairing via invite code
- Firestore data layer for prompts
- Push notifications
- Cloud Function for daily prompt fan-out

## Structure

```
mobile/
├── App.tsx                          # Root, mounts NavigationContainer
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx        # Onboarding ↔ Main
│   │   ├── MainTabs.tsx             # Today / History / Profile
│   │   └── types.ts                 # Param-list types
│   ├── screens/
│   │   ├── OnboardingScreen.tsx
│   │   ├── TodayScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── theme/colors.ts
└── app.json                         # Expo config (bundle ID, plugins)
```
