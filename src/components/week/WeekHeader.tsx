import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { IconButton } from '../common/IconButton';

type WeekHeaderProps = {
  weekNumber: number;
  title: string;
  onPrevious: () => void;
  onNext: () => void;
};

export function WeekHeader({ weekNumber, title, onPrevious, onNext }: WeekHeaderProps) {
  return (
    <View style={styles.row}>
      <IconButton
        color={colors.textPrimary}
        icon="chevron-back"
        label="Semana anterior"
        onPress={onPrevious}
      />
      <View style={styles.center}>
        <Text style={styles.eyebrow}>{`Semana ${weekNumber}`}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <IconButton
        color={colors.textPrimary}
        icon="chevron-forward"
        label="Próxima semana"
        onPress={onNext}
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
  center: {
    alignItems: 'center',
  },
  eyebrow: {
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    ...typography.label,
  },
  title: {
    color: colors.textPrimary,
    ...typography.screenTitle,
  },
});
