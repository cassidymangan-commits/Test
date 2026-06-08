import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Profile</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Display name</Text>
        <Text style={styles.rowValue}>—</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Partner</Text>
        <Text style={styles.rowValue}>Not paired yet</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Daily notification</Text>
        <Text style={styles.rowValue}>—</Text>
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
    paddingBottom: 16,
  },
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
  },
  rowLabel: {
    fontSize: 15,
    color: colors.text,
  },
  rowValue: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
