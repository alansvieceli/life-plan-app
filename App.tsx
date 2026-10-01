import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LifePlanApp } from './src/LifePlanApp';

SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LifePlanApp />
    </SafeAreaProvider>
  );
}
