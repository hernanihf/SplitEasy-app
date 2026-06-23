import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { PENDING_INVITE_KEY, useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { setItem } from '@/lib/storage';

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { token: authToken, isLoading, api } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !token) return;

    // Not signed in yet: remember the invite and send them through login.
    // The groups screen resumes the join once authenticated.
    if (!authToken) {
      setItem(PENDING_INVITE_KEY, token).then(() => router.replace('/login'));
      return;
    }

    api
      .post<{ id: number }>('/api/v1/groups/join', { token })
      .then((group) => router.replace(`/groups/${group.id}`))
      .catch(() => setError(t('join.error')));
  }, [token, authToken, isLoading, api]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="default">{error ?? t('join.joining')}</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
});
