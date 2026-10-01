import { Image, StyleSheet, Text, View } from 'react-native';

import { greetingText } from '../../lib/greeting';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export function AppHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          source={require('../../../assets/app-icon.png')}
          style={styles.icon}
        />
        <Text style={styles.brandName}>Life Plan</Text>
      </View>
      <Text style={styles.greeting}>{greetingText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    borderRadius: 10,
    height: 36,
    width: 36,
  },
  brandName: {
    color: colors.textPrimary,
    ...typography.sectionTitle,
  },
  greeting: {
    color: colors.textPrimary,
    ...typography.screenTitle,
  },
});
