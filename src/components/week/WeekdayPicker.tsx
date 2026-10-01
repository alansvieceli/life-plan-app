import { Pressable, StyleSheet, Text, View } from 'react-native';

import { weekdayLetter, weekdayName } from '../../lib/dates';
import { colors } from '../../theme/colors';
import { sharedStyles } from '../../theme/sharedStyles';
import { typography } from '../../theme/typography';

type WeekdayPickerProps = { selected: number[]; onChange: (days: number[]) => void };

export function WeekdayPicker({ selected, onChange }: WeekdayPickerProps) {
  function toggle(day: number) {
    onChange(
      selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day],
    );
  }

  return (
    <View style={styles.row}>
      {[0, 1, 2, 3, 4, 5, 6].map((day) => {
        const name = weekdayName(day);
        const isSelected = selected.includes(day);
        return (
          <Pressable
            accessibilityLabel={name}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            key={name}
            onPress={() => toggle(day)}
            style={[
              sharedStyles.dayTile,
              styles.day,
              isSelected ? sharedStyles.dayTileSelected : null,
            ]}
          >
            <Text style={[styles.letter, isSelected ? styles.letterSelected : null]}>
              {weekdayLetter(day)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  day: {
    minHeight: 44,
  },
  letter: {
    color: colors.textSecondary,
    ...typography.cardTitle,
  },
  letterSelected: {
    color: colors.accentText,
  },
});
