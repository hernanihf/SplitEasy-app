import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth';

// On web, the OAuth redirect lands here directly (no in-app browser to close).
// On native, expo-web-browser intercepts this URL before it ever renders, but
// we keep this screen so deep links opened outside that flow still resolve.
export default function AuthCallbackScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { signIn } = useAuth();

  useEffect(() => {
    if (typeof token === 'string') {
      signIn(token).then(() => router.replace('/'));
    } else {
      router.replace('/login');
    }
  }, [token]);

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText>Iniciando sesión…</ThemedText>
    </ThemedView>
  );
}
