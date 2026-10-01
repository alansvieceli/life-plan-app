import { StyleSheet, Switch, Text, View } from 'react-native';

import { REMINDER_MINUTES_OPTIONS, type ReminderSettings } from '../../lib/reminders';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ChipRow } from '../common/ChipRow';
import { SectionCard } from '../common/SectionCard';

type RemindersSectionProps = {
  settings: ReminderSettings;
  hasPermission: boolean | null;
  onToggle: (enabled: boolean) => void;
  onSelectMinutes: (minutes: number) => void;
};

const options = REMINDER_MINUTES_OPTIONS.map((minutes) => ({
  id: String(minutes),
  label: minutes === 60 ? '1 h' : `${minutes} min`,
}));

export function RemindersSection({
  settings,
  hasPermission,
  onToggle,
  onSelectMinutes,
}: RemindersSectionProps) {
  return (
    <SectionCard title="Lembretes">
      <View style={styles.row}>
        <Text style={styles.label}>Avisar antes dos eventos</Text>
        <Switch
          accessibilityLabel="Avisar antes dos eventos"
          onValueChange={onToggle}
          thumbColor={colors.surface}
          trackColor={{ false: colors.border, true: colors.accent }}
          value={settings.enabled}
        />
      </View>
      <Text style={styles.note}>Antecedência</Text>
      <ChipRow
        disabled={!settings.enabled}
        onSelect={(id) => onSelectMinutes(Number(id))}
        options={options}
        selectedId={String(settings.minutesBefore)}
      />
      {settings.enabled && hasPermission === false ? (
        <Text style={styles.warning}>
          Permita as notificações nas configurações do Android para receber os avisos.
        </Text>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textPrimary,
    flex: 1,
    ...typography.body,
  },
  note: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  warning: {
    color: colors.negative,
    ...typography.bodySmall,
  },
});
