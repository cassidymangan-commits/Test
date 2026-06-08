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

  // Stay on Pairing until the couple has both members. Once a user creates
  // a couple, coupleId is set immediately but they still need to share the
  // invite code with their partner — otherwise they'd get bumped to Main
  // before ever seeing the code.
  const coupleLoading = coupleId !== null && couple === null;
  const fullyPaired = couple !== null && couple.members.length >= 2;

  if (user && coupleLoading) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
        </>
      ) : !fullyPaired ? (
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
