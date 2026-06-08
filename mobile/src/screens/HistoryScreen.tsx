import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>History</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No prompts yet.</Text>
        <Text style={styles.emptySub}>
          Answered prompts will show up here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
