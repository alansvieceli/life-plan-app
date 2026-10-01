import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type NumberPairFieldProps = {
  label: string;
  separator: string;
  first: { value: string; label: string; onChange: (value: string) => void };
  second: { value: string; label: string; onChange: (value: string) => void };
};

export function NumberPairField({
  label,
  separator,
  first,
  second,
}: NumberPairFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <NumberInput {...first} />
        <Text style={styles.separator}>{separator}</Text>
        <NumberInput {...second} />
      </View>
    </View>
  );
}

function NumberInput({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextInput
      accessibilityLabel={label}
      keyboardType="number-pad"
      maxLength={2}
      onChangeText={onChange}
      selectTextOnFocus
      style={styles.input}
      value={value}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 4,
  },
  label: {
    color: colors.textSecondary,
    ...typography.label,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.textPrimary,
    minHeight: 44,
    minWidth: 64,
    textAlign: 'center',
    ...typography.input,
  },
  separator: {
    color: colors.textSecondary,
    ...typography.cardTitle,
  },
});
