import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AppStore } from '../../hooks/useAppState';
import { groupByHouse } from '../../lib/shopping';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ActionButton } from '../common/ActionButton';
import { ChipRow } from '../common/ChipRow';
import { confirmAction } from '../common/confirmAction';
import { AddItemRow } from './AddItemRow';
import { ShoppingItemRow } from './ShoppingItemRow';

const ALL = 'all';

export function ShoppingScreen({ store }: { store: AppStore }) {
  const { houses, shoppingItems } = store.state;
  const [filterId, setFilterId] = useState(ALL);
  const [chosenHouseId, setChosenHouseId] = useState('');

  // Both ids can point to a house that was deleted in Manutenção; fall back safely.
  const filter = houses.some((house) => house.id === filterId) ? filterId : ALL;
  const chosenId = houses.some((house) => house.id === chosenHouseId)
    ? chosenHouseId
    : houses[0].id;
  const targetHouseId = filter === ALL ? chosenId : filter;

  const groups = groupByHouse(store.state, filter);
  const houseOptions = houses.map((house) => ({ id: house.id, label: house.name }));
  const hasBought = shoppingItems.some((item) => item.bought);
  const isEmpty = groups.every((group) => group.items.length === 0);

  async function handleClearBought() {
    const confirmed = await confirmAction(
      'Limpar comprados',
      'Remover da lista todos os itens comprados?',
      'Limpar',
    );
    if (confirmed) store.clearBoughtItems();
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ChipRow
        onSelect={setFilterId}
        options={[{ id: ALL, label: 'Todas' }, ...houseOptions]}
        selectedId={filter}
      />
      <AddItemRow onAdd={(name) => store.addShoppingItem(name, targetHouseId)} />
      {filter === ALL ? (
        <ChipRow
          onSelect={setChosenHouseId}
          options={houseOptions}
          selectedId={targetHouseId}
        />
      ) : null}
      {isEmpty ? <Text style={styles.empty}>Nenhum item na lista.</Text> : null}
      {groups.map((group) => (
        <View key={group.house.id}>
          {filter === ALL ? <Text style={styles.group}>{group.house.name}</Text> : null}
          {group.items.map((item) => (
            <ShoppingItemRow
              item={item}
              key={item.id}
              onDelete={() => store.deleteShoppingItem(item.id)}
              onToggle={() => store.toggleShoppingItem(item.id)}
            />
          ))}
        </View>
      ))}
      {hasBought ? (
        <ActionButton
          icon="trash-bin-outline"
          label="Limpar comprados"
          onPress={handleClearBought}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingBottom: 12,
  },
  group: {
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 8,
    ...typography.sectionTitle,
  },
  empty: {
    color: colors.textSecondary,
    ...typography.body,
  },
});
