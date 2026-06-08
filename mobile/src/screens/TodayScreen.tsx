import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export function TodayScreen() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.date}>{today}</Text>
        <Text style={styles.heading}>Today's prompt</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.placeholder}>
          Your daily prompt will appear here.
        </Text>
        <Text style={styles.placeholderSmall}>
          (Connect Firebase to start receiving prompts.)
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
    gap: 4,
  },
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  placeholder: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 26,
  },
  placeholderSmall: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
