import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PrintItem } from '../../lib/appState';
import { urlHost } from '../../lib/printItems';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { IconButton } from '../common/IconButton';

type PrintItemRowProps = {
  item: PrintItem;
  linkError: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
};

export function PrintItemRow({
  item,
  linkError,
  onToggle,
  onOpen,
  onDelete,
}: PrintItemRowProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={`Marcar ${item.title}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.printed }}
        onPress={onToggle}
        style={styles.check}
      >
        <Ionicons
          color={item.printed ? colors.positive : colors.border}
          name={item.printed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
        />
      </Pressable>
      <Pressable
        accessibilityLabel={`Abrir ${item.title}`}
        accessibilityRole="link"
        onPress={onOpen}
        style={styles.main}
      >
        <Text style={[styles.name, item.printed ? styles.namePrinted : null]}>
          {item.title}
        </Text>
        <Text style={linkError ? styles.error : styles.host}>
          {linkError ? 'Não foi possível abrir o link.' : urlHost(item.url)}
        </Text>
      </Pressable>
      <IconButton icon="open-outline" label={`Abrir ${item.title}`} onPress={onOpen} />
      <IconButton
        icon="trash-outline"
        label={`Excluir ${item.title}`}
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
  check: {
    justifyContent: 'center',
    minHeight: 48,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 10,
  },
  name: {
    color: colors.textPrimary,
    ...typography.cardTitle,
  },
  namePrinted: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  host: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  error: {
    color: colors.negative,
    ...typography.bodySmall,
  },
});
