import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmail, signUpWithEmail } from '../lib/auth';
import { firebaseConfigured } from '../lib/firebase';
import { colors } from '../theme/colors';

type Mode = 'signin' | 'signup';

export function SignInScreen() {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!firebaseConfigured) {
      Alert.alert(
        'Firebase not configured',
        'Copy mobile/.env.example to mobile/.env and add your Firebase web config.'
      );
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Email and password are required.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err) {
      Alert.alert('Something went wrong', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </Text>
          <Text style={styles.sub}>
            {mode === 'signup'
              ? "You'll get paired with your partner next."
              : 'Sign in to pick up where you left off.'}
          </Text>

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />

          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            disabled={busy}
            onPress={onSubmit}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'signup' ? 'Create account' : 'Sign in'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            style={styles.switch}
          >
            <Text style={styles.switchText}>
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : "New here? Create an account"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, gap: 14 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 12,
  },
  sub: { fontSize: 15, color: colors.textMuted, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switch: { alignItems: 'center', marginTop: 12 },
  switchText: { color: colors.accent, fontSize: 14, fontWeight: '500' },
});
