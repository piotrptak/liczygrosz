import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LocalizationProvider } from '@/context/LocalizationContext';
import { migrateDbIfNeeded } from '@/db/database';
import { processRecurringTransactions } from '@/utils/recurringService';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
    ...Ionicons.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // expo-sqlite needs SharedArrayBuffer on the web. On the first visit the page reloads
  // once the service worker is active (see public/index.html); until then do not open the database.
  if (Platform.OS === 'web' && !window.crossOriginIsolated) {
    return <WaitingForIsolation />;
  }

  return <RootLayoutNav />;
}

function WaitingForIsolation() {
  const colors = Colors[useColorScheme() ?? 'light'];
  const supported = 'serviceWorker' in navigator;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background }}>
      {supported && <ActivityIndicator size="large" color={colors.primary} />}
      <Text style={{ color: colors.textSecondary, marginTop: 16, textAlign: 'center' }}>
        {supported
          ? 'Uruchamianie… Jeśli ekran się nie zmienia, odśwież stronę.\nStarting… If nothing happens, reload the page.'
          : 'Ta przeglądarka nie obsługuje LiczyGrosz. Użyj aktualnego Chrome, Edge, Firefox lub Safari.\nThis browser is not supported.'}
      </Text>
    </View>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="expense.db" onInit={async (db) => {
        await migrateDbIfNeeded(db);
        await processRecurringTransactions(db);
      }}>
        <LocalizationProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="transaction/[id]" />
              <Stack.Screen name="categories/manage" />
              <Stack.Screen name="recurring/manage" />
            </Stack>
          </ThemeProvider>
        </LocalizationProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
