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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pullPromptForToday, submitAnswer } from '../lib/prompts';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';
import type { PromptDoc } from '../lib/types';

export function TodayScreen() {
  const { user, couple, todayPrompt } = useAppState();
  const [pulling, setPulling] = useState(false);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (!couple || !user) return null;

  const myUid = user.uid;
  const myAnswer = todayPrompt?.answers?.[myUid]?.text ?? null;
  const partnerUid = couple.members.find((m) => m !== myUid) ?? null;
  const partnerAnswer = partnerUid
    ? todayPrompt?.answers?.[partnerUid]?.text ?? null
    : null;

  const state: 'no-prompt' | 'compose' | 'waiting' | 'reveal' = !todayPrompt
    ? 'no-prompt'
    : !myAnswer
      ? 'compose'
      : !todayPrompt.unlockedAt
        ? 'waiting'
        : 'reveal';

  const onPull = async () => {
    setPulling(true);
    try {
      await pullPromptForToday(couple.id, couple.primaryTimezone);
    } catch (err) {
      Alert.alert("Couldn't fetch a prompt", (err as Error).message);
    } finally {
      setPulling(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.heading}>Today's prompt</Text>
          </View>

          {state === 'no-prompt' && (
            <NoPromptState onPull={onPull} pulling={pulling} />
          )}
          {state === 'compose' && (
            <ComposeState
              prompt={todayPrompt!}
              onSubmit={(text) =>
                submitAnswer(couple.id, todayPrompt!.id, myUid, text)
              }
            />
          )}
          {state === 'waiting' && (
            <WaitingState prompt={todayPrompt!} myAnswer={myAnswer!} />
          )}
          {state === 'reveal' && (
            <RevealState
              prompt={todayPrompt!}
              myUid={myUid}
              partnerUid={partnerUid}
              myAnswer={myAnswer!}
              partnerAnswer={partnerAnswer ?? ''}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PromptCard({ text }: { text: string }) {
  return (
    <View style={styles.promptCard}>
      <Text style={styles.promptText}>{text}</Text>
    </View>
  );
}

function NoPromptState({
  onPull,
  pulling,
}: {
  onPull: () => void;
  pulling: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>No prompt yet today</Text>
      <Text style={styles.cardSub}>
        Once the daily Cloud Function is live, prompts will arrive automatically.
        For now, pull one to start.
      </Text>
      <Pressable
        style={[styles.button, pulling && styles.buttonDisabled]}
        disabled={pulling}
        onPress={onPull}
      >
        {pulling ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pull today's prompt</Text>
        )}
      </Pressable>
    </View>
  );
}

function ComposeState({
  prompt,
  onSubmit,
}: {
  prompt: PromptDoc;
  onSubmit: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!text.trim()) {
      Alert.alert('Empty answer', 'Write something first.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(text.trim());
    } catch (err) {
      Alert.alert("Couldn't submit", (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PromptCard text={prompt.promptText} />
      <TextInput
        style={styles.answerInput}
        placeholder="Your answer…"
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
      />
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        disabled={busy}
        onPress={submit}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Lock in answer</Text>
        )}
      </Pressable>
      <Text style={styles.fineprint}>
        Your answer stays hidden until your partner answers too.
      </Text>
    </>
  );
}

function WaitingState({
  prompt,
  myAnswer,
}: {
  prompt: PromptDoc;
  myAnswer: string;
}) {
  return (
    <>
      <PromptCard text={prompt.promptText} />
      <View style={styles.answerBlock}>
        <Text style={styles.answerLabel}>Your answer</Text>
        <Text style={styles.answerText}>{myAnswer}</Text>
      </View>
      <View style={styles.waitingBlock}>
        <Text style={styles.waitingText}>Waiting for your partner…</Text>
        <Text style={styles.waitingSub}>
          You'll see both answers as soon as they reply.
        </Text>
      </View>
    </>
  );
}

function RevealState({
  prompt,
  myUid,
  partnerUid,
  myAnswer,
  partnerAnswer,
}: {
  prompt: PromptDoc;
  myUid: string;
  partnerUid: string | null;
  myAnswer: string;
  partnerAnswer: string;
}) {
  return (
    <>
      <PromptCard text={prompt.promptText} />
      <View style={styles.answerBlock}>
        <Text style={styles.answerLabel}>You</Text>
        <Text style={styles.answerText}>{myAnswer}</Text>
      </View>
      <View style={styles.answerBlock}>
        <Text style={styles.answerLabel}>Partner</Text>
        <Text style={styles.answerText}>{partnerAnswer || '(empty)'}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, gap: 14 },
  header: { paddingTop: 4, paddingBottom: 8, gap: 4 },
  date: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  promptCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    padding: 22,
  },
  promptText: {
    fontSize: 20,
    lineHeight: 28,
    color: colors.text,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  answerInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    minHeight: 140,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  fineprint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  answerBlock: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  answerLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerText: { fontSize: 16, color: colors.text, lineHeight: 24 },
  waitingBlock: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
  },
  waitingText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  waitingSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
