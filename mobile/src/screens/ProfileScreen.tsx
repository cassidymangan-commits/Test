import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from '../lib/auth';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';

export function ProfileScreen() {
  const { user, couple } = useAppState();

  const partnerCount = couple ? couple.members.length - 1 : 0;

  const onSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Profile</Text>
      </View>

      <Row label="Display name" value={user?.displayName ?? '—'} />
      <Row label="Email" value={user?.email ?? '—'} />
      <Row
        label="Partner"
        value={partnerCount > 0 ? 'Paired' : 'Not paired yet'}
      />
      <Row label="Daily notification" value={couple?.notificationTime ?? '—'} />
      <Row label="Timezone" value={couple?.primaryTimezone ?? '—'} />

      <View style={{ flex: 1 }} />

      <Pressable style={styles.signOut} onPress={onSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  header: { paddingTop: 16, paddingBottom: 16 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  rowLabel: { fontSize: 15, color: colors.text },
  rowValue: {
    fontSize: 15,
    color: colors.textMuted,
    flexShrink: 1,
    textAlign: 'right',
  },
  signOut: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutText: { color: colors.accent, fontSize: 15, fontWeight: '500' },
});
