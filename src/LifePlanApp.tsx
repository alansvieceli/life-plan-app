import { Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from './components/common/AppHeader';
import { TabBar, type TabItem } from './components/common/TabBar';
import { MaintenanceScreen } from './components/maintenance/MaintenanceScreen';
import { ShoppingScreen } from './components/shopping/ShoppingScreen';
import { WeekScreen } from './components/week/WeekScreen';
import { useAppState } from './hooks/useAppState';
import { useDeviceSetting } from './hooks/useDeviceSetting';
import { useOnForeground } from './hooks/useOnForeground';
import { useReminders } from './hooks/useReminders';
import {
  DEFAULT_RETENTION_SETTINGS,
  normalizeRetentionSettings,
} from './lib/retention';
import { syncReminders } from './lib/syncReminders';
import { colors } from './theme/colors';
import { typography } from './theme/typography';

const RETENTION_KEY = '@life-plan-app/retention/v1';

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
  const retention = useDeviceSetting(
    RETENTION_KEY,
    DEFAULT_RETENTION_SETTINGS,
    normalizeRetentionSettings,
  );
  const hasPurged = useRef(false);
  const hasRolledOver = useRef(false);
  const [activeTab, setActiveTab] = useState<AppTab>('week');
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold });
  // A font failure falls back to the system serif instead of holding the splash.
  const isReady = store.isLoaded && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  // After a failed read the state is the empty default; syncing it would cancel the
  // reminders of the data that is still safely stored.
  useEffect(() => {
    if (!store.isLoaded || store.loadFailed || !reminders.isLoaded) return;
    if (reminders.hasPermission === null) return;
    syncReminders(store.state, reminders.settings, reminders.hasPermission);
  }, [
    store.isLoaded,
    store.loadFailed,
    store.state,
    reminders.isLoaded,
    reminders.settings,
    reminders.hasPermission,
  ]);

  // Cleanup runs once per start, after both the data and the period are loaded.
  // A failed read of the period leaves the default in place, which must never be
  // used to delete data the user chose to keep longer.
  useEffect(() => {
    if (hasPurged.current || !store.isLoaded || !retention.isLoaded) return;
    if (retention.loadFailed) return;
    hasPurged.current = true;
    store.purgeOldOneOffs(retention.value.keepDays);
  }, [store, retention.isLoaded, retention.loadFailed, retention.value.keepDays]);

  // Like the cleanup, never after a failed read: the state is the empty default then.
  useEffect(() => {
    if (hasRolledOver.current || !store.isLoaded || store.loadFailed) return;
    hasRolledOver.current = true;
    store.rollOverTasks();
  }, [store]);

  // Moves unfinished tasks when the app stays in the background across midnight.
  useOnForeground(() => {
    if (store.isLoaded && !store.loadFailed) store.rollOverTasks();
  });

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
          <MaintenanceScreen
            reminders={reminders}
            retention={retention}
            store={store}
          />
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
