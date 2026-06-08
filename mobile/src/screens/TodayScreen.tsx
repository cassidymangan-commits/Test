import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pullPromptForSlot, submitAnswer } from '../lib/prompts';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';
import {
  SLOTS,
  SLOT_LABEL,
  type PromptDoc,
  type Slot,
} from '../lib/types';

export function TodayScreen() {
  const { user, couple, todaySlots } = useAppState();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (!couple || !user) return null;

  const myUid = user.uid;
  const partnerUid = couple.members.find((m) => m !== myUid) ?? null;
  const awaitingPartner = couple.members.length < 2;

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
            <Text style={styles.heading}>Today</Text>
          </View>

          {awaitingPartner ? (
            <AwaitingPartnerState inviteCode={couple.inviteCode} />
          ) : (
            SLOTS.map((slot) => (
              <SlotCard
                key={slot}
                slot={slot}
                slotTime={couple.notificationTimes[slot]}
                prompt={todaySlots[slot]}
                coupleId={couple.id}
                primaryTimezone={couple.primaryTimezone}
                myUid={myUid}
                partnerUid={partnerUid}
              />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AwaitingPartnerState({ inviteCode }: { inviteCode: string | null }) {
  const onShare = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: `Join me on LoveMaxxing — invite code: ${inviteCode}`,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Waiting for your partner</Text>
      <Text style={styles.cardSub}>
        Send them this code. The moment they join, today's prompts unlock.
      </Text>
      {inviteCode ? (
        <>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{inviteCode}</Text>
          </View>
          <Pressable style={styles.button} onPress={onShare}>
            <Text style={styles.buttonText}>Share code</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.cardSub}>
          Head to Profile to get a fresh invite code.
        </Text>
      )}
    </View>
  );
}

function SlotCard({
  slot,
  slotTime,
  prompt,
  coupleId,
  primaryTimezone,
  myUid,
  partnerUid,
}: {
  slot: Slot;
  slotTime: string;
  prompt: PromptDoc | null;
  coupleId: string;
  primaryTimezone: string;
  myUid: string;
  partnerUid: string | null;
}) {
  const [pulling, setPulling] = useState(false);
  const myAnswer = prompt?.answers?.[myUid]?.text ?? null;
  const partnerAnswer = partnerUid
    ? prompt?.answers?.[partnerUid]?.text ?? null
    : null;

  const state: 'no-prompt' | 'compose' | 'waiting' | 'reveal' = !prompt
    ? 'no-prompt'
    : !myAnswer
      ? 'compose'
      : !prompt.unlockedAt
        ? 'waiting'
        : 'reveal';

  const onPull = async () => {
    setPulling(true);
    try {
      await pullPromptForSlot(coupleId, primaryTimezone, slot);
    } catch (err) {
      Alert.alert("Couldn't fetch a prompt", (err as Error).message);
    } finally {
      setPulling(false);
    }
  };

  return (
    <View style={styles.slotWrap}>
      <View style={styles.slotHeader}>
        <Text style={styles.slotLabel}>{SLOT_LABEL[slot]}</Text>
        <Text style={styles.slotTime}>{formatTime(slotTime)}</Text>
      </View>

      {state === 'no-prompt' && (
        <View style={styles.card}>
          <Text style={styles.cardSub}>No prompt pulled yet.</Text>
          <Pressable
            style={[styles.button, pulling && styles.buttonDisabled]}
            disabled={pulling}
            onPress={onPull}
          >
            {pulling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Pull prompt</Text>
            )}
          </Pressable>
        </View>
      )}

      {state === 'compose' && prompt && (
        <ComposeBlock
          prompt={prompt}
          onSubmit={(text) => submitAnswer(coupleId, prompt.id, myUid, text)}
        />
      )}

      {state === 'waiting' && prompt && (
        <WaitingBlock prompt={prompt} myAnswer={myAnswer!} />
      )}

      {state === 'reveal' && prompt && (
        <RevealBlock
          prompt={prompt}
          myAnswer={myAnswer!}
          partnerAnswer={partnerAnswer ?? ''}
        />
      )}
    </View>
  );
}

function ComposeBlock({
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
      <View style={styles.promptCard}>
        <Text style={styles.promptText}>{prompt.promptText}</Text>
      </View>
      <TextInput
        style={styles.answerInput}
        placeholder="Your answer…"
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
        autoCorrect
        autoCapitalize="sentences"
        spellCheck
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
    </>
  );
}

function WaitingBlock({
  prompt,
  myAnswer,
}: {
  prompt: PromptDoc;
  myAnswer: string;
}) {
  return (
    <>
      <View style={styles.promptCard}>
        <Text style={styles.promptText}>{prompt.promptText}</Text>
      </View>
      <View style={styles.answerBlock}>
        <Text style={styles.answerLabel}>Your answer</Text>
        <Text style={styles.answerText}>{myAnswer}</Text>
      </View>
      <Text style={styles.waitingText}>Waiting for your partner…</Text>
    </>
  );
}

function RevealBlock({
  prompt,
  myAnswer,
  partnerAnswer,
}: {
  prompt: PromptDoc;
  myAnswer: string;
  partnerAnswer: string;
}) {
  return (
    <>
      <View style={styles.promptCard}>
        <Text style={styles.promptText}>{prompt.promptText}</Text>
      </View>
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

function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = ((h + 11) % 12) + 1;
  const displayMinute = m === 0 ? '' : `:${mStr.padStart(2, '0')}`;
  return `${displayHour}${displayMinute} ${period}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, gap: 18 },
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
  slotWrap: { gap: 10 },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  slotLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  slotTime: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  promptCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    padding: 22,
  },
  promptText: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  codeBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 8,
  },
  answerInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    minHeight: 100,
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  answerBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  answerLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  waitingText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 4,
  },
});
