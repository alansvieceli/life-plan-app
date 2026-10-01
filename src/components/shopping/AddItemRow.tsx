import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { IconButton } from '../common/IconButton';

export function AddItemRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('');

  function submit() {
    if (name.trim() === '') return;
    onAdd(name);
    setName('');
  }

  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel="Nome do item"
        onChangeText={setName}
        onSubmitEditing={submit}
        placeholder="Adicionar item"
        placeholderTextColor={colors.textSecondary}
        returnKeyType="done"
        style={styles.input}
        value={name}
      />
      <IconButton
        color={colors.accent}
        icon="add-circle"
        label="Adicionar item"
        onPress={submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    ...typography.input,
  },
});
