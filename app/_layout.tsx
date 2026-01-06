import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LocalizationProvider } from '@/context/LocalizationContext';
import { migrateDbIfNeeded } from '@/db/database';
import { processRecurringTransactions } from '@/utils/recurringService';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // const inAuthGroup = segments[0] === '(auth)';
    // Check if on login screen
    const inLogin = segments[0] === 'login';

    if (!user && !inLogin) {
      // Redirect to login if not logged in
      router.replace('/login');
    } else if (user && inLogin) {
      // Redirect to home if logged in
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
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

  return (
    <RootLayoutNav />
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider databaseName="expense.db" onInit={async (db) => {
      await migrateDbIfNeeded(db);
      await processRecurringTransactions(db);
    }}>
      <LocalizationProvider>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <InitialLayout />
          </ThemeProvider>
        </AuthProvider>
      </LocalizationProvider>
    </SQLiteProvider>
  );
}
