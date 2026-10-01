import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';
import type { IconName } from './IconName';

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
};

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.textSecondary,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
    >
      <Ionicons color={color} name={icon} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
