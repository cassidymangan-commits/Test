import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from '../lib/auth';
import { seedPromptBank } from '../lib/prompts';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';

export function ProfileScreen() {
  const { user, couple } = useAppState();
  const [seeding, setSeeding] = useState(false);

  const partnerCount = couple ? couple.members.length - 1 : 0;

  const onSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const onSeed = async () => {
    setSeeding(true);
    try {
      const count = await seedPromptBank();
      Alert.alert('Seeded', `${count} prompts written to Firestore.`);
    } catch (err) {
      Alert.alert('Seed failed', (err as Error).message);
    } finally {
      setSeeding(false);
    }
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

      {__DEV__ && (
        <View style={styles.devSection}>
          <Text style={styles.devLabel}>Developer</Text>
          <Pressable
            style={[styles.devButton, seeding && styles.buttonDisabled]}
            disabled={seeding}
            onPress={onSeed}
          >
            {seeding ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.devButtonText}>Seed prompt bank</Text>
            )}
          </Pressable>
        </View>
      )}

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
  devSection: {
    marginVertical: 12,
    gap: 8,
  },
  devLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  devButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  devButtonText: { color: colors.accent, fontSize: 15, fontWeight: '500' },
  signOut: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutText: { color: colors.accent, fontSize: 15, fontWeight: '500' },
});
