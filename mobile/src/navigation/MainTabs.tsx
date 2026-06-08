import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { colors } from '../theme/colors';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcon = (label: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{label}</Text>
);

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarIcon: tabIcon('●') }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: tabIcon('◷') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: tabIcon('◐') }}
      />
    </Tab.Navigator>
  );
}
