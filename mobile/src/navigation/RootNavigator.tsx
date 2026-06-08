import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoadingScreen } from '../screens/LoadingScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PairingScreen } from '../screens/PairingScreen';
import { PromptDetailScreen } from '../screens/PromptDetailScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { useAppState } from '../state/AppState';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { ready, user, coupleId, couple } = useAppState();

  if (!ready) return <LoadingScreen />;

  // Once the user has a coupleId on their user doc we drop them into Main —
  // the invite code (visible until the partner joins) lives on Profile + Today
  // so they don't lose access to the rest of the app while waiting.
  const coupleLoading = coupleId !== null && couple === null;

  if (user && coupleLoading) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
        </>
      ) : !coupleId ? (
        <Stack.Screen name="Pairing" component={PairingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="PromptDetail" component={PromptDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
