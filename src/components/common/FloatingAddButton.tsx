import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';

type FloatingAddButtonProps = { label: string; onPress: () => void };

export function FloatingAddButton({ label, onPress }: FloatingAddButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Ionicons color={colors.accentText} name="add" size={28} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 28,
    bottom: 12,
    elevation: 4,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 56,
  },
});
