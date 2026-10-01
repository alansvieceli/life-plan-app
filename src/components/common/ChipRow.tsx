import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type ChipOption<T extends string> = { id: T; label: string };

type ChipRowProps<T extends string> = {
  options: ChipOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
};

export function ChipRow<T extends string>({
  options,
  selectedId,
  onSelect,
}: ChipRowProps<T>) {
  return (
    <ScrollView
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map((option) => {
        const isSelected = option.id === selectedId;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[styles.chip, isSelected ? styles.chipSelected : null]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, isSelected ? styles.labelSelected : null]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
    paddingVertical: 4,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    color: colors.textSecondary,
    ...typography.button,
  },
  labelSelected: {
    color: colors.accentText,
  },
});
