
import { Stack, useGlobalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, SafeAreaView } from 'react-native';
import { commonStyles } from '../styles/commonStyles';
import { useEffect, useMemo, useState } from 'react';
import { setupErrorLogging } from '../utils/errorLogger';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppProvider from './_app-provider';

const STORAGE_KEY = 'emulated_device';

export default function RootLayout() {
  const { emulate } = useGlobalSearchParams<{ emulate?: string }>();
  const [storedEmulate, setStoredEmulate] = useState<string | null>(null);

  useEffect(() => {
    setupErrorLogging();

    if (Platform.OS === 'web') {
      if (emulate) {
        try {
          localStorage.setItem(STORAGE_KEY, emulate);
          setStoredEmulate(emulate);
        } catch (e) {
          console.log('Failed to persist emulate flag', e);
          setStoredEmulate(emulate);
        }
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) setStoredEmulate(stored);
        } catch (e) {
          console.log('Failed to read emulate flag', e);
        }
      }
    }
  }, [emulate]);

  const emulateToUse = storedEmulate || emulate || null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutInner emulate={emulateToUse} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function RootLayoutInner({ emulate }: { emulate: string | null }) {
  const actualInsets = useSafeAreaInsets();

  const insetsToUse = useMemo(() => {
    if (Platform.OS !== 'web') return actualInsets;

    const simulatedInsets = {
      ios: { top: 47, bottom: 20, left: 0, right: 0 },
      android: { top: 40, bottom: 0, left: 0, right: 0 },
    } as const;

    if (!emulate) return actualInsets;
    return simulatedInsets[emulate as keyof typeof simulatedInsets] || actualInsets;
  }, [actualInsets, emulate]);

  return (
    <SafeAreaView
      style={[
        commonStyles.wrapper,
        {
          paddingTop: insetsToUse.top,
          paddingBottom: insetsToUse.bottom,
          paddingLeft: insetsToUse.left,
          paddingRight: insetsToUse.right,
        },
      ]}
    >
      <StatusBar style="dark" />
      <AppProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'default',
          }}
        />
      </AppProvider>
    </SafeAreaView>
  );
}
