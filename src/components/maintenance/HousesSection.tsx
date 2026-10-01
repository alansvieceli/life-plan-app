import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { House } from '../../lib/appState';
import type { DeleteBlock } from '../../lib/houses';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { confirmAction } from '../common/confirmAction';
import { IconButton } from '../common/IconButton';
import { SectionCard } from '../common/SectionCard';

type HousesSectionProps = {
  houses: House[];
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  getDeleteBlock: (id: string) => DeleteBlock | null;
};

const deleteMessages: Record<DeleteBlock, string> = {
  'has-items': 'Mova ou exclua os itens desta casa antes.',
  'last-house': 'É preciso manter ao menos uma casa.',
};

export function HousesSection({
  houses,
  onAdd,
  onRename,
  onDelete,
  getDeleteBlock,
}: HousesSectionProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleDelete(house: House) {
    const block = getDeleteBlock(house.id);
    if (block) {
      setMessage(deleteMessages[block]);
      return;
    }
    const confirmed = await confirmAction(
      'Excluir casa',
      `Excluir "${house.name}"?`,
      'Excluir',
    );
    if (!confirmed) return;
    setMessage(null);
    onDelete(house.id);
  }

  return (
    <SectionCard title="Casas">
      {houses.map((house) => (
        <HouseRow
          house={house}
          key={`${house.id}:${house.name}`}
          onDelete={() => handleDelete(house)}
          onRename={onRename}
        />
      ))}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <AddHouseRow onAdd={onAdd} />
    </SectionCard>
  );
}

function AddHouseRow({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.addRow}>
      <IconButton
        color={colors.accent}
        icon="add-circle-outline"
        label="Adicionar casa"
        onPress={onAdd}
      />
      <Text style={styles.addLabel}>Adicionar casa</Text>
    </View>
  );
}

type HouseRowProps = {
  house: House;
  onRename: (id: string, name: string) => void;
  onDelete: () => void;
};

function HouseRow({ house, onRename, onDelete }: HouseRowProps) {
  const [draft, setDraft] = useState(house.name);

  function commit() {
    if (draft.trim() === '') {
      setDraft(house.name);
      return;
    }
    onRename(house.id, draft);
  }

  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel={`Nome da casa ${house.name}`}
        onChangeText={setDraft}
        onEndEditing={commit}
        style={styles.input}
        value={draft}
      />
      <IconButton
        icon="trash-outline"
        label={`Excluir ${house.name}`}
        onPress={onDelete}
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
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    color: colors.textPrimary,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    ...typography.input,
  },
  message: {
    color: colors.negative,
    ...typography.bodySmall,
  },
  addRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  addLabel: {
    color: colors.accent,
    ...typography.button,
  },
});
