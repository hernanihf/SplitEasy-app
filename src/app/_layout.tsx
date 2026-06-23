import { DarkTheme, DefaultTheme, Slot, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthFlow =
      segments[0] === 'login' || segments[0] === 'auth' || segments[0] === 'join';

    if (!token && !inAuthFlow) {
      router.replace('/login');
    } else if (token && segments[0] === 'login') {
      router.replace('/');
    }
  }, [token, isLoading, segments]);

  if (isLoading) return null;

  return children;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <AuthGate>
          <Slot />
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
