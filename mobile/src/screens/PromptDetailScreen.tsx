import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPrompt } from '../lib/prompts';
import { SLOT_LABEL, type PromptDoc } from '../lib/types';
import type { RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'PromptDetail'>;

export function PromptDetailScreen({ navigation, route }: Props) {
  const { promptId } = route.params;
  const { coupleId, user, couple } = useAppState();
  const [prompt, setPrompt] = useState<PromptDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;
    let cancelled = false;
    fetchPrompt(coupleId, promptId)
      .then((p) => {
        if (!cancelled) setPrompt(p);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coupleId, promptId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!prompt || !user || !couple) {
    return (
      <SafeAreaView style={styles.container}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text style={styles.missing}>Prompt not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const myUid = user.uid;
  const partnerUid = couple.members.find((m) => m !== myUid) ?? null;
  const myAnswer = prompt.answers?.[myUid]?.text ?? '(empty)';
  const partnerAnswer = partnerUid
    ? prompt.answers?.[partnerUid]?.text ?? '(empty)'
    : '(empty)';

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.date}>
          {prompt.promptDate}
          {prompt.slot ? ` · ${SLOT_LABEL[prompt.slot]}` : ''}
        </Text>
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>{prompt.promptText}</Text>
        </View>
        <View style={styles.answerBlock}>
          <Text style={styles.answerLabel}>You</Text>
          <Text style={styles.answerText}>{myAnswer}</Text>
        </View>
        <View style={styles.answerBlock}>
          <Text style={styles.answerLabel}>Partner</Text>
          <Text style={styles.answerText}>{partnerAnswer}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { color: colors.accent, fontSize: 16, fontWeight: '500' },
  scroll: { padding: 20, gap: 14 },
  date: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { fontSize: 15, color: colors.textMuted },
});
