import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
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

  const inviteCode = couple?.inviteCode ?? null;
  const isWaiting = !!inviteCode && (couple?.members.length ?? 0) < 2;
  const isPaired = (couple?.members.length ?? 0) >= 2;

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

  const onShareCode = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: `Join me on LoveMaxxing — invite code: ${inviteCode}`,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Profile</Text>
      </View>

      {isWaiting && (
        <View style={styles.inviteCard}>
          <Text style={styles.inviteLabel}>Your invite code</Text>
          <Text style={styles.inviteCode}>{inviteCode}</Text>
          <Text style={styles.inviteHint}>
            Send this to your partner. The moment they enter it, you'll be paired.
          </Text>
          <Pressable style={styles.shareButton} onPress={onShareCode}>
            <Text style={styles.shareButtonText}>Share code</Text>
          </Pressable>
        </View>
      )}

      <Row label="Display name" value={user?.displayName ?? '—'} />
      <Row label="Email" value={user?.email ?? '—'} />
      <Row label="Partner" value={isPaired ? 'Paired' : 'Not paired yet'} />
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
  inviteCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 10,
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inviteCode: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 8,
  },
  inviteHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  shareButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginTop: 6,
  },
  shareButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
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
  devSection: { marginVertical: 12, gap: 8 },
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
  signOut: { paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  signOutText: { color: colors.accent, fontSize: 15, fontWeight: '500' },
});
