import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
} from '@expo-google-fonts/geist-mono';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/design';
import { AuthProvider, useAuth } from '@/lib/auth';

// Max content width: the app is mobile-first, so on wide (web/desktop)
// viewports we centre it in a phone-sized column instead of stretching.
const MAX_WIDTH = 480;

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
  const [fontsLoaded] = useFonts({
    Geist: Geist_400Regular,
    'Geist-Medium': Geist_500Medium,
    'Geist-Semibold': Geist_600SemiBold,
    'Geist-Bold': Geist_700Bold,
    GeistMono: GeistMono_400Regular,
    'GeistMono-Medium': GeistMono_500Medium,
    'GeistMono-Semibold': GeistMono_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Palette.bg }} />;
  }

  return (
    <AuthProvider>
      <View style={styles.canvas}>
        <View style={styles.column}>
          <AuthGate>
            <Slot />
          </AuthGate>
        </View>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: '#E7E5DF', alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, backgroundColor: Palette.bg, overflow: 'hidden' },
});
