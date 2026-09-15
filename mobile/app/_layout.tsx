import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="listing/[id]" options={{ headerShown: true, headerTitle: '', headerTintColor: colors.ink, headerShadowVisible: false }} />
          <Stack.Screen name="scout-dashboard" options={{ headerShown: true, headerTitle: 'Scout dashboard', headerTintColor: colors.ink, headerShadowVisible: false }} />
          <Stack.Screen name="login" options={{ presentation: 'modal', headerShown: true, headerTitle: 'Sign in', headerTintColor: colors.ink, headerShadowVisible: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
