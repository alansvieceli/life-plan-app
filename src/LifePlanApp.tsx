import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from './components/common/AppHeader';
import { TabBar, type TabItem } from './components/common/TabBar';
import { MaintenanceScreen } from './components/maintenance/MaintenanceScreen';
import { useAppState } from './hooks/useAppState';
import { colors } from './theme/colors';
import { typography } from './theme/typography';

type AppTab = 'week' | 'shopping' | 'maintenance';

const tabs: TabItem<AppTab>[] = [
  { id: 'week', icon: 'calendar-outline', label: 'Semana' },
  { id: 'shopping', icon: 'cart-outline', label: 'Compras' },
  { id: 'maintenance', icon: 'settings-outline', label: 'Manutenção' },
];

export function LifePlanApp() {
  const insets = useSafeAreaInsets();
  const store = useAppState();
  const [activeTab, setActiveTab] = useState<AppTab>('week');
  const { isLoaded } = store;

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync();
  }, [isLoaded]);

  if (!isLoaded) return null;

  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom },
      ]}
    >
      <AppHeader />
      {store.saveError ? <Text style={styles.error}>{store.saveError}</Text> : null}
      <View style={styles.content}>
        {activeTab === 'maintenance' ? (
          <MaintenanceScreen store={store} />
        ) : (
          <Text style={styles.sectionTitle}>{activeLabel}</Text>
        )}
      </View>
      <TabBar activeTab={activeTab} onChangeTab={setActiveTab} tabs={tabs} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: colors.textSecondary,
    ...typography.sectionTitle,
  },
  error: {
    color: colors.negative,
    paddingHorizontal: 20,
    paddingBottom: 8,
    ...typography.bodySmall,
  },
});
