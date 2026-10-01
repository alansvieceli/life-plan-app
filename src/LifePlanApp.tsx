import { Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from './components/common/AppHeader';
import { TabBar, type TabItem } from './components/common/TabBar';
import { MaintenanceScreen } from './components/maintenance/MaintenanceScreen';
import { ShoppingScreen } from './components/shopping/ShoppingScreen';
import { WeekScreen } from './components/week/WeekScreen';
import { useAppState } from './hooks/useAppState';
import { useReminders } from './hooks/useReminders';
import { syncReminders } from './lib/syncReminders';
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
  const reminders = useReminders();
  const [activeTab, setActiveTab] = useState<AppTab>('week');
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold });
  // A font failure falls back to the system serif instead of holding the splash.
  const isReady = store.isLoaded && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  useEffect(() => {
    if (!store.isLoaded || !reminders.isLoaded || reminders.hasPermission === null) {
      return;
    }
    syncReminders(store.state, reminders.settings, reminders.hasPermission);
  }, [
    store.isLoaded,
    store.state,
    reminders.isLoaded,
    reminders.settings,
    reminders.hasPermission,
  ]);

  if (!isReady) return null;

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
        {activeTab === 'week' ? <WeekScreen store={store} /> : null}
        {activeTab === 'shopping' ? <ShoppingScreen store={store} /> : null}
        {activeTab === 'maintenance' ? (
          <MaintenanceScreen reminders={reminders} store={store} />
        ) : null}
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
  error: {
    color: colors.negative,
    paddingHorizontal: 20,
    paddingBottom: 8,
    ...typography.bodySmall,
  },
});
