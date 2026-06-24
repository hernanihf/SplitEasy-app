import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Font, type ThemeColors } from '@/constants/design';
import { PENDING_INVITE_KEY, useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';
import { setItem } from '@/lib/storage';

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { token: authToken, isLoading, api } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  useEffect(() => {
    if (isLoading || !token) return;

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
    <View style={styles.root}>
      <Text style={[styles.text, error && styles.error]}>{error ?? t('join.joining')}</Text>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  text: { color: Palette.muted, fontSize: 15, fontFamily: Font.sans, textAlign: 'center' },
  error: { color: Palette.red },
});
