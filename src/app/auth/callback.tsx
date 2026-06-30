import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Font, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

// On web, the OAuth redirect lands here directly. On native, expo-web-browser
// intercepts the URL before it renders, but we keep this screen so deep links
// opened outside that flow still resolve.
export default function AuthCallbackScreen() {
  // The backend puts the token in the URL fragment (#token=...), not a query
  // param, so it never reaches server/proxy access logs. expo-router's
  // search-param parsing only covers the query string, so the fragment has
  // to be read straight off window.location on web. The query-param fallback
  // covers any link still pointing at the old scheme.
  const { token: queryToken } = useLocalSearchParams<{ token?: string }>();
  const { signIn } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  useEffect(() => {
    const hashToken =
      Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash
        ? new URLSearchParams(window.location.hash.slice(1)).get('token')
        : null;
    const token = hashToken ?? (typeof queryToken === 'string' ? queryToken : null);

    if (token) {
      signIn(token).then(() => router.replace('/'));
    } else {
      router.replace('/login');
    }
  }, [queryToken]);

  return (
    <View style={styles.root}>
      <Text style={styles.text}>{t('auth.signingIn')}</Text>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: Palette.bg, alignItems: 'center', justifyContent: 'center' },
    text: { color: Palette.muted, fontSize: 15, fontFamily: Font.sans },
  });
