import { Pressable, StyleSheet, Text, View } from 'react-native';

import { toDateKey, weekdayLetter } from '../../lib/dates';
import { colors } from '../../theme/colors';
import { sharedStyles } from '../../theme/sharedStyles';
import { typography } from '../../theme/typography';

type DayStripProps = {
  days: Date[];
  selectedKey: string;
  todayKey: string;
  onSelect: (key: string) => void;
  hasPending: (key: string) => boolean;
};

export function DayStrip({
  days,
  selectedKey,
  todayKey,
  onSelect,
  hasPending,
}: DayStripProps) {
  return (
    <View style={styles.row}>
      {days.map((day) => {
        const key = toDateKey(day);
        const isSelected = key === selectedKey;
        const textColor = isSelected ? colors.accentText : colors.textPrimary;
        return (
          <Pressable
            accessibilityLabel={`Dia ${day.getDate()}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={key}
            onPress={() => onSelect(key)}
            style={[
              sharedStyles.dayTile,
              styles.day,
              isSelected ? sharedStyles.dayTileSelected : null,
              key === todayKey && !isSelected ? styles.dayToday : null,
            ]}
          >
            <Text
              style={[
                styles.letter,
                { color: isSelected ? colors.accentText : colors.textSecondary },
              ]}
            >
              {weekdayLetter(day.getDay())}
            </Text>
            <Text style={[styles.number, { color: textColor }]}>{day.getDate()}</Text>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: hasPending(key)
                    ? isSelected
                      ? colors.accentText
                      : colors.accent
                    : 'transparent',
                },
              ]}
            />
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
    minHeight: 52,
    paddingVertical: 6,
  },
  dayToday: {
    borderColor: colors.accent,
  },
  letter: {
    ...typography.label,
  },
  number: {
    ...typography.cardTitle,
  },
  dot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
});
