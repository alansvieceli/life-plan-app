import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDuration, formatTimeRange } from '../../lib/formatters';
import type { Activity } from '../../lib/schedule';
import { activityColorFor } from '../../theme/activityColors';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type ActivityCardProps = { activity: Activity; onPress: () => void };

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const kindLabel = activity.kind === 'routine' ? 'Repete toda semana' : 'Só neste dia';
  return (
    <Pressable
      accessibilityHint="Toque para editar"
      accessibilityLabel={`${activity.title}, ${formatTimeRange(activity.startTime, activity.durationMin)}, ${kindLabel}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, { borderLeftColor: activityColorFor(activity.id) }]}
    >
      <View style={styles.text}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.time}>
          {`${formatTimeRange(activity.startTime, activity.durationMin)} · ${formatDuration(activity.durationMin)}`}
        </Text>
      </View>
      {activity.overlaps ? (
        <Ionicons color={colors.warning} name="alert-circle-outline" size={20} />
      ) : null}
      <Ionicons
        color={colors.textSecondary}
        name={activity.kind === 'routine' ? 'repeat' : 'calendar-outline'}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    ...typography.cardTitle,
  },
  time: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
});
