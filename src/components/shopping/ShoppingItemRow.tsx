import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ShoppingItem } from '../../lib/appState';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { IconButton } from '../common/IconButton';

type ShoppingItemRowProps = {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
};

export function ShoppingItemRow({ item, onToggle, onDelete }: ShoppingItemRowProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={item.name}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.bought }}
        onPress={onToggle}
        style={styles.main}
      >
        <Ionicons
          color={item.bought ? colors.positive : colors.border}
          name={item.bought ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
        />
        <Text style={[styles.name, item.bought ? styles.nameBought : null]}>
          {item.name}
        </Text>
      </Pressable>
      <IconButton
        icon="trash-outline"
        label={`Excluir ${item.name}`}
        onPress={onDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 12,
  },
  main: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
  },
  name: {
    color: colors.textPrimary,
    flex: 1,
    ...typography.cardTitle,
  },
  nameBought: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});
