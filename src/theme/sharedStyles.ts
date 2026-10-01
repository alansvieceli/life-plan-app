import { StyleSheet } from 'react-native';

import { colors } from './colors';

export const sharedStyles = StyleSheet.create({
  dayTile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  dayTileSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
