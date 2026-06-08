import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPromptHistory } from '../lib/prompts';
import { SLOT_LABEL, type PromptDoc } from '../lib/types';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/colors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'History'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HistoryScreen({ navigation }: Props) {
  const { coupleId } = useAppState();
  const [items, setItems] = useState<PromptDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!coupleId) return;
    setLoading(true);
    try {
      const list = await fetchPromptHistory(coupleId);
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>History</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={items.length === 0 ? styles.emptyWrap : styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No revealed prompts yet.</Text>
              <Text style={styles.emptySub}>
                Once you and your partner both answer, the prompt shows up here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate('PromptDetail', { promptId: item.id })
            }
          >
            <Text style={styles.rowDate}>
              {item.promptDate}
              {item.slot ? ` · ${SLOT_LABEL[item.slot]}` : ''}
            </Text>
            <Text style={styles.rowText} numberOfLines={2}>
              {item.promptText}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  empty: { alignItems: 'center', gap: 6 },
  emptyText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  rowDate: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowText: { fontSize: 15, color: colors.text, lineHeight: 21 },
});
