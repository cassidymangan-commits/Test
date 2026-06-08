import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createCouple, joinCoupleByCode } from '../lib/couples';
import { signOut } from '../lib/auth';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';

type Mode = 'choose' | 'created' | 'join';

export function PairingScreen() {
  const { user, couple } = useAppState();
  const [mode, setMode] = useState<Mode>(couple?.inviteCode ? 'created' : 'choose');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const shownCode = couple?.inviteCode ?? null;

  const onCreate = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await createCouple(user.uid);
      setMode('created');
    } catch (err) {
      Alert.alert('Could not create couple', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async () => {
    if (!user) return;
    if (!code.trim()) {
      Alert.alert('Missing code', 'Enter the invite code from your partner.');
      return;
    }
    setBusy(true);
    try {
      await joinCoupleByCode(user.uid, code);
    } catch (err) {
      Alert.alert("Couldn't join", (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    if (!shownCode) return;
    await Share.share({
      message: `Join me on LoveMaxxing — invite code: ${shownCode}`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {mode === 'choose' && (
          <>
            <Text style={styles.heading}>Pair up</Text>
            <Text style={styles.sub}>
              Create a couple and share the code with your partner, or enter
              their code to join.
            </Text>
            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              disabled={busy}
              onPress={onCreate}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create a couple</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setMode('join')}
            >
              <Text style={styles.secondaryButtonText}>
                I have an invite code
              </Text>
            </Pressable>
          </>
        )}

        {mode === 'created' && (
          <>
            <Text style={styles.heading}>Send them this code</Text>
            <Text style={styles.sub}>
              Once your partner enters it, you'll get your first prompt.
            </Text>
            <View style={styles.codeBox}>
              <Text style={styles.code}>{shownCode ?? '······'}</Text>
            </View>
            <Pressable style={styles.button} onPress={onShare}>
              <Text style={styles.buttonText}>Share code</Text>
            </Pressable>
            <Text style={styles.waiting}>Waiting for your partner…</Text>
          </>
        )}

        {mode === 'join' && (
          <>
            <Text style={styles.heading}>Enter invite code</Text>
            <Text style={styles.sub}>
              Type the 6-character code your partner sent you.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="ABC123"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
            />
            <Pressable
              style={[styles.button, busy && styles.buttonDisabled]}
              disabled={busy}
              onPress={onJoin}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Join</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setMode('choose')}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </Pressable>
          </>
        )}
      </View>

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center', gap: 14 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  sub: { fontSize: 15, color: colors.textMuted, marginBottom: 12 },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { alignItems: 'center', paddingVertical: 14 },
  secondaryButtonText: { color: colors.accent, fontSize: 15, fontWeight: '500' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    marginVertical: 8,
  },
  code: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 8,
  },
  waiting: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  signOut: { padding: 16, alignItems: 'center' },
  signOutText: { color: colors.textMuted, fontSize: 14 },
});
