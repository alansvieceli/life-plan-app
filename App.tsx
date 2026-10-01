import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LifePlanApp } from './src/LifePlanApp';

SplashScreen.preventAutoHideAsync();

export default function App() {
  // Plan 002 will hide the splash only after the saved state has loaded.
  return (
    <SafeAreaProvider onLayout={() => SplashScreen.hideAsync()}>
      <StatusBar style="dark" />
      <LifePlanApp />
    </SafeAreaProvider>
  );
}
