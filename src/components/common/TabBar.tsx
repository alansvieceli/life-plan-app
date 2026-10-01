import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type TabItem<T extends string> = {
  id: T;
  icon: IconName;
  label: string;
};

type TabBarProps<T extends string> = {
  activeTab: T;
  onChangeTab: (tab: T) => void;
  tabs: TabItem<T>[];
};

export function TabBar<T extends string>({
  activeTab,
  onChangeTab,
  tabs,
}: TabBarProps<T>) {
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const color = isActive ? colors.accentText : colors.textSecondary;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={tab.id}
              onPress={() => onChangeTab(tab.id)}
              style={[styles.tab, isActive ? styles.tabActive : null]}
            >
              <Ionicons color={color} name={tab.icon} size={20} />
              <Text numberOfLines={1} style={[styles.label, { color }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  bar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 5,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    gap: 1,
    paddingVertical: 6,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  label: {
    ...typography.tab,
  },
});
