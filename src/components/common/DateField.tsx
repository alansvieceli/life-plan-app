import { StyleSheet, Text, View } from 'react-native';

import { addDays, formatDayTitle, parseDateKey, toDateKey } from '../../lib/dates';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { IconButton } from './IconButton';

type DateFieldProps = { dateKey: string; onChange: (dateKey: string) => void };

export function DateField({ dateKey, onChange }: DateFieldProps) {
  function shift(days: number) {
    onChange(toDateKey(addDays(parseDateKey(dateKey), days)));
  }

  return (
    <View style={styles.row}>
      <IconButton
        color={colors.textPrimary}
        icon="chevron-back"
        label="Dia anterior"
        onPress={() => shift(-1)}
      />
      <Text style={styles.date}>{formatDayTitle(parseDateKey(dateKey))}</Text>
      <IconButton
        color={colors.textPrimary}
        icon="chevron-forward"
        label="Próximo dia"
        onPress={() => shift(1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    color: colors.textPrimary,
    ...typography.cardTitle,
  },
});
